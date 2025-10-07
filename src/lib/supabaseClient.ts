// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

console.log("--- Loading supabaseClient.ts ---");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Log the values to see what the server is actually reading
console.log("Supabase URL loaded:", supabaseUrl ? "Exists" : "MISSING or UNDEFINED");
console.log("Supabase Key loaded:", supabaseKey ? "Exists" : "MISSING or UNDEFINED");

if (!supabaseUrl || !supabaseKey) {
  // This explicit error will crash the server and tell us the exact problem
  throw new Error("CRITICAL ERROR: Supabase URL or Key is missing from .env.local. Please check and restart the server.");
}

console.log("--- Supabase client initialized successfully ---");

export const supabase = createClient(supabaseUrl, supabaseKey);