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
