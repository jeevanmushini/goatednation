import { NextRequest, NextResponse } from 'next/server';
import { verifyShiprocketWebhook } from '../../../../lib/shiprocket';

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

    const eventType = event.event as string;
    const awbCode = event.awb as string;
    const orderId = event.order_id as string;
    const shipmentId = event.shipment_id as string;
    const currentStatus = event.current_status as string;

    console.log('[Shiprocket Webhook] Received:', {
      eventType,
      awbCode,
      orderId,
      shipmentId,
      currentStatus,
      timestamp: new Date().toISOString(),
    });

    // ── Handle individual event types ──
    switch (eventType) {
      case 'shipment.booked':
        // AWB generated — update order in DB with AWB code
        console.log(`[Webhook] Shipment booked. AWB: ${awbCode}, Order: ${orderId}`);
        // TODO: await db.orders.update({ awbCode }, { where: { orderId } });
        break;

      case 'shipment.pickup_scheduled':
        console.log(`[Webhook] Pickup scheduled. AWB: ${awbCode}`);
        break;

      case 'shipment.manifested':
        console.log(`[Webhook] Shipment manifested (handed to courier). AWB: ${awbCode}`);
        break;

      case 'shipment.in_transit':
        console.log(`[Webhook] In transit. AWB: ${awbCode}, Status: ${currentStatus}`);
        break;

      case 'shipment.out_for_delivery':
        console.log(`[Webhook] Out for delivery. AWB: ${awbCode}`);
        // TODO: Send SMS/email to customer
        break;

      case 'shipment.delivered':
        console.log(`[Webhook] DELIVERED. AWB: ${awbCode}, Order: ${orderId}`);
        // TODO: Mark order as delivered, trigger review email
        break;

      case 'shipment.rto_initiated':
        console.log(`[Webhook] RTO initiated. AWB: ${awbCode}, Order: ${orderId}`);
        // TODO: Notify admin, halt refund until received
        break;

      case 'shipment.ndr':
        console.log(`[Webhook] NDR received. AWB: ${awbCode}. Reason: ${event.ndr_reason}`);
        // TODO: Alert admin/ops team, attempt re-delivery
        break;

      default:
        console.log(`[Webhook] Unknown event type: ${eventType}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true, event: eventType });
  } catch (error) {
    console.error('[Shiprocket Webhook] Processing error:', error);
    // Return 200 to prevent Shiprocket from retrying on our internal error
    return NextResponse.json({ received: true, error: 'Processing error (logged)' });
  }
}

