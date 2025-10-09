// src/app/api/progress/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Later, you would filter by a specific user_id
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .order('last_attempted', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}