import { NextRequest, NextResponse } from 'next/server';
import { authenticateCredentials } from '../../../../lib/auth/userDb';
import { signJwt } from '../../../../lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const authResult = authenticateCredentials(email, password);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication failed.' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const token = signJwt({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      provider: user.provider,
    });

    const response = NextResponse.json({
      success: true,
      user,
      token,
      message: `Signed in successfully as ${user.role}.`,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600, // 7 days
    });

    return response;
  } catch (error: unknown) {
    console.error('[Auth Login] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}

