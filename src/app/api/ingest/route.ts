
import { NextResponse, type NextRequest } from 'next/server';
import pdf from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { supabase } from '@/lib/supabaseClient';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const parentChatId = formData.get('parentChatId') as string | null;

    if (!file || !parentChatId) {
      return NextResponse.json({ success: false, error: 'File or parentChatId not found.' }, { status: 400 });
    }

    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        error: 'File too large (max 3MB)' 
      }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only PDF files allowed' 
      }, { status: 400 });
    }


    const { data: existingDocs, error: docCheckError } = await supabase
      .from('documents')
      .select('id')
      .like('chat_id', `${parentChatId}_%`)
      .limit(1);

    const isFirstDocument = !existingDocs || existingDocs.length === 0;
    
    const compositeChatId = `${parentChatId}_${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(buffer);

    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const documents = await splitter.createDocuments([pdfData.text]);
    
    
    if (isFirstDocument) {
      const model = new ChatGoogleGenerativeAI({ modelName: "gemini-2.5-flash" });
      const prompt = PromptTemplate.fromTemplate(
        "Based on the following text from a document, extract a list of 5-10 main topics. Return the list as a JSON array of strings and nothing else. \n\nText:\n{text}"
      );
      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      const context = documents.slice(0, 5).map(doc => doc.pageContent).join('\n\n');
      const topicResponse = await chain.invoke({ text: context });
      const topics = JSON.parse(topicResponse.replace(/```(json)?/g, '').replace(/```/g, '').trim());
      
      await supabase.from('chat_topics').insert({ chat_id: parentChatId, topics });
    }

    const embeddings = new GoogleGenerativeAIEmbeddings({ modelName: "text-embedding-004" });
    const documentContents = documents.map(doc => doc.pageContent);
    const vectors = await embeddings.embedDocuments(documentContents);

    const rowsToInsert = documents.map((doc, i) => ({
      content: doc.pageContent,
      embedding: vectors[i],
      metadata: { source: file.name },
      chat_id: compositeChatId
    }));
    
    await supabase.from('documents').insert(rowsToInsert);

    return NextResponse.json({ success: true, parentChatId: parentChatId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}