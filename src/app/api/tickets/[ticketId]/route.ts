import { NextRequest, NextResponse } from 'next/server';
import {
  getTicketByIdFromNeon,
  getTicketMessagesFromNeon,
  addTicketMessageInNeon,
  updateTicketInNeon,
} from '@/lib/db/neon';
import { verifyJwt } from '@/lib/auth/jwt';
import { verifyTicketAccessToken } from '@/lib/ticketSecurity';
import { TicketMessage } from '@/types/ticket';

// Helper to authorize ticket operations via Dual-Key Access Model
function isTicketAuthorized(req: NextRequest, ticket: any): { authorized: boolean; isStaff: boolean } {
  // Check 1: Authenticated session
  const token =
    req.cookies.get('auth_token')?.value ||
    req.cookies.get('gn_auth_token')?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (token) {
    const payload = verifyJwt(token);
    if (payload) {
      if (payload.role === 'ADMIN') {
        return { authorized: true, isStaff: true };
      }
      if (payload.email && ticket.customerEmail && payload.email.toLowerCase().trim() === ticket.customerEmail.toLowerCase().trim()) {
        return { authorized: true, isStaff: false };
      }
    }
  }

  // Check 2: Cryptographic Access Token for guests via query param or header
  const { searchParams } = new URL(req.url);
  const ticketToken = searchParams.get('token') || req.headers.get('x-ticket-token');

  if (verifyTicketAccessToken(ticket.id, ticket.customerEmail, ticketToken)) {
    return { authorized: true, isStaff: false };
  }

  return { authorized: false, isStaff: false };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const ticket = await getTicketByIdFromNeon(ticketId);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found.' },
        { status: 404 }
      );
    }

    // Enforce Authorization Check
    const auth = isTicketAuthorized(req, ticket);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Please sign in or use the direct link sent to your email.' },
        { status: 403 }
      );
    }

    // Customer view: hide internal staff-only notes unless caller is staff
    const messages = await getTicketMessagesFromNeon(ticket.id, auth.isStaff);

    return NextResponse.json({
      success: true,
      ticket,
      messages,
    });
  } catch (error: unknown) {
    console.error('[Ticket Thread API GET] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const ticket = await getTicketByIdFromNeon(ticketId);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found.' },
        { status: 404 }
      );
    }

    // Enforce Authorization Check
    const auth = isTicketAuthorized(req, ticket);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to post updates to this ticket.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, message, attachments = [], rating, senderName } = body;

    // 1. Handle CSAT Rating Submission
    if (rating !== undefined && rating !== null) {
      const numericRating = Math.min(Math.max(Number(rating), 1), 5);
      await updateTicketInNeon(ticket.id, {
        customerRating: numericRating,
      });

      return NextResponse.json({
        success: true,
        message: `Thank you for rating your experience (${numericRating}/5 stars).`,
      });
    }

    // 2. Handle 1-Click Ticket Reopen
    if (action === 'reopen') {
      await updateTicketInNeon(ticket.id, {
        status: 'OPEN',
      });

      const reopenMsg: TicketMessage = {
        id: `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        ticketId: ticket.id,
        senderType: auth.isStaff ? 'ADMIN' : 'CUSTOMER',
        senderName: senderName || (auth.isStaff ? 'Syndicate Support' : ticket.customerName),
        senderEmail: auth.isStaff ? 'support@goatednation.com' : ticket.customerEmail,
        message: message || 'Customer requested to reopen this ticket for further resolution.',
        attachments: Array.isArray(attachments) ? attachments : [],
        isInternal: false,
        createdAt: new Date().toISOString(),
      };

      await addTicketMessageInNeon(reopenMsg);

      return NextResponse.json({
        success: true,
        message: 'Ticket has been reopened. Our support team will resume investigation.',
      });
    }

    // 3. Customer or Staff Reply
    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message content is required.' },
        { status: 400 }
      );
    }

    const newMsg: TicketMessage = {
      id: `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      ticketId: ticket.id,
      senderType: auth.isStaff ? 'ADMIN' : 'CUSTOMER',
      senderName: senderName || (auth.isStaff ? 'Syndicate Support' : ticket.customerName),
      senderEmail: auth.isStaff ? 'support@goatednation.com' : ticket.customerEmail,
      message: message.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      isInternal: false,
      createdAt: new Date().toISOString(),
    };

    await addTicketMessageInNeon(newMsg);

    // If ticket was waiting for customer, move status back to OPEN
    if (ticket.status === 'WAITING_CUSTOMER' && !auth.isStaff) {
      await updateTicketInNeon(ticket.id, { status: 'OPEN' });
    }

    return NextResponse.json({
      success: true,
      message: newMsg,
    });
  } catch (error: unknown) {
    console.error('[Ticket Thread API POST] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
