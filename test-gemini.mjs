// test-gemini.mjs
import fs from 'fs';
import path from 'path';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

console.log('--- 🧪 Running Gemini API Key Test ---');

async function testGemini() {
  try {
    // 1. Manually load .env.local (same logic as your Supabase test)
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        throw new Error('.env.local file not found in root directory');
    }
    
    const envFileContent = fs.readFileSync(envPath, { encoding: 'utf-8' });
    const envVars = {};
    envFileContent.split('\n').forEach(line => {
      if (line.trim() !== '' && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        envVars[key.trim()] = value;
      }
    });

    // Check for the key name used in your route.ts
    const apiKey = envVars['GOOGLE_API_KEY'];

    if (!apiKey) {
      console.error('❌ FAILED: Could not find GOOGLE_API_KEY in .env.local');
      console.log('Ensure your .env.local has the line: GOOGLE_API_KEY=your_actual_key');
      return;
    }

    console.log(`✅ Key found in .env.local (Length: ${apiKey.length})`);
    console.log('Initializing model (gemini-2.5-flash)...');

    // 2. Initialize the model
    const model = new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      model: "gemini-2.5-flash-lite", 
      maxRetries: 0, // Fail fast for testing
    });

    // 3. Attempt a simple call
    console.log('Sending test prompt: "Hello, are you working?"');
    const response = await model.invoke("Hello, are you working?");

    console.log('\n🌟 SUCCESS! Gemini responded:');
    console.log('-----------------------------------');
    console.log(response.content);
    console.log('-----------------------------------');

  } catch (error) {
    console.error('\n❌ API KEY TEST FAILED:');
    console.error('Error Message:', error.message);
    
    if (error.message.includes('401')) {
      console.error('Reason: The API key is invalid or unauthorized.');
    } else if (error.message.includes('404')) {
      console.error('Reason: Model name not found. Check if gemini-1.5-flash is correct.');
    } else if (error.message.includes('429')) {
      console.error('Reason: Quota exhausted or rate limited.');
    }
  }
}

testGemini();