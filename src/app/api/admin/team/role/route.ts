import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '../../../../../lib/auth/jwt';
import { findUserByEmail, updateUserRole } from '../../../../../lib/auth/userDb';
import { UserRole } from '../../../../../types/auth';

const PRIMARY_ADMIN_EMAIL = 'admin@goatednation.com';

export async function PATCH(req: NextRequest) {
  try {
    // 1. Enforce strict Admin authentication
    const authCookie = req.cookies.get('auth_token')?.value;
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
    const token = authCookie || authHeader;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Authentication required.' },
        { status: 401 }
      );
    }

    const caller = verifyJwt(token);
    if (!caller || caller.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Administrator clearance required.' },
        { status: 403 }
      );
    }

    // 2. Parse request payload
    const body = await req.json();
    const { email, targetRole } = body as { email?: string; targetRole?: UserRole };

    if (!email || !targetRole) {
      return NextResponse.json(
        { success: false, error: 'Both email and targetRole (ADMIN or CUSTOMER) are required.' },
        { status: 400 }
      );
    }

    if (targetRole !== 'ADMIN' && targetRole !== 'CUSTOMER') {
      return NextResponse.json(
        { success: false, error: 'Invalid targetRole. Allowed values: ADMIN, CUSTOMER.' },
        { status: 400 }
      );
    }

    const normalizedTargetEmail = email.toLowerCase().trim();
    const normalizedCallerEmail = caller.email.toLowerCase().trim();

    // 3. Safety Guard 1: Primary Super-Admin Protection
    if (normalizedTargetEmail === PRIMARY_ADMIN_EMAIL) {
      return NextResponse.json(
        {
          success: false,
          error: 'Primary Syndicate Administrator clearance cannot be altered or revoked.',
        },
        { status: 400 }
      );
    }

    // 4. Safety Guard 2: Self-Demotion Lockout Prevention
    if (normalizedCallerEmail === normalizedTargetEmail && targetRole === 'CUSTOMER') {
      return NextResponse.json(
        {
          success: false,
          error:
            'You cannot revoke your own administrator clearance. Another administrator must perform this action.',
        },
        { status: 400 }
      );
    }

    // 5. Safety Guard 3: User Existence Verification
    const existing = await findUserByEmail(normalizedTargetEmail);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: `User with email [${normalizedTargetEmail}] does not exist.` },
        { status: 404 }
      );
    }

    // 6. Execute atomic role change
    const updatedUser = await updateUserRole(normalizedTargetEmail, targetRole);

    return NextResponse.json({
      success: true,
      message: `Clearance updated: ${updatedUser?.name || normalizedTargetEmail} is now ${targetRole}.`,
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error('[Admin Team Role API] Error updating role:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
