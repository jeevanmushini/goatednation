import { NextRequest, NextResponse } from 'next/server';
import { getNDRDetails, retryNDRDelivery } from '../../../../lib/shiprocket';

export async function GET() {
  try {
    const result = await getNDRDetails();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[NDR API] Error fetching NDRs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error fetching NDR details' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { awbCode, action, rescheduledDate } = await req.json();

    if (!awbCode || !action) {
      return NextResponse.json(
        { success: false, error: 'awbCode and action are required' },
        { status: 400 }
      );
    }

    const result = await retryNDRDelivery(awbCode, action, rescheduledDate);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[NDR API] Error updating NDR:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error updating NDR' },
      { status: 500 }
    );
  }
}

