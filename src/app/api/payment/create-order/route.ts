import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder, getRazorpayKeys } from '../../../../lib/razorpay';
import { RazorpayOrderRequest } from '../../../../types/payment';

export async function POST(req: NextRequest) {
  try {
    const body: RazorpayOrderRequest = await req.json();

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than zero' },
        { status: 400 }
      );
    }

    const order = await createRazorpayOrder(body);
    const { keyId } = getRazorpayKeys();

    return NextResponse.json({
      success: true,
      order,
      keyId,
    });
  } catch (error) {
    console.error('Payment order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}

