import { NextResponse, type NextRequest } from 'next/server';
import pdf from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { supabase } from '@/lib/supabaseClient';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    console.log("--- INGESTION START ---");
    
    // 1. Get the File
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const parentChatId = formData.get('parentChatId') as string | null;

    if (!file || !parentChatId) {
      console.error("❌ Error: Missing file or chat ID");
      return NextResponse.json({ success: false, error: 'File or parentChatId not found.' }, { status: 400 });
    }

    console.log(`📁 File received: ${file.name}, Size: ${file.size} bytes`);
    const compositeChatId = `${parentChatId}_${file.name}`;

    // 2. Parse the PDF
    console.log("📄 Parsing PDF...");
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(buffer);
    
    if (!pdfData.text || pdfData.text.trim() === '') {
      throw new Error("PDF text extraction resulted in empty string.");
    }

    // 3. Chunk the Text
    console.log("✂️ Splitting text into chunks...");
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const documents = await splitter.createDocuments([pdfData.text]);
    console.log(`✅ Created ${documents.length} chunks.`);

    // 4. Topic Extraction (Only for first doc)
    const { data: existingDocs } = await supabase
      .from('documents')
      .select('id')
      .like('chat_id', `${parentChatId}_%`)
      .limit(1);

    const isFirstDocument = !existingDocs || existingDocs.length === 0;

    if (isFirstDocument) {
      console.log("🧠 Generating topics using Gemini 2.5 Flash...");
      const model = new ChatGoogleGenerativeAI({ 
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-2.5-flash" 
      });
      
      const prompt = PromptTemplate.fromTemplate(
        "Based on the following text from a document, extract a list of 5-10 main topics. Return the list as a JSON array of strings and nothing else. \n\nText:\n{text}"
      );
      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      const context = documents.slice(0, 5).map((doc: Document) => doc.pageContent).join('\n\n');
      
      const topicResponse = await chain.invoke({ text: context });
      const topics = JSON.parse(topicResponse.replace(/```(json)?/g, '').replace(/```/g, '').trim());
      console.log("✅ Topics generated:", topics);
      
      await supabase.from('chat_topics').insert({ chat_id: parentChatId, topics });
    }

    // 5. Generate Embeddings (Using test script logic)
    console.log("🔢 Generating 3072-dimension embeddings...");
    const embeddings = new GoogleGenerativeAIEmbeddings({ 
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: "gemini-embedding-001" 
    });

    const documentContents = documents.map((doc: Document) => doc.pageContent);
    const vectors = await embeddings.embedDocuments(documentContents);
    console.log(`✅ Successfully generated ${vectors.length} vectors.`);

    // 6. Insert into Supabase
    console.log("💾 Saving to Supabase 'documents' table...");
    const rowsToInsert = documents.map((doc: Document, i: number) => ({
      content: doc.pageContent,
      embedding: vectors[i],
      metadata: { source: file.name },
      chat_id: compositeChatId
    }));
    
    const { error: insertError } = await supabase.from('documents').insert(rowsToInsert);
    
    if (insertError) {
      throw new Error(`Supabase Insert Failed: ${insertError.message}`);
    }

    console.log("🎉 INGESTION COMPLETE!");
    return NextResponse.json({ success: true, parentChatId: parentChatId });

  } catch (error: any) {
    console.error("❌ CATASTROPHIC INGESTION FAILURE:");
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}