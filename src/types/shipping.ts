export interface CourierServiceability {
  courierCompanyId: number;
  courierName: string;
  rate: number;
  estimatedDeliveryDays: string;
  codAvailable: boolean;
  rating: number;
}

export interface ServiceabilityResponse {
  success: boolean;
  pincode: string;
  isServiceable: boolean;
  city?: string;
  state?: string;
  recommendedCourier?: CourierServiceability;
  availableCouriers: CourierServiceability[];
  error?: string;
}

export interface ShippingOrderPayload {
  orderId: string;
  orderDate: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: 'COD' | 'Prepaid';
  subtotal: number;
  shippingCharge: number;
  items: {
    name: string;
    sku: string;
    units: number;
    sellingPrice: number;
  }[];
}

export interface TrackingActivity {
  date: string;
  status: string;
  activity: string;
  location: string;
}

export interface TrackingResponse {
  success: boolean;
  awbCode: string;
  orderId: string;
  courierName: string;
  currentStatus: 'ORDER_PLACED' | 'MANIFESTED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  estimatedDelivery: string;
  origin: string;
  destination: string;
  scans: TrackingActivity[];
  isLive?: boolean;
  source?: string;
  error?: string;
}

