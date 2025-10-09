
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chatId } = body;

    if (!chatId) {
      return new Response(JSON.stringify({ error: 'chatId is required' }), { status: 400 });
    }

    
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('content')
      .like('chat_id', `${chatId}_%`)
      .limit(3);

    if (docError || !documents || documents.length === 0) {
      throw new Error(`Could not find documents for chat: ${chatId}`);
    }

    const content = documents.map(doc => doc.content).join('\n\n');
    
    
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: "gemini-2.5-flash",
    });
    
    const prompt = PromptTemplate.fromTemplate(
      "Based on the following text from a document, create a short, descriptive title of 5 words or less. Just return the title and nothing else.\n\nText:\n{text}"
    );
    
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    let title = await chain.invoke({ text: content.substring(0, 3000) });

   
    title = title.replace(/"/g, '').trim();

    
    const { error: updateError } = await supabase
      .from('chats')
      .update({ title: title })
      .eq('id', chatId);

    if (updateError) {
      throw new Error(`Failed to update chat title: ${updateError.message}`);
    }

    return NextResponse.json({ success: true, title: title });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}