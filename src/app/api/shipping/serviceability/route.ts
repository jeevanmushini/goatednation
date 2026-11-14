import { NextRequest, NextResponse } from 'next/server';
import { checkPincodeServiceability } from '../../../../lib/shiprocket';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pincode, cod, weight } = body;

    if (!pincode) {
      return NextResponse.json(
        { success: false, error: 'Pincode is required' },
        { status: 400 }
      );
    }

    const pickupPincode =
      process.env.PRIVATE_SHIPROCKET_PICKUP_PINCODE ||
      process.env.NEXT_PUBLIC_SHIPROCKET_PICKUP_PINCODE ||
      process.env.SHIPROCKET_PICKUP_PINCODE ||
      '560054';

    const result = await checkPincodeServiceability(
      pincode.toString(),
      pickupPincode,
      cod ? 1 : 0,
      weight || '0.5'
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Serviceability API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while checking serviceability' },
      { status: 500 }
    );
  }
}

