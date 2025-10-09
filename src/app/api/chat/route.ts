import { StreamingTextResponse, Message as VercelChatMessage } from 'ai';
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables'; 
import { StringOutputParser } from '@langchain/core/output_parsers';
import { supabase } from '@/lib/supabaseClient';
import { Document } from '@langchain/core/documents';

type DocumentFromRPC = {
  content: string;
  metadata: object;
};

const formatVercelMessages = (message: VercelChatMessage) => {
  return message.role === 'user' ? `User: ${message.content}` : `Assistant: ${message.content}`;
};

const combineDocuments = (docs: DocumentFromRPC[]) => {
  return docs.map((doc) => doc.content).join('\n---\n');
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const parentChatId = body.parentChatId as string | undefined;
    const selectedDoc = body.selectedDoc as string | undefined;

    if (!parentChatId) {
      return new Response(JSON.stringify({ error: 'No active chat session found.' }), { status: 400 });
    }
    
    const formattedPreviousMessages = messages.slice(0, -1).map(formatVercelMessages).join('\n');
    const currentMessageContent = messages[messages.length - 1]?.content;

    if (!currentMessageContent) {
      return new Response(JSON.stringify({ error: 'No message content found' }), { status: 400 });
    }
    
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: "gemini-2.5-flash", // Using stable model
      streaming: true,
    });

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: "text-embedding-004",
    });

    let chatIdPattern: string;
    if (selectedDoc && selectedDoc !== 'all') {
      chatIdPattern = `${parentChatId}_${selectedDoc}`;
    } else {
      chatIdPattern = `${parentChatId}_%`;
    }
    
    console.log(`[API CHAT] Calling DB with pattern: ${chatIdPattern}`);

    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: await embeddings.embedQuery(currentMessageContent),
      match_count: 4,
      chat_id_pattern: chatIdPattern
    });

    if (error) {
      console.error('[API CHAT] Error from RPC call:', error);
      throw new Error(`Error searching for documents: ${error.message}`);
    }

    const context = combineDocuments(documents);
    console.log('[API CHAT] Documents Retrieved:', documents.length);
    
    const prompt = PromptTemplate.fromTemplate(`
      You are a helpful study assistant. Use the following context to answer the user's question.
      If the context is empty, say that you don't know the answer from the provided context.
      Context: {context}
      Question: {question}
      Answer:
    `);
    
    const chain = RunnableSequence.from([
        RunnablePassthrough.assign({
            context: () => context,
            question: () => currentMessageContent,
            chat_history: () => formattedPreviousMessages,
        }),
        prompt,
        model,
        new StringOutputParser(),
    ]);

    const stream = await chain.stream({}); 

    return new StreamingTextResponse(stream);
    
  } catch (error) {
    console.error(`[RAG ERROR] Full Server Error:`, error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}