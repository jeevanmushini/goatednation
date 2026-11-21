import { ProductSize } from './product';

export interface CartItem {
  id: string; // unique key combining productId, size, color
  productId: string;
  slug: string;
  title: string;
  anime: string;
  price: number;
  originalPrice: number;
  image: string;
  size: ProductSize;
  color: string;
  quantity: number;
}

export interface CouponDiscount {
  code: string;
  discountPercentage: number;
  description: string;
}

export const DEFAULT_COUPONS: CouponDiscount[] = [
  {
    code: 'DIWALI10',
    discountPercentage: 10,
    description: '10% off applied at checkout',
  },
  {
    code: 'WELCOME10',
    discountPercentage: 10,
    description: '10% off on your first order',
  },
  {
    code: 'CULT15',
    discountPercentage: 15,
    description: '15% off for syndicate community members',
  },
];
