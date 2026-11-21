import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth/jwt';
import { getUserOrdersFromNeon } from '@/lib/db/neon';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryEmail = searchParams.get('email');

    // Attempt to read JWT token
    const token =
      req.cookies.get('auth_token')?.value ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    let userEmail: string | null = null;
    if (token) {
      const payload = verifyJwt(token);
      if (payload && payload.email) {
        userEmail = payload.email;
      }
    }

    // Fall back to query param email if provided
    const targetEmail = userEmail || queryEmail;

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: 'Authentication or customer email required' },
        { status: 401 }
      );
    }

    const orders = await getUserOrdersFromNeon(targetEmail);

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: unknown) {
    console.error('[User Orders API] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
