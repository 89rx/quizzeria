// src/app/api/ingest/route.ts

import { loadEnv } from '@/lib/loadEnv.mjs';
loadEnv(); // Manually load environment variables

import { NextResponse, type NextRequest } from 'next/server';
import pdf from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { supabase } from '@/lib/supabaseClient';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  console.log("--- ✅ Request reached /api/ingest POST handler ---");
  try {
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file found.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const documents = await splitter.createDocuments([data.text]);
    const documentsWithMetadata = documents
      .filter(doc => doc.pageContent.trim().length > 0)
      .map(doc => ({ ...doc, metadata: { ...doc.metadata, source: file.name } }));

    if (documentsWithMetadata.length === 0) {
        return NextResponse.json({ success: false, error: 'No text could be extracted from the PDF.' }, { status: 400 });
    }

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: "text-embedding-004",
    });

    await SupabaseVectorStore.fromDocuments(documentsWithMetadata, embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents',
    });

    return NextResponse.json({
      success: true,
      fileName: file.name,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in ingest route:', errorMessage);
    return NextResponse.json({ success: false, error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}