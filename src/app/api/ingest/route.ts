// src/app/api/ingest/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import pdf from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { supabase } from '@/lib/supabaseClient';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    let chatId = formData.get('chatId') as string | null;

    console.log(`[API INGEST] Received request. Has file: ${!!file}. Has chatId: ${chatId}`);

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file found.' }, { status: 400 });
    }

    if (!chatId) {
      const { data, error } = await supabase.from('chats').insert({}).select('id').single();
      if (error) throw new Error(`Could not create a new chat session: ${error.message}`);
      chatId = data.id;
      console.log(`[API INGEST] Created new chat session with ID: ${chatId}`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(buffer);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const documents = await splitter.createDocuments([pdfData.text]);
    
    // --- NEW DEBUG LOG 1 ---
    console.log(`[API INGEST] Split PDF into ${documents.length} documents.`);

    const documentsWithMetadata = documents
      .filter(doc => doc.pageContent.trim().length > 0)
      .map(doc => ({ 
        ...doc, 
        metadata: { 
          ...doc.metadata, 
          source: file.name,
          chat_id: chatId,
        } 
      }));

    if (documentsWithMetadata.length > 0) {
      // --- NEW DEBUG LOG 2 ---
      console.log(`[API INGEST] First document chunk metadata:`, documentsWithMetadata[0].metadata);
      console.log(`[API INGEST] First document chunk content preview:`, documentsWithMetadata[0].pageContent.substring(0, 200) + '...');
    } else {
      console.warn('[API INGEST] No document chunks were generated after splitting.');
      return NextResponse.json({ success: false, error: 'No text could be extracted.' }, { status: 400 });
    }

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: "text-embedding-004",
    });

    console.log('[API INGEST] Starting upload to vector store...');
    await SupabaseVectorStore.fromDocuments(documentsWithMetadata, embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents',
    });
    console.log('[API INGEST] Upload to vector store complete.');

    return NextResponse.json({
      success: true,
      chatId: chatId,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API INGEST] Full Server Error:', errorMessage);
    return NextResponse.json({ success: false, error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}