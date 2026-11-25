import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, resetUserPassword } from '../../../../lib/auth/userDb';
import { verifyAndConsumeOtp } from '../../../../lib/db/neon';
import { sendPasswordChangedEmail } from '../../../../lib/email/mailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email, verification code, and new password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json(
        { success: false, error: 'Verification code must be exactly 6 digits.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8 || !/[0-9]/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must be at least 8 characters long and contain both letters and numbers.',
        },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account associated with this email.' },
        { status: 404 }
      );
    }

    // Verify cryptographic OTP and consume
    const verification = await verifyAndConsumeOtp(normalizedEmail, cleanOtp);
    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: verification.error || 'Invalid or expired verification code.' },
        { status: 400 }
      );
    }

    // Hash and persist new password credentials
    await resetUserPassword(normalizedEmail, newPassword);

    // Dispatch Security Alert email
    const userAgent = req.headers.get('user-agent') || 'Web Browser';
    try {
      await sendPasswordChangedEmail(
        normalizedEmail,
        user.name,
        new Date().toUTCString(),
        userAgent
      );
    } catch (err) {
      console.error('[Reset Password] Security alert email dispatch error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been updated successfully. Please sign in.',
    });
  } catch (error: unknown) {
    console.error('[Reset Password] Route error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
