'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Product, ProductSize } from '../../types/product';
import { useCartStore } from '../../stores/cartStore';
import { useWishlistStore } from '../../stores/wishlistStore';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const { isInWishlist, toggleWishlist } = useWishlistStore();

  const isSaved = isInWishlist(product.id);

  const handleQuickAdd = (size: ProductSize, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);

    addItem(
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        anime: product.anime,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images[0],
        size,
        color: product.colors[0]?.name || 'Standard',
        quantity: 1,
      },
      true
    );
    openDrawer();

    setTimeout(() => setIsAdding(false), 500);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const discountPercent =
    product.discountPercent ||
    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <div
      className="group flex flex-col justify-between"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image Container with Dual Image Swap (Zenin Style) */}
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-md bg-[#F4F4F4] mb-3">
          {/* Main Primary Image */}
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover object-center transition-all duration-500 ease-out ${
              isHovered && product.images[1] ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
            }`}
          />

          {/* Secondary Hover Image (if present) */}
          {product.images[1] && (
            <Image
              src={product.images[1]}
              alt={`${product.title} alternate view`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover object-center transition-all duration-500 ease-out absolute inset-0 ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            />
          )}

          {/* Bottom-left Crimson Discount Pill Badge */}
          {discountPercent > 0 && (
            <div className="absolute bottom-2.5 left-2.5 z-10">
              <span className="bg-[#8A1616] text-white text-[10px] font-mono px-2 py-0.5 rounded-sm tracking-wider uppercase font-semibold shadow-sm">
                SAVE {discountPercent}%
              </span>
            </div>
          )}

          {/* Top-right Minimalist Wishlist Button */}
          <button
            onClick={handleWishlistClick}
            aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-sm transition-all z-10 ${
              isSaved
                ? 'bg-[#8A1616] text-white'
                : 'bg-white/80 hover:bg-white text-black/60 hover:text-black opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          {/* Quick-Add Size Bar (Slides up on Hover) */}
          <div className="absolute inset-x-2 bottom-2 z-20 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto">
            <div className="p-1.5 rounded bg-white/95 backdrop-blur-md shadow-lg border border-[#EAEAEA] flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase text-[#777777] px-1 font-semibold">
                Size
              </span>
              <div className="flex items-center space-x-1">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={(e) => handleQuickAdd(size, e)}
                    disabled={isAdding}
                    className="px-2 py-0.5 text-center rounded bg-[#F0F0F0] hover:bg-black hover:text-white text-black text-[10px] font-mono font-bold transition-colors cursor-pointer"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Information Typography */}
        <div className="space-y-1">
          <h3 className="text-xs font-mono font-medium text-black uppercase tracking-tight line-clamp-1 group-hover:underline underline-offset-2">
            {product.title}
          </h3>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-[#888888] line-through text-[11px]">
              Rs. {product.originalPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-black font-semibold">
              Rs. {product.price.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};
