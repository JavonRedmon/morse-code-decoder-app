import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id');
  const userEmail = cookieStore.get('user_email');

  if (!userId || !userEmail) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    id: userId.value,
    email: userEmail.value,
  });
}
