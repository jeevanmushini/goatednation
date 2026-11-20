import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayPayment } from '../../../../lib/razorpay';
import { PaymentVerificationRequest } from '../../../../types/payment';
import { saveOrderToNeon } from '../../../../lib/db/neon';

export async function POST(req: NextRequest) {
  try {
    const body: PaymentVerificationRequest = await req.json();

    if (!body.razorpay_order_id || !body.razorpay_payment_id) {
      return NextResponse.json(
        { success: false, error: 'Order ID and Payment ID are required' },
        { status: 400 }
      );
    }

    const verification = verifyRazorpayPayment(body);

    if (verification.verified) {
      // Persist / update verified payment record in Neon Postgres (PROD-04)
      await saveOrderToNeon({
        id: body.razorpay_order_id,
        razorpayOrderId: body.razorpay_order_id,
        razorpayPaymentId: body.razorpay_payment_id,
        status: 'PAID',
        items: [],
      }).catch((err) => {
        console.warn('[Payment Verify] Failed to update order in Neon:', err);
      });

      return NextResponse.json({
        success: true,
        data: verification,
      });
    } else {
      return NextResponse.json(
        { success: false, error: verification.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Error during payment verification' },
      { status: 500 }
    );
  }
}
