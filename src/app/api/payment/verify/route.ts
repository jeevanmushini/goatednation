import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayPayment } from '../../../../lib/razorpay';
import { PaymentVerificationRequest } from '../../../../types/payment';

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

