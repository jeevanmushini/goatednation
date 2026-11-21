import { NextRequest, NextResponse } from 'next/server';
import { trackShipment } from '@/lib/shiprocket';
import { getOrderByIdFromNeon } from '@/lib/db/neon';

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

    // 2. Fetch live tracking details from Shiprocket
    const tracking = await trackShipment(trackingQuery);

    return NextResponse.json({
      success: true,
      data: {
        order: order || null,
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
