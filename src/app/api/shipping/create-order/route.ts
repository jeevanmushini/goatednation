import { NextRequest, NextResponse } from 'next/server';
import { createShiprocketOrder } from '../../../../lib/shiprocket';
import { ShippingOrderPayload } from '../../../../types/shipping';
import { saveOrderToNeon } from '../../../../lib/db/neon';
import { recordShipmentEvent } from '../../../../lib/shippingLedger';
import { sendOrderConfirmationEmail } from '../../../../lib/email/mailer';

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

    // 3. Dispatch Visual Order Confirmation & Receipt Email (non-blocking)
    if (payload.email) {
      sendOrderConfirmationEmail({
        to: payload.email,
        orderId: payload.orderId,
        customerName: payload.customerName || 'Collector',
        items: (payload.items || []).map((i) => ({
          title: i.name,
          price: i.sellingPrice ?? (i as Record<string, unknown>).selling_price as number ?? 0,
          quantity: i.units || 1,
          size: i.sku?.includes('-') ? i.sku.split('-').pop() : undefined,
        })),
        subtotal: payload.subtotal || 0,
        shippingCharge: payload.shippingCharge || 0,
        totalAmount: (payload.subtotal || 0) + (payload.shippingCharge || 0),
        shippingAddress: {
          customerName: payload.customerName,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          pincode: payload.pincode,
          phone: payload.phone,
        },
      }).catch((err) => {
        console.error('[Shipping API] Order confirmation email error:', err);
      });
    }

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
