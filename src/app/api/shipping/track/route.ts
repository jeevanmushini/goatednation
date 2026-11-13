import { NextRequest, NextResponse } from 'next/server';
import { trackShipment } from '../../../../lib/shiprocket';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || searchParams.get('awb');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Tracking ID or AWB number is required' },
        { status: 400 }
      );
    }

    const trackingInfo = await trackShipment(id);
    return NextResponse.json(trackingInfo);
  } catch (error) {
    console.error('Shipment tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve tracking info' },
      { status: 500 }
    );
  }
}

