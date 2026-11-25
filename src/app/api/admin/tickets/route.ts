import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth/jwt';
import { getAdminTicketsFromNeon, getAdminTicketMetricsFromNeon } from '@/lib/db/neon';

function checkAdminAuth(req: NextRequest): boolean {
  const token =
    req.cookies.get('auth_token')?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) return false;
  const payload = verifyJwt(token);
  return Boolean(payload && payload.role === 'ADMIN');
}

export async function GET(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin credentials required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;

    const [ticketData, metrics] = await Promise.all([
      getAdminTicketsFromNeon({ status, category, priority, search, limit, offset }),
      getAdminTicketMetricsFromNeon(),
    ]);

    return NextResponse.json({
      success: true,
      tickets: ticketData.tickets,
      total: ticketData.total,
      metrics,
    });
  } catch (error: unknown) {
    console.error('[Admin Tickets API] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
