import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { StringOutputParser } from '@langchain/core/output_parsers';

export const maxDuration = 300;

const quizSchema = z.object({
  questions: z.array(
    z.object({
      question_text: z.string().describe("The question being asked."),
      topic: z.string().describe("A short, specific topic for this question, e.g., 'Ohm's Law' or 'LVDT Sensitivity'."),
      question_type: z.enum(['MCQ', 'SAQ']).describe("The type of question: Multiple Choice or Short Answer."),
      options: z.array(z.string()).nullable().optional().describe("An array of 4 strings for MCQ options. Should be null for SAQ."),
      correct_answer: z.string().describe("The correct answer. For MCQs, this must exactly match one of the options."),
      explanation: z.string().describe("A brief explanation for why the answer is correct.")
    })
  ).describe("An array of quiz questions.")
});

const jsonParser = StructuredOutputParser.fromZodSchema(quizSchema);

export async function POST(req: Request) {
  let rawResponse = ''; 
  try {
    const body = await req.json();
    const { parentChatId } = body;

    if (!parentChatId) {
      return NextResponse.json({ error: 'parentChatId is required' }, { status: 400 });
    }
    
    const { data: topicData, error: topicError } = await supabase
        .from('chat_topics')
        .select('topics')
        .eq('chat_id', parentChatId)
        .single();
    
    if (topicError || !topicData) throw new Error('Could not find topics for this chat.');

    const topicList = (topicData.topics as string[]).join(', ');

    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('content')
      .like('chat_id', `${parentChatId}_%`)
      .limit(15);

    if (docError || !documents || documents.length === 0) {
      throw new Error(`Could not find documents for chat: ${parentChatId}`);
    }

    const context = documents.map(doc => doc.content).join('\n---\n').substring(0, 15000);

    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: "gemini-2.5-flash",
      temperature: 0.5,
    });
    
    const formatInstructions = jsonParser.getFormatInstructions();
    const prompt = PromptTemplate.fromTemplate(
      `You are an expert teacher. For each question, you MUST assign a "topic" by choosing the most relevant one from the provided list.
      Topic List: [{topic_list}]
      
      Based on the following context, generate a quiz with 2 Multiple Choice Questions and 1 Short Answer Question.
      
      {format_instructions}
      
      Context:
      {context}`
    );
    
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    rawResponse = await chain.invoke({ 
        context, 
        format_instructions: formatInstructions,
        topic_list: topicList 
    });

    const jsonMatch = rawResponse.match(/```(json)?([\s\S]*)```/);
    const cleanedJsonString = jsonMatch ? jsonMatch[2].trim() : rawResponse.trim();
    
    if (!cleanedJsonString) {
      throw new Error("The AI returned an empty response. Please try again.");
    }

    const quizData = await jsonParser.parse(cleanedJsonString);

    const { data: quiz, error: quizInsertError } = await supabase
      .from('quizzes')
      .insert({ parent_chat_id: parentChatId })
      .select('id')
      .single();

    if (quizInsertError) throw new Error(`DB Error: ${quizInsertError.message}`);
    const quizId = quiz.id;

    const questionsToInsert = quizData.questions.map(q => ({
      quiz_id: quizId,
      question_text: q.question_text,
      topic: q.topic,
      question_type: q.question_type,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation
    }));
    
    const { error: questionsInsertError } = await supabase.from('questions').insert(questionsToInsert);
    if (questionsInsertError) throw new Error(`DB Error: ${questionsInsertError.message}`);
    
    const { data: newlyCreatedQuestions, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId);

    if (fetchError) throw new Error(`DB Error fetching new questions: ${fetchError.message}`);

    return NextResponse.json({ quizId, questions: newlyCreatedQuestions });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    if (error instanceof Error && error.message.includes('parse')) {
        return NextResponse.json({ success: false, error: `Failed to parse AI response. Raw text: "${rawResponse}"` }, { status: 500 });
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}