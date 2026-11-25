import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth/jwt';
import {
  getTicketByIdFromNeon,
  getTicketMessagesFromNeon,
  updateTicketInNeon,
  getOrderByIdFromNeon,
} from '@/lib/db/neon';
import { sendTicketResolvedEmail } from '@/lib/email/mailer';

function checkAdminAuth(req: NextRequest): boolean {
  const token =
    req.cookies.get('auth_token')?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) return false;
  const payload = verifyJwt(token);
  return Boolean(payload && payload.role === 'ADMIN');
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin credentials required.' },
        { status: 401 }
      );
    }

    const { ticketId } = await params;
    const ticket = await getTicketByIdFromNeon(ticketId);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found.' },
        { status: 404 }
      );
    }

    // Admin view: include internal yellow staff notes
    const messages = await getTicketMessagesFromNeon(ticket.id, true);

    // Linked order details if present
    let order = null;
    if (ticket.orderId) {
      order = await getOrderByIdFromNeon(ticket.orderId);
    }

    return NextResponse.json({
      success: true,
      ticket,
      messages,
      order,
    });
  } catch (error: unknown) {
    console.error('[Admin Ticket API GET] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin credentials required.' },
        { status: 401 }
      );
    }

    const { ticketId } = await params;
    const ticket = await getTicketByIdFromNeon(ticketId);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found.' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { status, priority, resolutionNotes, shiprocketAwb } = body;

    const prevStatus = ticket.status;
    await updateTicketInNeon(ticket.id, {
      status,
      priority,
      resolutionNotes,
      shiprocketAwb,
    });

    const updated = await getTicketByIdFromNeon(ticket.id);

    // If transitioned to RESOLVED, dispatch resolution and CSAT survey email
    if (status === 'RESOLVED' && prevStatus !== 'RESOLVED' && updated) {
      sendTicketResolvedEmail({
        ticket: updated,
        resolutionNotes: resolutionNotes || updated.resolutionNotes,
      }).catch((err) => {
        console.warn('[Admin Ticket PATCH] Resolution email dispatch notice:', err);
      });
    }

    return NextResponse.json({
      success: true,
      ticket: updated,
    });
  } catch (error: unknown) {
    console.error('[Admin Ticket API PATCH] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
