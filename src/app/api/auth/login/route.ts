import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { team } = await request.json();
    
    if (!team) {
      return NextResponse.json({ error: 'Team is required' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    
    // Set HTTP-only cookie for session management
    response.cookies.set({
      name: 'zoho_updater_team',
      value: team,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to set session' }, { status: 500 });
  }
}
