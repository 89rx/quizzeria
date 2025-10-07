// test-connection.mjs
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

console.log('--- Running Full Supabase Connection Test ---');

async function runTest() {
  try {
    // Manually load the .env.local file
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envFileContent = fs.readFileSync(envPath, { encoding: 'utf-8' });
    
    const envVars = {};
    envFileContent.split('\n').forEach(line => {
      if (line.trim() !== '' && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        envVars[key.trim()] = value;
      }
    });

    const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Could not find Supabase credentials in .env.local');
    }

    console.log('Credentials loaded. Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Client initialized. Attempting to connect to database...');

    // Perform a simple read operation
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      // If there's an error during the database operation
      console.error('\n❌ DATABASE CONNECTION FAILED:');
      console.error('An error occurred while trying to fetch data:');
      console.error(error.message);
      console.log('\nThis could mean your Supabase project is paused or there is a network issue.');

    } else {
      // If the operation is successful
      console.log('\n✅ DATABASE CONNECTION SUCCESSFUL!');
      console.log('Successfully connected to your Supabase project and fetched data.');
      console.log('Available Storage Buckets:', data.length > 0 ? data.map(bucket => bucket.name) : 'No buckets found.');
    }

  } catch (error) {
    // If there's an error before the database operation (e.g., reading the file)
    console.error('\n❌ TEST SCRIPT FAILED:', error.message);
  }
}

runTest();