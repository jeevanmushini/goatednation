import { NextRequest, NextResponse } from 'next/server';
import { trackShipment } from '@/lib/shiprocket';
import { getOrderByIdFromNeon } from '@/lib/db/neon';
import { verifyJwt } from '@/lib/auth/jwt';

// Helper to sanitize and mask customer PII for public lookups
function sanitizeOrderForPublic(order: any, isAuthorizedOwner: boolean) {
  if (!order) return null;

  if (isAuthorizedOwner) {
    return order; // Full data for verified account owner or admin
  }

  const rawAddress = (order.shippingAddress || {}) as Record<string, string>;
  const email = String(order.userEmail || '');
  const phone = String(rawAddress.phone || '');

  // Mask email: j***@gmail.com
  let maskedEmail = '';
  if (email.includes('@')) {
    const [user, domain] = email.split('@');
    maskedEmail = `${user.slice(0, 1)}***@${domain}`;
  }

  // Mask phone: ******5678
  const maskedPhone = phone.length > 4 ? `******${phone.slice(-4)}` : '******';

  // Mask name: John D***
  const nameParts = (rawAddress.customerName || 'Collector').split(' ');
  const maskedName =
    nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[1].slice(0, 1)}***`
      : `${nameParts[0].slice(0, 1)}***`;

  return {
    id: order.id,
    status: order.status,
    awbCode: order.awbCode,
    shiprocketOrderId: order.shiprocketOrderId,
    createdAt: order.createdAt,
    totalAmount: order.totalAmount,
    customerName: maskedName,
    userEmail: maskedEmail,
    phone: maskedPhone,
    // Safe geographic destination without street address
    destination: {
      city: rawAddress.city || 'Undisclosed',
      state: rawAddress.state || '',
      pincode: rawAddress.pincode || '',
    },
    items: Array.isArray(order.items)
      ? order.items.map((i: any) => ({
          title: i.title || i.name || 'Syndicate Garment',
          quantity: i.quantity || i.units || 1,
          size: i.size || (i.sku?.includes('-') ? i.sku.split('-').pop() : undefined),
        }))
      : [],
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const identifier = (searchParams.get('identifier') || searchParams.get('orderId') || searchParams.get('awb') || '').trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Tracking number or Order ID is required.' },
        { status: 400 }
      );
    }

    // 1. Fetch order metadata from Neon DB
    const order = await getOrderByIdFromNeon(identifier);
    const trackingQuery = (order && order.awbCode) ? order.awbCode : identifier;

    // 2. Determine caller authorization level
    let isAuthorizedOwner = false;
    const token =
      req.cookies.get('auth_token')?.value ||
      req.cookies.get('gn_auth_token')?.value ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (token && order) {
      const payload = verifyJwt(token);
      if (payload) {
        const callerEmail = payload.email.toLowerCase().trim();
        const orderEmail = (order.userEmail || '').toLowerCase().trim();
        if (payload.role === 'ADMIN' || callerEmail === orderEmail) {
          isAuthorizedOwner = true;
        }
      }
    }

    // 3. Fetch live tracking details from Shiprocket
    const tracking = await trackShipment(trackingQuery);

    return NextResponse.json({
      success: true,
      data: {
        order: sanitizeOrderForPublic(order, isAuthorizedOwner),
        tracking,
      },
    });
  } catch (error: unknown) {
    console.error('[Ticket Lookup API] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
