import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    // 1. Get the file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided.' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ success: false, error: 'File is not a PDF.' }, { status: 400 });
    }

    // 2. Extract text from the PDF
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const data = await pdf(buffer);
    const extractedText = data.text;

    // 3. Split the text into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const documents = await splitter.createDocuments([extractedText]);
    
    // **NEW**: Filter out empty documents
    const filteredDocuments = documents.filter(doc => doc.pageContent.trim().length > 0);

    // 4. Create embeddings and store in Supabase
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      // **NEW**: Specify the model
      modelName: "text-embedding-004", 
    });

    await SupabaseVectorStore.fromDocuments(filteredDocuments, embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents',
    });

    return NextResponse.json({
      success: true,
      message: `File processed and stored successfully.`,
    });
  } catch (error) {
    console.error('Error in file upload:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}