import { NextRequest, NextResponse } from 'next/server';
import { getShipmentRates } from '../../../../lib/shiprocket';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pincode, weight, cod } = body;

    if (!pincode) {
      return NextResponse.json(
        { success: false, error: 'pincode is required' },
        { status: 400 }
      );
    }

    const result = await getShipmentRates(
      pincode.toString(),
      process.env.PRIVATE_SHIPROCKET_PICKUP_PINCODE ||
        process.env.NEXT_PUBLIC_SHIPROCKET_PICKUP_PINCODE ||
        process.env.SHIPROCKET_PICKUP_PINCODE ||
        '560054',
      weight || 0.5,
      cod !== undefined ? (cod ? 1 : 0) : 1
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Rates API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error fetching shipping rates' },
      { status: 500 }
    );
  }
}

