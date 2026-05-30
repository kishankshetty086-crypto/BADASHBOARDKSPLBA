import { NextResponse } from 'next/server';
import { getZohoAuthUrl } from '@/lib/zoho';

export async function GET() {
  const authUrl = getZohoAuthUrl();
  return NextResponse.redirect(authUrl);
}
