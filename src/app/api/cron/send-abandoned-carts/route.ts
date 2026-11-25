import { NextRequest, NextResponse } from 'next/server';
import { getPendingAbandonedCarts, markAbandonedCartEmailSent } from '../../../../lib/db/neon';
import { sendAbandonedCartEmail } from '../../../../lib/email/mailer';

/**
 * Abandoned Cart Recovery Dispatcher
 * ----------------------------------
 * Cron endpoint invoked hourly/daily to recover dropped checkouts 2h–48h old.
 */
export async function GET(req: NextRequest) {
  return handleDispatch(req);
}

export async function POST(req: NextRequest) {
  return handleDispatch(req);
}

async function handleDispatch(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://goatednation.com';
    const pendingCarts = await getPendingAbandonedCarts();
    let sentCount = 0;

    for (const cart of pendingCarts) {
      if (!cart.email) continue;

      const restoreCartUrl = `${appUrl}/cart?restore=${cart.id}`;

      try {
        await sendAbandonedCartEmail({
          to: cart.email,
          customerName: cart.customerName || 'Collector',
          items: cart.items,
          totalAmount: cart.totalAmount,
          restoreCartUrl,
        });

        await markAbandonedCartEmailSent(cart.id);
        sentCount++;
      } catch (sendErr) {
        console.error(`[Abandoned Cart Cron] Failed to send recovery email for cart ${cart.id}:`, sendErr);
      }
    }

    return NextResponse.json({
      success: true,
      eligibleCount: pendingCarts.length,
      dispatchedCount: sentCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[Abandoned Cart Cron Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
