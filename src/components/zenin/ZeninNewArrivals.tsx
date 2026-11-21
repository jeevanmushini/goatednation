'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../../stores/cartStore';
import { useCmsStore } from '../../lib/cms/cmsStore';
import { Product } from '../../types/product';

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

interface ZeninNewArrivalsProps {
  initialProducts?: Product[];
}

export const ZeninNewArrivals: React.FC<ZeninNewArrivalsProps> = ({ initialProducts }) => {
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const cmsProducts = useCmsStore((state) => state.products);

  // Dynamic source of truth: merge client store (with latest admin drops) and server initialProducts
  // Prioritizing the 3 updated hoodies and custom admin drops at the very front!
  const activeProducts = React.useMemo(() => {
    const priorityList: Product[] = [];
    const regularList: Product[] = [];
    const seen = new Set<string>();

    const processItem = (p: Product) => {
      if (!p || !p.id || seen.has(p.id)) return;
      seen.add(p.id);
      const isCustomDrop = !p.id.startsWith('zn-') || p.id.startsWith('as-');
      const isHoodieOrFeatured =
        p.category === 'hoodies' ||
        p.id === 'zn-49' ||
        p.id === 'zn-50' ||
        p.id === 'zn-98' ||
        /hoodie|sweatshirt/i.test(p.title);

      if (isCustomDrop || isHoodieOrFeatured) {
        priorityList.push(p);
      } else {
        regularList.push(p);
      }
    };

    // 1. Authoritative server-published data processed first (guarantees zero hydration flicker)
    if (initialProducts && initialProducts.length > 0) {
      initialProducts.forEach(processItem);
    }

    // 2. Merge client store drops
    if (cmsProducts && cmsProducts.length > 0) {
      cmsProducts.forEach(processItem);
    }

    // Priority drops (3 hoodies & admin custom drops) ALWAYS stay at the very beginning!
    return [...priorityList, ...regularList];
  }, [cmsProducts, initialProducts]);

  // Compute products to display in the New Arrivals grid dynamically from active Neon DB / CMS products
  const products: ZeninProduct[] = React.useMemo(() => {
    return activeProducts.slice(0, 12).map((p: Product) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      price: p.price,
      originalPrice: p.originalPrice || Math.round(p.price * 1.4),
      badge: p.badge || (p.isNewDrop ? 'NEW DROP' : 'FEATURED'),
      images: [
        p.images[0] || '/images/placeholder-product.svg',
        p.images[1] || p.images[0] || '/images/placeholder-product.svg',
      ] as [string, string],
      category: p.category,
    }));
  }, [activeProducts]);

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
        image: p.images[0] || '/images/placeholder-product.svg',
        size: 'L',
        color: 'Onyx Black',
        quantity: 1,
      },
      true
    );
    openDrawer();
  };

  return (
    <section id="new-arrivals" className="bg-[#FFFFFF] py-16 px-4 sm:px-6 lg:px-8 border-b border-[#EAEAEA] scroll-mt-20">
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
  const primaryImage = product.images[0] || '/images/placeholder-product.svg';
  const secondaryImage = product.images[1] || primaryImage;
  const hasSecondary = secondaryImage && secondaryImage !== primaryImage;

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
            src={primaryImage}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized={!primaryImage.startsWith('/images/')}
            className={`object-cover object-center transition-all duration-500 ease-out ${
              isHovered && hasSecondary ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
            }`}
          />

          {/* Secondary Hover Image (only if a distinct secondary image exists) */}
          {hasSecondary && (
            <Image
              src={secondaryImage}
              alt={`${product.title} alternate view`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized={!secondaryImage.startsWith('/images/')}
              className={`object-cover object-center transition-all duration-500 ease-out absolute inset-0 ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            />
          )}

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
