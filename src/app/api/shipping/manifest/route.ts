import { NextRequest, NextResponse } from 'next/server';
import { generateManifest } from '../../../../lib/shiprocket';

export async function POST(req: NextRequest) {
  try {
    const { shipmentIds } = await req.json();

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'shipmentIds array is required' },
        { status: 400 }
      );
    }

    const result = await generateManifest(shipmentIds.map(Number));
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Manifest API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error generating manifest' },
      { status: 500 }
    );
  }
}

