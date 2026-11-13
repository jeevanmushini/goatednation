'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../../stores/cartStore';
import { useCmsStore } from '../../lib/cms/cmsStore';

interface ZeninProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice: number;
  badge: string;
  images: [string, string];
  category: string;
}

const NEW_ARRIVALS: ZeninProduct[] = [
  {
    id: 'zn-01',
    slug: 'ryujin-dragon-jacquard-jacket',
    title: 'RYUJIN DRAGON / JACQUARD JACKET',
    price: 5000,
    originalPrice: 5699,
    badge: 'SAVE 55%',
    images: [
      'https://zenin.co.in/cdn/shop/files/web1s.jpg',
      'https://zenin.co.in/cdn/shop/files/web3-6_7cf68fc5-bb42-4e91-acf6-665b418ba0c1.jpg',
    ],
    category: 'jackets',
  },
  {
    id: 'zn-02',
    slug: 'waffle-cherry-blossom-full-sleeve',
    title: 'WAFFLE CHERRY BLOSSOM / FULL SLEEVE',
    price: 1849,
    originalPrice: 4999,
    badge: 'SAVE 63%',
    images: [
      'https://zenin.co.in/cdn/shop/files/W1-23.jpg',
      'https://zenin.co.in/cdn/shop/files/w2-25.jpg',
    ],
    category: 'tees',
  },
  {
    id: 'zn-03',
    slug: 'cherry-blossom-barrel-sweatpants',
    title: 'CHERRY BLOSSOM / BARREL SWEATPANTS',
    price: 1949,
    originalPrice: 4999,
    badge: 'SAVE 61%',
    images: [
      'https://zenin.co.in/cdn/shop/files/a1ss.jpg',
      'https://zenin.co.in/cdn/shop/files/a4-3.jpg',
    ],
    category: 'bottoms',
  },
  {
    id: 'zn-04',
    slug: 'demon-denim-crossbody-backpack',
    title: 'DEMON DENIM / CROSSBODY BACKPACK',
    price: 1999,
    originalPrice: 3999,
    badge: 'SAVE 36%',
    images: [
      'https://zenin.co.in/cdn/shop/files/berserkbagmock.jpg',
      'https://zenin.co.in/cdn/shop/files/berserkbag1.jpg',
    ],
    category: 'accessories',
  },
  {
    id: 'zn-05',
    slug: 'aot-suede-crossbody-backpack',
    title: 'AOT SUEDE / CROSSBODY BACKPACK',
    price: 1799,
    originalPrice: 3999,
    badge: 'SAVE 55%',
    images: [
      'https://zenin.co.in/cdn/shop/files/w2s-2.jpg',
      'https://zenin.co.in/cdn/shop/files/w1-20.jpg',
    ],
    category: 'accessories',
  },
  {
    id: 'zn-06',
    slug: 'illusion-white-denim-jacket',
    title: 'ILLUSION WHITE DENIM / JACKET',
    price: 2699,
    originalPrice: 4999,
    badge: 'SAVE 48%',
    images: [
      'https://zenin.co.in/cdn/shop/files/aizenweb1.jpg',
      'https://zenin.co.in/cdn/shop/files/aizenweb2.jpg',
    ],
    category: 'jackets',
  },
];

export const ZeninNewArrivals: React.FC = () => {
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const cmsProducts = useCmsStore((state) => state.products);

  // Merge CMS product updates and include newly added products from Admin
  const products: ZeninProduct[] = React.useMemo(() => {
    // 1. Updated existing NEW_ARRIVALS with any edits made in admin
    const updatedNewArrivals = NEW_ARRIVALS.map((na) => {
      const matchingCms = cmsProducts.find((p) => p.slug === na.slug || p.id === na.id);
      if (!matchingCms) return na;
      return {
        ...na,
        title: matchingCms.title,
        price: matchingCms.price,
        originalPrice: matchingCms.originalPrice,
        images: [
          matchingCms.images[0] || na.images[0],
          matchingCms.images[1] || matchingCms.images[0] || na.images[1],
        ] as [string, string],
        badge: matchingCms.badge || na.badge,
        category: matchingCms.category || na.category,
      };
    });

    // 2. Newly added products in cmsProducts that are not already in NEW_ARRIVALS
    const newCustomProducts: ZeninProduct[] = cmsProducts
      .filter((p) => !NEW_ARRIVALS.some((na) => na.id === p.id || na.slug === p.slug))
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        price: p.price,
        originalPrice: p.originalPrice || Math.round(p.price * 1.4),
        badge: p.badge || 'NEW DROP',
        images: [
          p.images[0] || 'https://zenin.co.in/cdn/shop/files/web1s.jpg',
          p.images[1] || p.images[0] || 'https://zenin.co.in/cdn/shop/files/web1s.jpg',
        ] as [string, string],
        category: p.category,
      }));

    // Put newly created products first, then updated arrivals, capped to 8 for the grid
    return [...newCustomProducts, ...updatedNewArrivals].slice(0, 8);
  }, [cmsProducts]);

  const handleQuickAdd = (p: ZeninProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      {
        productId: p.id,
        slug: p.slug,
        title: p.title,
        anime: 'Tokyo Editorial',
        price: p.price,
        originalPrice: p.originalPrice,
        image: p.images[0],
        size: 'L',
        color: 'Onyx Black',
        quantity: 1,
      },
      true
    );
    openDrawer();
  };

  return (
    <section className="bg-[#FFFFFF] py-16 px-4 sm:px-6 lg:px-8 border-b border-[#EAEAEA]">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading: NEW ARRIVAL / 新品上市 */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-black tracking-wider flex items-center space-x-2">
            <span>NEW ARRIVAL</span>
            <span className="text-[#888888]">/</span>
            <span className="font-normal text-base text-[#444444]">新品上市</span>
          </h2>
        </div>

        {/* 4-Column Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onQuickAdd={handleQuickAdd} />
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-12 text-center">
          <Link
            href="/collections"
            className="inline-block px-8 py-2.5 rounded-lg border border-[#D0D0D0] hover:border-black bg-white hover:bg-black text-black hover:text-white text-xs font-sans font-medium transition-all duration-200"
          >
            View all
          </Link>
        </div>
      </div>
    </section>
  );
};

// Sub-component for individual card with dual-image hover transition
const ProductCard: React.FC<{
  product: ZeninProduct;
  onQuickAdd: (p: ZeninProduct, e: React.MouseEvent) => void;
}> = ({ product, onQuickAdd }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group flex flex-col justify-between"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image Container with Dual Image Swap */}
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-md bg-[#F4F4F4] mb-3">
          {/* Main Primary Image */}
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover object-center transition-all duration-500 ease-out ${
              isHovered ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
            }`}
          />

          {/* Secondary Hover Image */}
          <Image
            src={product.images[1]}
            alt={`${product.title} alternate view`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover object-center transition-all duration-500 ease-out absolute inset-0 ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          />

          {/* Crimson Red Discount Badge in Bottom-Left Corner */}
          <div className="absolute bottom-2 left-2 z-10">
            <span className="bg-[#8B1D1D] text-white font-mono text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded tracking-wider">
              {product.badge}
            </span>
          </div>

          {/* Quick Add overlay button (Always accessible on mobile, hover-revealed on desktop) */}
          <button
            onClick={(e) => onQuickAdd(product, e)}
            className="absolute bottom-2 right-2 z-10 px-2.5 py-1 bg-black/90 hover:bg-black text-white text-[9px] sm:text-[10px] font-mono uppercase tracking-wider rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 shadow-md active:scale-95"
          >
            + Quick Add
          </button>
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          <h3 className="text-[11px] sm:text-xs font-mono font-bold text-[#111111] uppercase tracking-wider line-clamp-1 group-hover:text-[#FF4D00] transition-colors">
            {product.title}
          </h3>

          <div className="flex items-center space-x-2 text-[11px] sm:text-xs font-mono">
            <span className="text-[#888888] line-through">
              Rs. {product.originalPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-black font-bold">
              Rs. {product.price.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};
