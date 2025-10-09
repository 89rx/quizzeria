import { NextResponse, type NextRequest } from 'next/server';
import pdf from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { supabase } from '@/lib/supabaseClient';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    let chatId = formData.get('chatId') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file found.' }, { status: 400 });
    }

    if (!chatId) {
      const { data, error } = await supabase.from('chats').insert({}).select('id').single();
      if (error) throw new Error(`Could not create a new chat session: ${error.message}`);
      chatId = data.id;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(buffer);
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const documents = await splitter.createDocuments([pdfData.text]);

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: "text-embedding-004",
    });

    const documentContents = documents.map(doc => doc.pageContent);
    const vectors = await embeddings.embedDocuments(documentContents);

    const rowsToInsert = documents.map((doc, i) => ({
      content: doc.pageContent,
      embedding: vectors[i],
      metadata: { source: file.name },
      chat_id: chatId
    }));

    const { error } = await supabase.from('documents').insert(rowsToInsert);
    if (error) throw new Error(`Error inserting documents: ${error.message}`);

    return NextResponse.json({ success: true, chatId: chatId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API INGEST] Full Server Error:', errorMessage);
    return NextResponse.json({ success: false, error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}