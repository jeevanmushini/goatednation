export type ProductCategory = 'tees' | 'hoodies' | 'jackets' | 'cargo' | 'acid-wash' | 'accessories';
export type ProductSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';

export interface ProductColor {
  name: string;
  hex: string;
  class: string;
}

export interface ProductDetails {
  gsm: string;
  fabric: string;
  fit: string;
  printType: string;
  care: string[];
}

export interface ProductReview {
  id: string;
  author: string;
  city: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  sizePurchased: ProductSize;
  fitRating: 'Runs small' | 'True to size' | 'Oversized perfection';
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  anime: string;
  category: ProductCategory;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  images: string[];
  description: string;
  details: ProductDetails;
  sizes: ProductSize[];
  colors: ProductColor[];
  inStock: boolean;
  stockCount: number;
  isFeatured?: boolean;
  isNewDrop?: boolean;
  isBestseller?: boolean;
  reviews: ProductReview[];
}
