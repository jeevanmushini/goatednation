import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth/jwt';
import {
  getTicketByIdFromNeon,
  addTicketMessageInNeon,
  updateTicketInNeon,
} from '@/lib/db/neon';
import { sendTicketUpdateEmail } from '@/lib/email/mailer';
import { TicketMessage } from '@/types/ticket';

function getAdminUser(req: NextRequest) {
  const token =
    req.cookies.get('auth_token')?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) return null;
  const payload = verifyJwt(token);
  return payload && payload.role === 'ADMIN' ? payload : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const adminUser = getAdminUser(req);
    if (!adminUser) {
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
    const { message, attachments = [], isInternal = false, newStatus } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message content is required.' },
        { status: 400 }
      );
    }

    const msgId = `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newMsg: TicketMessage = {
      id: msgId,
      ticketId: ticket.id,
      senderType: 'ADMIN',
      senderName: adminUser.name || 'GOATED SUPPORT // ADMIN',
      senderEmail: adminUser.email,
      message: message.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      isInternal: Boolean(isInternal),
      createdAt: new Date().toISOString(),
    };

    await addTicketMessageInNeon(newMsg);

    // If a new status is specified, or if replying publicly to customer, update status
    let statusToUpdate = newStatus;
    if (!statusToUpdate && !isInternal && ticket.status === 'OPEN') {
      statusToUpdate = 'IN_PROGRESS';
    }

    if (statusToUpdate && statusToUpdate !== ticket.status) {
      await updateTicketInNeon(ticket.id, { status: statusToUpdate });
    }

    // Only dispatch email to customer if it is a public message (NOT internal staff note)
    if (!isInternal) {
      try {
        const refreshedTicket = (await getTicketByIdFromNeon(ticket.id)) || ticket;
        await sendTicketUpdateEmail({
          ticket: refreshedTicket,
          messageText: message.trim(),
          senderName: adminUser.name || 'GOATED SUPPORT // ADMIN',
          newStatus: statusToUpdate,
        });
      } catch (err) {
        console.warn('[Admin Reply API] Email dispatch notice:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: newMsg,
    });
  } catch (error: unknown) {
    console.error('[Admin Reply API] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
