import { NextRequest, NextResponse } from 'next/server';
import { verifyShiprocketWebhook } from '../../../../lib/shiprocket';
import { recordShipmentEvent } from '../../../../lib/shippingLedger';

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
