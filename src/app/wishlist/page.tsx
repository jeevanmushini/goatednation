'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { useWishlistStore } from '../../stores/wishlistStore';
import { useCartStore } from '../../stores/cartStore';
import { ZeninAnnouncementBar } from '../../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../../components/zenin/ZeninHeader';
import { ZeninFooter } from '../../components/zenin/ZeninFooter';
import { CartDrawer } from '../../components/layout/CartDrawer';
import { Product } from '../../types/product';

const emptySubscribe = () => () => {};

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist } = useWishlistStore();
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);

  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const handleMoveToBag = (product: Product) => {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        anime: product.anime,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images[0],
        size: product.sizes[0] || 'M',
        color: product.colors[0]?.name || 'Standard',
        quantity: 1,
      },
      true
    );
    removeFromWishlist(product.id);
    openDrawer();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-black antialiased selection:bg-[#FF4D00] selection:text-white">
      <ZeninAnnouncementBar />
      <ZeninHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 mb-8 border-b border-[#EAEAEA]">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#888888]">
              SAVED VAULT
            </span>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-black uppercase tracking-tight mt-1">
              WISHLIST ({mounted ? items.length : 0})
            </h1>
          </div>
          {mounted && items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="mt-4 sm:mt-0 text-xs font-mono text-[#888888] hover:text-[#8A1616] transition-colors uppercase tracking-wider"
            >
              Clear Entire Wishlist
            </button>
          )}
        </div>

        {!mounted || items.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#FAFAFA] border border-[#EAEAEA] flex items-center justify-center text-[#999999] mx-auto mb-4">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-base font-mono font-bold text-black mb-1 uppercase">YOUR WISHLIST IS EMPTY</h3>
            <p className="text-xs text-[#777777] mb-6 font-mono">
              Save your favorite oversized anime tees and limited drops to view them anytime.
            </p>
            <Link
              href="/collections"
              className="px-8 py-3 rounded bg-black hover:bg-[#222222] text-white font-mono font-bold text-xs uppercase tracking-widest transition-colors inline-block"
            >
              EXPLORE NEW ARRIVALS &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map((product) => (
              <div
                key={product.id}
                className="group flex flex-col justify-between"
              >
                <div className="relative w-full aspect-[3/4] overflow-hidden rounded-md bg-[#F4F4F4] mb-3">
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 text-[#888888] hover:text-[#8A1616] shadow-sm transition-colors z-10"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs font-mono font-medium text-black uppercase tracking-tight line-clamp-1">
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

                  <button
                    onClick={() => handleMoveToBag(product)}
                    className="w-full mt-2 py-2 rounded bg-black hover:bg-[#222222] text-white font-mono font-bold text-[11px] uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Move to Bag</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ZeninFooter />
      <CartDrawer />
    </div>
  );
}
