import { NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/zoho';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error: `Zoho auth failed: ${error}` }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    await exchangeCodeForTokens(code);
    
    // Redirect back to the dashboard home page
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}?zoho_auth=success`);
  } catch (err: any) {
    console.error("Error exchanging code for tokens", err);
    return NextResponse.json({ error: 'Failed to authenticate with Zoho', details: err.message }, { status: 500 });
  }
}
