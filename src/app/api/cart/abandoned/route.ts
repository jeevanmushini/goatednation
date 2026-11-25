import { NextRequest, NextResponse } from 'next/server';
import { upsertAbandonedCheckout, getAbandonedCartById } from '../../../../lib/db/neon';

/**
 * Capture or Restore Abandoned Checkout Sessions
 * ----------------------------------------------
 * POST /api/cart/abandoned: Client-side checkout intent capture
 * GET  /api/cart/abandoned?id=...: 1-Click recovery cart restoration
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, email, name, phone, items, totalAmount } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email address is required.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one cart item is required.' },
        { status: 400 }
      );
    }

    const cartId = await upsertAbandonedCheckout({
      id,
      email,
      customerName: name,
      phone,
      items,
      totalAmount: Number(totalAmount || 0),
    });

    return NextResponse.json({
      success: true,
      cartId,
      message: 'Cart intent captured for recovery.',
    });
  } catch (error: unknown) {
    console.error('[Abandoned Cart API] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const cartId = req.nextUrl.searchParams.get('id');

    if (!cartId) {
      return NextResponse.json(
        { success: false, error: 'Cart ID parameter is required.' },
        { status: 400 }
      );
    }

    const cart = await getAbandonedCartById(cartId);
    if (!cart) {
      return NextResponse.json(
        { success: false, error: 'Abandoned cart session expired or not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cart,
    });
  } catch (error: unknown) {
    console.error('[Abandoned Cart API GET] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
