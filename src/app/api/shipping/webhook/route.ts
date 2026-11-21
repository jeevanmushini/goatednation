import { NextRequest, NextResponse } from 'next/server';
import { verifyShiprocketWebhook } from '../../../../lib/shiprocket';
import { recordShipmentEvent } from '../../../../lib/shippingLedger';
import { getOrderByIdFromNeon } from '../../../../lib/db/neon';
import { sendShippingUpdateEmail } from '../../../../lib/email/mailer';

/**
 * Shiprocket Webhook Handler
 * --------------------------
 * Configure this URL in Shiprocket Dashboard → Settings → Webhooks:
 *   https://yourdomain.com/api/shipping/webhook
 *
 * Supported events:
 *   - shipment.booked         → AWB generated
 *   - shipment.pickup_scheduled → Pickup confirmed
 *   - shipment.manifested      → Handed to courier
 *   - shipment.in_transit      → In transit
 *   - shipment.out_for_delivery → Out for delivery
 *   - shipment.delivered       → Delivered successfully
 *   - shipment.rto_initiated   → Return to origin triggered
 *   - shipment.ndr             → Non-delivery report
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-shiprocket-hmac');

    // Verify signature when secret is configured
    if (process.env.SHIPROCKET_WEBHOOK_SECRET) {
      const isValid = verifyShiprocketWebhook(rawBody, signature);
      if (!isValid) {
        console.warn('[Shiprocket Webhook] Invalid HMAC signature — request rejected');
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventType = (event.event as string) || (event.current_status as string) || 'unknown';
    const awbCode = (event.awb as string) || (event.awb_code as string) || '';
    const orderId = (event.order_id as string) || '';
    const shipmentId = (event.shipment_id as string) || '';
    const currentStatus = (event.current_status as string) || eventType;

    // Persist real shipment state change in the system ledger
    const record = recordShipmentEvent({
      orderId,
      awbCode,
      shipmentId,
      status: currentStatus,
      eventType,
      details: event,
    });

    console.log('[Shiprocket Webhook] Handled & Recorded:', {
      eventType,
      awbCode,
      orderId,
      shipmentId,
      currentStatus,
      timestamp: new Date().toISOString(),
    });

    // Dispatches live logistics update emails for milestones: in_transit, out_for_delivery, delivered
    const statusLower = currentStatus.toLowerCase();
    const isLogisticsMilestone =
      statusLower.includes('in_transit') ||
      statusLower.includes('in transit') ||
      statusLower.includes('out_for_delivery') ||
      statusLower.includes('out for delivery') ||
      statusLower.includes('delivered');

    if (isLogisticsMilestone) {
      const directEmail = (event.customer_email as string) || (event.email as string);
      const courierName =
        (event.courier_name as string) || (event.courier as string) || 'Shiprocket Express';

      if (directEmail) {
        sendShippingUpdateEmail({
          to: directEmail,
          orderId: orderId || awbCode,
          customerName: (event.customer_name as string) || 'Collector',
          awbCode,
          courierName,
          status: currentStatus,
        }).catch((err) => {
          console.warn('[Shiprocket Webhook] Shipping email dispatch notice:', err);
        });
      } else if (orderId || awbCode) {
        getOrderByIdFromNeon(orderId || awbCode)
          .then((order) => {
            if (order && order.userEmail) {
              sendShippingUpdateEmail({
                to: order.userEmail,
                orderId: order.id,
                customerName:
                  (order.shippingAddress as Record<string, string>)?.customerName || 'Collector',
                awbCode: awbCode || order.awbCode,
                courierName,
                status: currentStatus,
              }).catch((err) => {
                console.warn('[Shiprocket Webhook] Shipping email dispatch notice:', err);
              });
            }
          })
          .catch(() => {});
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true, event: eventType, record });
  } catch (error) {
    console.error('[Shiprocket Webhook] Processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
