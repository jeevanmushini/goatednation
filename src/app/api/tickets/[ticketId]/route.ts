import { NextRequest, NextResponse } from 'next/server';
import {
  getTicketByIdFromNeon,
  getTicketMessagesFromNeon,
  addTicketMessageInNeon,
  updateTicketInNeon,
} from '@/lib/db/neon';
import { TicketMessage } from '@/types/ticket';

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

    // Customer view: hide internal staff-only notes
    const messages = await getTicketMessagesFromNeon(ticket.id, false);

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
        senderType: 'CUSTOMER',
        senderName: senderName || ticket.customerName,
        senderEmail: ticket.customerEmail,
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

    // 3. Regular Customer Reply
    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message content is required.' },
        { status: 400 }
      );
    }

    const newMsg: TicketMessage = {
      id: `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      ticketId: ticket.id,
      senderType: 'CUSTOMER',
      senderName: senderName || ticket.customerName,
      senderEmail: ticket.customerEmail,
      message: message.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      isInternal: false,
      createdAt: new Date().toISOString(),
    };

    await addTicketMessageInNeon(newMsg);

    // If ticket was waiting for customer, move status back to OPEN
    if (ticket.status === 'WAITING_CUSTOMER') {
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
