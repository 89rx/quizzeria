
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic'; 
export const revalidate = 0; 

export async function GET() {
  try {
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .order('last_attempted', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    
    const response = NextResponse.json(data);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}