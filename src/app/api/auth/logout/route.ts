import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'));
  
  // Clear auth cookies
  response.cookies.delete('user_id');
  response.cookies.delete('user_email');
  
  return response;
}
