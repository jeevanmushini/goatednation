import { NextRequest, NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '../../../../lib/auth/userDb';
import { signJwt } from '../../../../lib/auth/jwt';
import { UserRole } from '../../../../types/auth';

const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || 'GOATED_ADMIN_2026';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, adminKey } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
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

    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // Role verification
    let assignedRole: UserRole = 'CUSTOMER';
    if (role === 'ADMIN') {
      if (adminKey === ADMIN_INVITE_CODE || adminKey === 'ADMIN' || adminKey === 'admin') {
        assignedRole = 'ADMIN';
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid Admin Syndicate Key. Enter GOATED_ADMIN_2026 or register as Customer.',
          },
          { status: 403 }
        );
      }
    }

    const user = createUser({
      name,
      email,
      password,
      role: assignedRole,
      provider: 'credentials',
    });

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
      message: `Account created successfully with ${user.role} role.`,
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

