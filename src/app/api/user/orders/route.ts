import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth/jwt';
import { getUserOrdersFromNeon } from '@/lib/db/neon';

export async function GET(req: NextRequest) {
  try {
    // 1. Read JWT from HttpOnly cookie or Authorization header
    const token =
      req.cookies.get('auth_token')?.value ||
      req.cookies.get('gn_auth_token')?.value ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to access order history.' },
        { status: 401 }
      );
    }

    // 2. Verify JWT signature and claims
    const payload = verifyJwt(token);
    if (!payload || !payload.email) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session. Please sign in again.' },
        { status: 401 }
      );
    }

    // 3. Authorization check: Customers are restricted strictly to their own email
    const { searchParams } = new URL(req.url);
    const queryEmail = searchParams.get('email');

    let targetEmail = payload.email.toLowerCase().trim();

    // Only elevated administrators can view orders belonging to another email
    if (payload.role === 'ADMIN' && queryEmail) {
      targetEmail = queryEmail.toLowerCase().trim();
    }

    // 4. Retrieve orders
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
