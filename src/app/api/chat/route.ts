// src/app/api/chat/route.ts

import { StreamingTextResponse, Message as VercelChatMessage } from 'ai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables'; 
import { StringOutputParser } from '@langchain/core/output_parsers';
import { supabase } from '@/lib/supabaseClient';
import { Document } from '@langchain/core/documents';

const formatVercelMessages = (message: VercelChatMessage) => {
  return message.role === 'user' ? `User: ${message.content}` : `Assistant: ${message.content}`;
};

const combineDocuments = (docs: Document[]) => {
  return docs.map((doc) => doc.pageContent).join('\n---\n');
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const chatId = body.chatId as string | undefined;

    console.log(`[API CHAT] Received request for chat ID: ${chatId}`);

    if (!chatId) {
      return new Response(JSON.stringify({ error: 'No active chat session found.' }), { status: 400 });
    }
    
    const formattedPreviousMessages = messages.slice(0, -1).map(formatVercelMessages).join('\n');
    const currentMessageContent = messages[messages.length - 1]?.content;

    if (!currentMessageContent) {
      return new Response(JSON.stringify({ error: 'No message content found' }), { status: 400 });
    }
    
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: "gemini-2.5-flash", 
      streaming: true,
    });

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: "text-embedding-004",
    });

    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents',
    });

    const relevantDocs = await vectorStore.similaritySearch(
      currentMessageContent,
      4, 
      { chat_id: chatId } 
  );
  
  // --- NEW DEBUG LOG ---
  // This log will show us the metadata of the docs that were found.
  console.log('[API CHAT] Metadata of retrieved docs:', relevantDocs.map(doc => doc.metadata));
  // --- END NEW LOG ---
  
  console.log('[API CHAT] Documents Retrieved:', relevantDocs.length);
  const context = combineDocuments(relevantDocs);
  // ... the rest of the file is the same ...
    
    console.log('[API CHAT] Documents Retrieved:', relevantDocs.length);

    console.log('[API CHAT] Context being sent to LLM:', context.substring(0, 200) + '...');

    const prompt = PromptTemplate.fromTemplate(`
      You are a helpful study assistant. Use the following context from a document to answer the user's question.
      If you don't know the answer from the context, say that you don't know. Do not make up an answer.

      Context:
      {context}

      Chat History:
      {chat_history}

      Question:
      {question}

      Answer:
    `);
    
    // --- START OF FIX: Reverting to your original, proven chain structure ---
    const chain = RunnableSequence.from([
        RunnablePassthrough.assign({
            context: () => context, // Use the context we already fetched
            question: () => currentMessageContent,
            chat_history: () => formattedPreviousMessages,
        }),
        prompt,
        model,
        new StringOutputParser(),
    ]);

    const stream = await chain.stream({}); 
    // --- END OF FIX ---

    return new StreamingTextResponse(stream);
    
  } catch (error) {
    console.error(`[RAG ERROR] Full Server Error:`, error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}