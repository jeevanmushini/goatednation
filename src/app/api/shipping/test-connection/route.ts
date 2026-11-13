import { NextResponse } from 'next/server';
import { testShiprocketConnection } from '../../../../lib/shiprocket';

export async function GET() {
  try {
    const result = await testShiprocketConnection();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Test Connection API] Error:', error);
    return NextResponse.json(
      { connected: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

