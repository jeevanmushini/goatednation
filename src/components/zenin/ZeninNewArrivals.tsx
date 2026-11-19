'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../../stores/cartStore';
import { useCmsStore } from '../../lib/cms/cmsStore';
import { Product } from '../../types/product';
import { PRODUCTS } from '../../data/products';

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

const NEW_ARRIVALS: ZeninProduct[] = [
  {
    id: 'zn-49',
    slug: 'demon-sweatshirt',
    title: 'DEMON WASHED / SWEATSHIRT',
    price: 1799,
    originalPrice: 2999,
    badge: 'NEW DROP',
    images: [
      '/images/hero/berserk-hoodie.jpg',
      '/images/hero/berserk-hoodie.jpg',
    ],
    category: 'hoodies',
  },
  {
    id: 'zn-50',
    slug: 'nocursed-embroidery-sweatshirt',
    title: 'NO CURSED SPIRIT / EMBROIDERY SWEATSHIRT',
    price: 1799,
    originalPrice: 2799,
    badge: 'NEW DROP',
    images: [
      '/images/hero/sukuna-jacket.jpg',
      '/images/hero/sukuna-jacket.jpg',
    ],
    category: 'hoodies',
  },
  {
    id: 'zn-98',
    slug: 'dragon-embroidery-zipper',
    title: 'DRAGON EMBROIDERY / ZIPPER',
    price: 2199,
    originalPrice: 2899,
    badge: 'NEW DROP',
    images: [
      '/images/hero/berserk-hoodie.jpg',
      '/images/hero/sukuna-jacket.jpg',
    ],
    category: 'hoodies',
  },
  {
    id: 'zn-01',
    slug: 'ryujin-dragon-jacquard-jacket',
    title: 'RYUJIN DRAGON / JACQUARD JACKET',
    price: 2099,
    originalPrice: 5999,
    badge: 'SAVE 65%',
    images: [
      '/images/hero/ryujin-jacket.jpg',
      '/images/hero/ryujin-jacket.jpg',
    ],
    category: 'jackets',
  },
  {
    id: 'zn-02',
    slug: 'waffle-cherry-blossom-full-sleeve',
    title: 'WAFFLE CHERRY BLOSSOM / FULL SLEEVE',
    price: 1549,
    originalPrice: 3999,
    badge: 'SAVE 61%',
    images: [
      '/images/hero/cherry-blossom-waffle.jpg',
      '/images/hero/cherry-blossom-waffle.jpg',
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
      '/images/hero/cherry-blossom-waffle.jpg',
      '/images/hero/cherry-blossom-waffle.jpg',
    ],
    category: 'bottoms',
  },
  {
    id: 'zn-04',
    slug: 'demon-denim-crossbody-backpack',
    title: 'DEMON DENIM / CROSSBODY BACKPACK',
    price: 1999,
    originalPrice: 3999,
    badge: 'SAVE 50%',
    images: [
      '/images/hero/zoro-crossbody.jpg',
      '/images/hero/zoro-crossbody.jpg',
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
      '/images/hero/zoro-crossbody.jpg',
      '/images/hero/zoro-crossbody.jpg',
    ],
    category: 'accessories',
  },
  {
    id: 'zn-06',
    slug: 'illusion-white-denim-jacket',
    title: 'ILLUSION WHITE DENIM / JACKET',
    price: 2699,
    originalPrice: 4999,
    badge: 'SAVE 46%',
    images: [
      '/images/hero/valhalla-bomber.jpg',
      '/images/hero/valhalla-bomber.jpg',
    ],
    category: 'jackets',
  },
];

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

    // 1. Any product in cmsProducts (client store has newest drops)
    if (cmsProducts && cmsProducts.length > 0) {
      cmsProducts.forEach(processItem);
    }

    // 2. Any product in initialProducts (server published data)
    if (initialProducts && initialProducts.length > 0) {
      initialProducts.forEach(processItem);
    }

    // Fallback if empty
    if (priorityList.length === 0 && regularList.length === 0) {
      PRODUCTS.forEach(processItem);
    }

    // Priority drops (3 hoodies & admin custom drops) ALWAYS stay at the very beginning!
    return [...priorityList, ...regularList];
  }, [cmsProducts, initialProducts]);

  // Compute products to display in the New Arrivals grid
  const products: ZeninProduct[] = React.useMemo(() => {
    // 1. Priority drops: The updated hoodies and any custom admin drops
    const priorityDrops: ZeninProduct[] = activeProducts
      .filter((p: Product) => {
        const isCustom = !p.id.startsWith('zn-') || p.id.startsWith('as-');
        const isHoodie =
          p.category === 'hoodies' ||
          p.id === 'zn-49' ||
          p.id === 'zn-50' ||
          p.id === 'zn-98' ||
          /hoodie|sweatshirt/i.test(p.title);
        const isMarkedNew = p.isNewDrop === true && !p.id.startsWith('zn-');
        return isCustom || isHoodie || isMarkedNew;
      })
      .map((p: Product) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        price: p.price,
        originalPrice: p.originalPrice || Math.round(p.price * 1.4),
        badge: p.badge || 'NEW DROP',
        images: [
          p.images[0] || '/images/placeholder-product.svg',
          p.images[1] || p.images[0] || '/images/placeholder-product.svg',
        ] as [string, string],
        category: p.category,
      }));

    // 2. Curated baseline New Arrivals (updated with any edits made in admin)
    const updatedNewArrivals: ZeninProduct[] = NEW_ARRIVALS.map((na) => {
      const matchingCms = activeProducts.find((p: Product) => p.slug === na.slug || p.id === na.id);
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

    // 3. Put priority drops (the 3 hoodies & custom drops) first at the very beginning of New Arrivals!
    const combined: ZeninProduct[] = [...priorityDrops];
    updatedNewArrivals.forEach((na) => {
      if (!combined.some((item) => item.id === na.id || item.slug === na.slug)) {
        combined.push(na);
      }
    });

    // 4. If fewer than 8 items, backfill with remaining active products to maintain a balanced grid
    if (combined.length < 8) {
      activeProducts.forEach((p: Product) => {
        if (!combined.some((item) => item.id === p.id || item.slug === p.slug)) {
          combined.push({
            id: p.id,
            slug: p.slug,
            title: p.title,
            price: p.price,
            originalPrice: p.originalPrice || Math.round(p.price * 1.4),
            badge: p.badge || 'NEW DROP',
            images: [
              p.images[0] || '/images/placeholder-product.svg',
              p.images[1] || p.images[0] || '/images/placeholder-product.svg',
            ] as [string, string],
            category: p.category,
          });
        }
      });
    }

    // Keep all priority drops visible at the top, plus baseline items up to max(8, combined.length)
    const targetCount = Math.max(8, combined.length);
    return combined.slice(0, Math.min(24, targetCount));
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
