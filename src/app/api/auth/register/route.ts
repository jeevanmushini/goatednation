import { NextRequest, NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '../../../../lib/auth/userDb';
import { signJwt } from '../../../../lib/auth/jwt';
import { sendWelcomeEmail } from '../../../../lib/email/mailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, agreedToTerms } = body;

    // Enforce Affirmative Statutory Consent under DPDP Act 2023 & Indian Contract Act 1872
    if (agreedToTerms !== true) {
      return NextResponse.json(
        {
          success: false,
          error: 'Affirmative acceptance of the Terms of Service and Privacy Policy is required under the DPDP Act 2023.',
        },
        { status: 400 }
      );
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8 || !/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long and contain both letters and numbers.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // In production, public registration is strictly restricted to CUSTOMER role
    const user = await createUser({
      name,
      email,
      password,
      role: 'CUSTOMER',
      provider: 'credentials',
    });

    // Dispatch Syndicate Welcome Email with 10% discount coupon
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (err) {
      console.error('[Auth Register] Welcome email dispatch error:', err);
    }

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
      message: 'Account created successfully.',
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });

    return response;
  } catch (error: unknown) {
    console.error('[Auth Register] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}

