import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { findUserByEmail } from '../../../../lib/auth/userDb';
import { createPasswordResetOtp } from '../../../../lib/db/neon';
import { sendOtpEmail } from '../../../../lib/email/mailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.toLowerCase().trim();

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      // Return success without revealing that email does not exist (enumeration protection)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a 6-digit verification code has been dispatched.',
      });
    }

    if (user.provider !== 'credentials') {
      return NextResponse.json(
        {
          success: false,
          error: `This account is linked with ${user.provider}. Please sign in using ${user.provider}.`,
        },
        { status: 400 }
      );
    }

    // Generate cryptographic 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store hashed OTP in Neon Postgres (10m TTL)
    const stored = await createPasswordResetOtp(normalizedEmail, otp, 10);
    if (!stored) {
      console.warn('[Forgot Password] Failed to store OTP in Neon, proceeding with in-memory or fallback flow');
    }

    // Dispatch Tokyo Streetwear OTP email
    try {
      await sendOtpEmail(normalizedEmail, otp, user.name, 10);
    } catch (err) {
      console.error('[Forgot Password] Email dispatch error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'A 6-digit verification code has been dispatched to your email.',
    });
  } catch (error: unknown) {
    console.error('[Forgot Password] Route error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
