import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '../../../../lib/auth/jwt';
import { getAllUsersForAdmin } from '../../../../lib/auth/userDb';

export async function GET(req: NextRequest) {
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

    const payload = verifyJwt(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Administrator privileges required.' },
        { status: 403 }
      );
    }

    // 2. Query parameters
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 3. Fetch users and aggregated metrics
    const result = await getAllUsersForAdmin({
      search,
      role,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      metrics: result.metrics,
      users: result.users,
      total: result.total,
    });
  } catch (error: unknown) {
    console.error('[Admin Team API] Error fetching users:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
