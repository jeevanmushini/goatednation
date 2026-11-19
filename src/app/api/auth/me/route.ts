import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '../../../../lib/auth/jwt';
import { findUserById } from '../../../../lib/auth/userDb';

// Simple in-memory rate limiter with periodic pruning to prevent memory leaks
const rateLimitMap = new Map<string, { count: number; reset: number }>();

function isRateLimited(ip: string, maxReq = 120, windowMs = 60_000): boolean {
  const now = Date.now();
  // Periodic cleanup if map grows
  if (rateLimitMap.size > 500) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.reset) {
        rateLimitMap.delete(key);
      }
    }
  }

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + windowMs });
    return false;
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count > maxReq;
}

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-client';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }
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
      return NextResponse.json({
        success: false,
        user: null,
        isAuthenticated: false,
        role: 'GUEST',
        isAdmin: false,
        message: 'No active session token provided.',
      });
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return NextResponse.json({
        success: false,
        user: null,
        isAuthenticated: false,
        role: 'GUEST',
        isAdmin: false,
        message: 'Invalid or expired session token.',
      });
    }

    const userRecord = await findUserById(payload.id);
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
          avatar: payload.avatar || '',
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

