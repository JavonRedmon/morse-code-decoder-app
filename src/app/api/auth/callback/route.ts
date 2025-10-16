import { NextRequest, NextResponse } from 'next/server';
import { workos, clientId } from '@/lib/workos';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    console.log('Attempting to authenticate with code:', code?.substring(0, 10) + '...');
    console.log('Using clientId:', clientId);
    
    // Exchange the authorization code for a user
    const { user } = await workos.userManagement.authenticateWithCode({
      code,
      clientId,
    });

    console.log('Authentication successful for user:', user.email);

    // Create a session (you'll want to use a proper session management solution)
    const response = NextResponse.redirect(new URL('/', request.url));
    
    // Set a cookie with user info (in production, use encrypted sessions)
    response.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set('user_email', user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Authentication error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}
