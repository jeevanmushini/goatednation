import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth/jwt';
import {
  getTicketByIdFromNeon,
  updateTicketInNeon,
  addTicketMessageInNeon,
} from '@/lib/db/neon';
import { refundRazorpayPayment } from '@/lib/razorpay';
import { sendTicketResolvedEmail } from '@/lib/email/mailer';
import { TicketMessage } from '@/types/ticket';

function checkAdminAuth(req: NextRequest): boolean {
  const token =
    req.cookies.get('auth_token')?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) return false;
  const payload = verifyJwt(token);
  return Boolean(payload && payload.role === 'ADMIN');
}

export async function POST(
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
    const paymentId = body.paymentId || ticket.paymentDetails?.paymentId;
    const amount = body.amount || ticket.paymentDetails?.amount;
    const reason = body.reason || 'Support Desk refund execution';

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Razorpay Payment ID is required for refund execution.' },
        { status: 400 }
      );
    }

    const refundRes = await refundRazorpayPayment(paymentId, amount, {
      ticketNumber: ticket.ticketNumber,
      reason,
    });

    if (!refundRes.success) {
      return NextResponse.json(
        { success: false, error: refundRes.error || 'Failed to execute Razorpay refund.' },
        { status: 400 }
      );
    }

    const refundId = refundRes.refundId || `rfnd_${Date.now()}`;
    const resolutionNotes = `Razorpay refund executed successfully. Refund ID: ${refundId}${amount ? ` for ₹${amount}` : ''}. Funds will reflect in customer's source account within 3–5 business days.`;

    await updateTicketInNeon(ticket.id, {
      status: 'RESOLVED',
      resolutionNotes,
    });

    // Add system message to conversation
    const systemMsg: TicketMessage = {
      id: `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      ticketId: ticket.id,
      senderType: 'SYSTEM',
      senderName: 'RAZORPAY GATEWAY DISPATCHER',
      message: `Refund of ${amount ? `₹${amount}` : 'full order amount'} initiated via Razorpay. Transaction Refund ID: ${refundId}.`,
      attachments: [],
      isInternal: false,
      createdAt: new Date().toISOString(),
    };
    await addTicketMessageInNeon(systemMsg);

    const refreshed = (await getTicketByIdFromNeon(ticket.id)) || ticket;
    sendTicketResolvedEmail({
      ticket: refreshed,
      resolutionNotes,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      refundId,
      message: `Refund ${refundId} initiated successfully. Ticket marked as RESOLVED.`,
    });
  } catch (error: unknown) {
    console.error('[Admin Refund Action API] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
