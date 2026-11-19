import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveOrderToNeon } from '../../../../lib/db/neon';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Enforce mandatory signature validation (SEC-06)
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json(
          { success: false, error: 'Missing x-razorpay-signature header' },
          { status: 401 }
        );
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const expBuf = Buffer.from(expectedSignature, 'hex');
      const sigBuf = Buffer.from(signature, 'hex');
      if (expBuf.length !== sigBuf.length || !crypto.timingSafeEqual(expBuf, sigBuf)) {
        return NextResponse.json(
          { success: false, error: 'Invalid webhook signature' },
          { status: 400 }
        );
      }
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Webhook secret not configured on production' },
        { status: 500 }
      );
    }

    const payload = JSON.parse(rawBody);
    console.log(`[Razorpay Webhook] Received event: ${payload.event}`);

    // Handle payment.captured and order.paid (BUG-04 & PROD-04)
    if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || `ord_${Date.now()}`;
      const paymentId = paymentEntity?.id;
      const email = paymentEntity?.email || '';
      const amount = paymentEntity?.amount ? paymentEntity.amount / 100 : 0;

      console.log(`[Razorpay Webhook] Payment verified: orderId=${orderId}, paymentId=${paymentId}, email=${email}`);

      // Persist order details to Neon Postgres database
      await saveOrderToNeon({
        id: orderId,
        userEmail: email,
        razorpayOrderId: paymentEntity?.order_id,
        razorpayPaymentId: paymentId,
        status: 'PAID',
        items: paymentEntity?.notes?.items ? JSON.parse(paymentEntity.notes.items) : [],
        shippingAddress: paymentEntity?.notes?.address ? JSON.parse(paymentEntity.notes.address) : {},
        totalAmount: amount,
      }).catch((err) => {
        console.warn('[Razorpay Webhook] Failed to record order in Neon:', err);
      });
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}
