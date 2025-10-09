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
    const parentChatId = formData.get('parentChatId') as string | null;

    if (!file || !parentChatId) {
      return NextResponse.json({ success: false, error: 'File or parentChatId not found.' }, { status: 400 });
    }
    
    const compositeChatId = `${parentChatId}_${file.name}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(buffer);

    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const documents = await splitter.createDocuments([pdfData.text]);
    
    const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GOOGLE_API_KEY, modelName: "text-embedding-004" });
    const documentContents = documents.map(doc => doc.pageContent);
    const vectors = await embeddings.embedDocuments(documentContents);

    const rowsToInsert = documents.map((doc, i) => ({
      content: doc.pageContent,
      embedding: vectors[i],
      metadata: { source: file.name },
      chat_id: compositeChatId
    }));
    
    const { error } = await supabase.from('documents').insert(rowsToInsert);
    if (error) throw new Error(`Error inserting documents for ${file.name}: ${error.message}`);

    return NextResponse.json({ success: true, parentChatId: parentChatId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}