import { NextRequest, NextResponse } from 'next/server';
import { getOrdersPendingReviewNudge, markReviewEmailSent } from '../../../../lib/db/neon';
import { sendReviewRequestEmail } from '../../../../lib/email/mailer';

/**
 * Automated Review Request Dispatcher
 * -----------------------------------
 * Cron endpoint intended to be invoked daily (e.g. via Vercel Cron or GitHub Action).
 * Identifies orders delivered 3–14 days ago and sends a Tokyo Streetwear review nudge.
 */
export async function GET(req: NextRequest) {
  return handleDispatch(req);
}

export async function POST(req: NextRequest) {
  return handleDispatch(req);
}

async function handleDispatch(req: NextRequest) {
  try {
    // Optional cron secret verification for production environments
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In production with a secret configured, reject unauthenticated triggers
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
      }
    }

    const eligibleOrders = await getOrdersPendingReviewNudge();
    let sentCount = 0;

    for (const order of eligibleOrders) {
      if (!order.userEmail) continue;

      const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
      const productTitle = firstItem?.title || firstItem?.name || 'Syndicate Heavyweight Garment';
      const productImage = firstItem?.image || undefined;
      const productSlug = firstItem?.slug || firstItem?.id || undefined;

      try {
        await sendReviewRequestEmail({
          to: order.userEmail,
          customerName: order.customerName || 'Collector',
          orderId: order.id,
          productId: firstItem?.id,
          productTitle,
          productImage,
          productSlug,
        });

        await markReviewEmailSent(order.id);
        sentCount++;
      } catch (sendErr) {
        console.error(`[Review Cron] Failed to send review request for order ${order.id}:`, sendErr);
      }
    }

    return NextResponse.json({
      success: true,
      eligibleCount: eligibleOrders.length,
      dispatchedCount: sentCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[Review Cron Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
