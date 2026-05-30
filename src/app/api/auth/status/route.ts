import { NextResponse } from 'next/server';
import { checkAuthStatus } from '@/lib/zoho';

export async function GET() {
  const isConnected = await checkAuthStatus();
  return NextResponse.json({ isConnected });
}
