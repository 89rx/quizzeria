import { StreamingTextResponse, Message as VercelChatMessage } from 'ai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables'; 
import { StringOutputParser } from '@langchain/core/output_parsers';
import { supabase } from '@/lib/supabaseClient';
const CURRENT_DOCUMENT_NAME = "Assignment_ BeyondChats - FSWD.pdf";

// Node.js runtime is the default and most stable for this complex streaming operation
// export const runtime = 'edge'; 

const formatVercelMessages = (message: VercelChatMessage) => {
  if (message.role === 'user') {
    return `User: ${message.content}`;
  }
  return `Assistant: ${message.content}`;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const formattedPreviousMessages = messages.slice(0, -1).map(formatVercelMessages);
    const currentMessageContent = messages[messages.length - 1]?.content;
    

    if (!currentMessageContent) {
      return new Response(JSON.stringify({ error: 'No message content found' }), { status: 400 });
    }
    
    console.log(`[RAG DEBUG] Received Question: ${currentMessageContent}`);

    // --- RAG & AI SETUP ---

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

    // 1. Retrieve relevant context documents from Supabase
    const retriever = vectorStore.asRetriever();
    const relevantDocs = await retriever.invoke(currentMessageContent);
    const context = relevantDocs.map(doc => doc.pageContent).join('\n---\n'); 
    
    console.log(`[RAG DEBUG] Documents Retrieved: ${relevantDocs.length}`);

    // --- PROMPT & CHAIN DEFINITION ---

    const prompt = PromptTemplate.fromTemplate(`
      You are a helpful study assistant. Use the following context from a coursebook to answer the user's question.
      If you don't know the answer from the context, say that you don't know. Do not make up an answer.

      Context:
      {context}

      Chat History:
      {chat_history}

      Question:
      {question}

      Answer:
    `);
    
    // FINAL FIX: This structure resolves the type conflict with v0.1.6
    const chain = RunnableSequence.from([
        // Step 1: Use RunnablePassthrough.assign to create the input dictionary
        // This gathers all necessary variables for the prompt's template.
        RunnablePassthrough.assign({
            context: () => context,
            question: () => currentMessageContent,
            chat_history: () => formattedPreviousMessages.join('\n'),
        }),
        
        // Step 2: Pass the resulting dictionary into the prompt
        prompt,
        
        // Step 3: Pass the PromptValue to the model
        model,
        
        // Step 4: Convert the output to a simple string
        new StringOutputParser(),
    ]);

    // The chain starts with an empty input as it gathers all variables internally.
    const stream = await chain.stream({}); 

    // 5. Stream the text response back using the Vercel AI SDK
    return new StreamingTextResponse(stream);
    
  } catch (error) {
    console.error(`[RAG ERROR] Full Server Error:`, error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}