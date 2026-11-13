import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '../../../../lib/auth/jwt';
import { findUserById } from '../../../../lib/auth/userDb';

export async function GET(req: NextRequest) {
  try {
    // 1. Check HTTP-only cookie first
    let token = req.cookies.get('auth_token')?.value;

    // 2. Check Authorization header
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated. No token provided.' },
        { status: 401 }
      );
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token.' },
        { status: 401 }
      );
    }

    const userRecord = findUserById(payload.id);
    const user = userRecord
      ? {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          role: userRecord.role,
          avatar: userRecord.avatar,
          provider: userRecord.provider,
          createdAt: userRecord.createdAt,
        }
      : {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          role: payload.role,
          avatar: payload.avatar,
          provider: payload.provider,
          createdAt: new Date().toISOString(),
        };

    return NextResponse.json({
      success: true,
      user,
      role: user.role,
      isAdmin: user.role === 'ADMIN',
    });
  } catch (error: unknown) {
    console.error('[Auth Me] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}

