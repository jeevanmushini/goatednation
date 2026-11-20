import { NextRequest, NextResponse } from 'next/server';
import { createShiprocketOrder } from '../../../../lib/shiprocket';
import { ShippingOrderPayload } from '../../../../types/shipping';
import { saveOrderToNeon } from '../../../../lib/db/neon';
import { recordShipmentEvent } from '../../../../lib/shippingLedger';

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

    // 1. Persist order details to Neon Postgres app_orders table (PROD-04)
    await saveOrderToNeon({
      id: payload.orderId,
      userEmail: payload.email,
      shiprocketOrderId: shiprocketOrder.orderId ? String(shiprocketOrder.orderId) : undefined,
      awbCode: shiprocketOrder.awbCode || undefined,
      status: 'CONFIRMED',
      items: payload.items,
      shippingAddress: {
        customerName: payload.customerName,
        phone: payload.phone,
        address: payload.address,
        city: payload.city,
        state: payload.state,
        pincode: payload.pincode,
        paymentMethod: payload.paymentMethod,
      },
      totalAmount: (payload.subtotal || 0) + (payload.shippingCharge || 0),
    }).catch((err) => {
      console.warn('[Shipping API] Failed to record order in Neon:', err);
    });

    // 2. Record shipment event in persistent shipping ledger (BUG-08)
    recordShipmentEvent({
      orderId: payload.orderId,
      awbCode: shiprocketOrder.awbCode || '',
      shipmentId: String(shiprocketOrder.shipmentId || ''),
      status: 'CONFIRMED',
      eventType: 'SHIPMENT_BOOKED',
      details: shiprocketOrder,
    });

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
