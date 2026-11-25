import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayPayment } from '../../../../lib/razorpay';
import { PaymentVerificationRequest } from '../../../../types/payment';
import { saveOrderToNeon, getOrderByIdFromNeon, markCheckoutRecovered } from '../../../../lib/db/neon';
import { sendOrderConfirmationEmail } from '../../../../lib/email/mailer';

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

      // Dispatch Order Confirmation Email if customer email is on record (non-blocking)
      getOrderByIdFromNeon(body.razorpay_order_id)
        .then((order) => {
          if (order && order.userEmail) {
            // Mark any abandoned checkouts for this customer as recovered
            markCheckoutRecovered(order.userEmail).catch(() => {});

            sendOrderConfirmationEmail({
              to: order.userEmail,
              orderId: order.id,
              customerName: (order.shippingAddress as Record<string, string>)?.customerName || 'Collector',
              items: ((order.items as Array<Record<string, unknown>>) || []).map((i) => ({
                title: String(i.title || i.name || 'Syndicate Garment'),
                price: Number(i.price || i.selling_price || 0),
                quantity: Number(i.quantity || i.units || 1),
                size: (i.size as string) || undefined,
                color: (i.color as string) || undefined,
              })),
              subtotal: order.totalAmount || 0,
              totalAmount: order.totalAmount || 0,
              shippingAddress: order.shippingAddress as Record<string, string>,
            }).catch((err) => {
              console.warn('[Payment Verify] Confirmation email notice:', err);
            });
          }
        })
        .catch(() => {});

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
