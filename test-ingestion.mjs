import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load variables from your Next.js env file
dotenv.config({ path: '.env.local' }); 

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !GOOGLE_API_KEY) {
  console.error("❌ Missing environment variables. Check your .env.local file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTest() {
  console.log("1. Initializing Gemini Embedding Model...");
  try {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: GOOGLE_API_KEY,
      modelName: "gemini-embedding-001",
    });

    const testText = "This is a raw test string to verify if embedding and database insertion works without Next.js overhead.";
    const testChatId = "standalone-test-chat-uuid_test.pdf";

    console.log("2. Requesting vector from Google...");
    const vector = await embeddings.embedQuery(testText);
    console.log(`✅ Success! Received vector from Google with ${vector.length} dimensions.`);

    console.log("3. Attempting to insert into Supabase 'documents' table...");
    const { data, error } = await supabase.from('documents').insert({
      content: testText,
      embedding: vector,
      metadata: { source: 'standalone_test.pdf' },
      chat_id: testChatId
    }).select('id, chat_id');

    if (error) {
      console.error("❌ Supabase Insert Error:", error.message);
      console.error("Full Error Details:", error);
      return;
    }

    console.log("✅ Success! Inserted test document into Supabase:", data);
    console.log("\nIf you see this, your Supabase Database and Google API Key are perfectly healthy!");

  } catch (err) {
    console.error("\n❌ Catastrophic Failure during testing:");
    console.error(err);
  }
}

runTest();