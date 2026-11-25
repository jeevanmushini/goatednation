import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth/jwt';
import { createTicketInNeon, getTicketsForUserFromNeon } from '@/lib/db/neon';
import { sendTicketCreatedEmail } from '@/lib/email/mailer';
import { generateTicketAccessToken } from '@/lib/ticketSecurity';
import { Ticket, TicketCategory, TicketPriority } from '@/types/ticket';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      orderId,
      category,
      subject,
      initialMessage,
      attachments = [],
      telemetry = {},
      exchangeDetails = {},
      paymentDetails = {},
    } = body;

    if (!customerName || !customerEmail || !category || !subject || !initialMessage) {
      return NextResponse.json(
        { success: false, error: 'Name, email, category, subject, and message are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Auto-priority classification based on specification table
    let priority: TicketPriority = 'MEDIUM';
    if (category === 'PAYMENT_ISSUE') {
      priority = 'URGENT';
    } else if (category === 'DEFECT_DAMAGE' || category === 'WEBSITE_BUG') {
      priority = 'HIGH';
    } else if (category === 'BULK_GENERAL') {
      priority = 'LOW';
    }

    const id = `tick_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const ticketNumber = `#GN-TK-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: Ticket = {
      id,
      ticketNumber,
      customerName: customerName.trim(),
      customerEmail: customerEmail.toLowerCase().trim(),
      customerPhone: customerPhone ? String(customerPhone).trim() : undefined,
      orderId: orderId ? String(orderId).trim() : undefined,
      category: category as TicketCategory,
      priority,
      status: 'OPEN',
      subject: subject.trim(),
      initialMessage: initialMessage.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      telemetry: telemetry || {},
      exchangeDetails: exchangeDetails || {},
      paymentDetails: paymentDetails || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await createTicketInNeon(newTicket);
    if (!created) {
      return NextResponse.json(
        { success: false, error: 'Failed to record ticket in database.' },
        { status: 500 }
      );
    }

    // Asynchronously dispatch Ticket Created notification email (non-blocking)
    sendTicketCreatedEmail(newTicket).catch((err) => {
      console.warn('[Tickets API] Email dispatch notice:', err);
    });

    const accessToken = generateTicketAccessToken(newTicket.id, newTicket.customerEmail);

    return NextResponse.json({
      success: true,
      ticket: newTicket,
      token: accessToken,
      message: `Support ticket ${newTicket.ticketNumber} created successfully.`,
    });
  } catch (error: unknown) {
    console.error('[Tickets API POST] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryEmail = searchParams.get('email');

    const token =
      req.cookies.get('auth_token')?.value ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    let userEmail: string | null = null;
    if (token) {
      const payload = verifyJwt(token);
      if (payload && payload.email) {
        userEmail = payload.email;
      }
    }

    const targetEmail = userEmail || queryEmail;
    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: 'Customer email or authentication required.' },
        { status: 401 }
      );
    }

    const tickets = await getTicketsForUserFromNeon(targetEmail);

    return NextResponse.json({
      success: true,
      tickets,
    });
  } catch (error: unknown) {
    console.error('[Tickets API GET] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
