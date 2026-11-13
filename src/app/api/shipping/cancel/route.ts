import { NextRequest, NextResponse } from 'next/server';
import { cancelShiprocketOrder } from '../../../../lib/shiprocket';

export async function POST(req: NextRequest) {
  try {
    const { orderIds } = await req.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'orderIds array is required' },
        { status: 400 }
      );
    }

    const result = await cancelShiprocketOrder(orderIds.map(Number));
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Cancel Order API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while cancelling order' },
      { status: 500 }
    );
  }
}

