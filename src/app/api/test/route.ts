
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: "The test route is working!" });
}