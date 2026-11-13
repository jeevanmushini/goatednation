import { NextRequest, NextResponse } from 'next/server';
import { createShiprocketOrder } from '../../../../lib/shiprocket';
import { ShippingOrderPayload } from '../../../../types/shipping';

export async function POST(req: NextRequest) {
  try {
    const payload: ShippingOrderPayload = await req.json();

    if (!payload.orderId || !payload.pincode || !payload.items?.length) {
      return NextResponse.json(
        { success: false, error: 'Missing required order fields for Shiprocket' },
        { status: 400 }
      );
    }

    const shiprocketOrder = await createShiprocketOrder(payload);

    return NextResponse.json({
      success: true,
      message: 'Shiprocket shipment created successfully',
      data: shiprocketOrder,
    });
  } catch (error) {
    console.error('Shiprocket order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create Shiprocket order' },
      { status: 500 }
    );
  }
}

