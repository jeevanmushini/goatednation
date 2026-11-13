'use client';

import React, { useState, use, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Star,
  ShoppingBag,
  Ruler,
  Share2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  Sparkles,
  MoveHorizontal,
} from 'lucide-react';

import { PRODUCTS } from '../../../data/products';
import { useCmsStore } from '../../../lib/cms/cmsStore';
import { ProductSize } from '../../../types/product';
import { useCartStore } from '../../../stores/cartStore';
import { useWishlistStore } from '../../../stores/wishlistStore';
import { ZeninAnnouncementBar } from '../../../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../../../components/zenin/ZeninHeader';
import { ZeninFooter } from '../../../components/zenin/ZeninFooter';
import { CartDrawer } from '../../../components/layout/CartDrawer';
import { CheckoutModal } from '../../../components/layout/CheckoutModal';
import { SizeGuideModal } from '../../../components/product/SizeGuideModal';
import { PincodeChecker } from '../../../components/product/PincodeChecker';
import { ProductCard } from '../../../components/product/ProductCard';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const cmsProducts = useCmsStore((state) => state.products);
  const product = cmsProducts.find((p) => p.slug === slug) || PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [selectedSize, setSelectedSize] = useState<ProductSize>(product.sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || 'Standard');
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isPointerDown = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalDrag = useRef(false);
  const isVerticalScroll = useRef(false);

  const totalImages = product.images.length;

  const slideNext = useCallback(() => {
    setSlideDirection(1);
    setSelectedImageIndex((prev) => (prev + 1) % totalImages);
  }, [totalImages]);

  const slidePrev = useCallback(() => {
    setSlideDirection(-1);
    setSelectedImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  }, [totalImages]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDown.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    isHorizontalDrag.current = false;
    isVerticalScroll.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown.current || isVerticalScroll.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!isHorizontalDrag.current && !isVerticalScroll.current) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 7) {
        isVerticalScroll.current = true;
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 7) {
        isHorizontalDrag.current = true;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;

    if (isHorizontalDrag.current) {
      const dx = e.clientX - startX.current;
      if (dx < -30) {
        slideNext();
      } else if (dx > 30) {
        slidePrev();
      }
    }
    isHorizontalDrag.current = false;
    isVerticalScroll.current = false;
  };

  const handlePointerCancel = () => {
    isPointerDown.current = false;
    isHorizontalDrag.current = false;
    isVerticalScroll.current = false;
  };

  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const isSaved = isInWishlist(product.id);

  const handleAddToCart = () => {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        anime: product.anime,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images[0],
        size: selectedSize,
        color: selectedColor,
        quantity,
      },
      true
    );
    openDrawer();
  };

  const handleBuyNow = () => {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        anime: product.anime,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images[0],
        size: selectedSize,
        color: selectedColor,
        quantity,
      },
      false
    );
    setIsCheckoutOpen(true);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const allProducts = cmsProducts.length > 0 ? cmsProducts : PRODUCTS;
  const relatedProducts = allProducts.filter(
    (p) => p.id !== product.id && (p.category === product.category || p.anime === product.anime)
  ).slice(0, 4);

  const discountPercent =
    product.discountPercent ||
    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-black antialiased selection:bg-[#FF4D00] selection:text-white">
      <ZeninAnnouncementBar />
      <ZeninHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Minimalist Breadcrumb */}
        <nav className="flex items-center space-x-2 text-[11px] font-mono text-[#888888] mb-8 overflow-x-auto whitespace-nowrap uppercase tracking-widest">
          <Link href="/" className="hover:text-black transition-colors">
            HOME
          </Link>
          <ChevronRight className="w-3 h-3 text-[#CCCCCC]" />
          <Link href="/collections" className="hover:text-black transition-colors">
            COLLECTIONS
          </Link>
          <ChevronRight className="w-3 h-3 text-[#CCCCCC]" />
          <Link
            href={`/collections/${product.category}`}
            className="hover:text-black transition-colors"
          >
            {product.category}
          </Link>
          <ChevronRight className="w-3 h-3 text-[#CCCCCC]" />
          <span className="text-black font-semibold truncate max-w-[200px] sm:max-w-none">
            {product.title}
          </span>
        </nav>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-14">
          {/* Left Column: Image Gallery (7 cols) */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible shrink-0">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded overflow-hidden bg-[#F4F4F4] border transition-all ${
                    selectedImageIndex === idx
                      ? 'border-black shadow-md'
                      : 'border-[#EAEAEA] hover:border-[#999999]'
                  }`}
                >
                  <Image src={img} alt={`${product.title} view ${idx + 1}`} fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>

            {/* Main Stage Image with Horizontal Slide Animation & Arrow Navigation */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              style={{ touchAction: 'pan-y' }}
              className="relative flex-1 aspect-[3/4] rounded-lg overflow-hidden bg-[#F4F4F4] border border-[#EAEAEA] select-none group cursor-grab active:cursor-grabbing"
            >
              <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
                <motion.div
                  key={selectedImageIndex}
                  custom={slideDirection}
                  initial={{ x: slideDirection > 0 ? '100%' : '-100%', opacity: 0.6 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: slideDirection > 0 ? '-100%' : '100%', opacity: 0.6 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                  className="absolute inset-0 w-full h-full"
                >
                  <Image
                    src={product.images[selectedImageIndex] || product.images[0]}
                    alt={`${product.title} slide ${selectedImageIndex + 1}`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover pointer-events-none group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Prev / Next Slide Arrow Buttons */}
              {totalImages > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      slidePrev();
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-black text-black hover:text-white border border-[#D5D5D5] flex items-center justify-center transition-all duration-200 shadow-md hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Previous Image"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      slideNext();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-black text-black hover:text-white border border-[#D5D5D5] flex items-center justify-center transition-all duration-200 shadow-md hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Next Image"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </>
              )}

              {/* Mobile Slide Gesture Hint & Counter Badge */}
              <div className="absolute top-4 left-4 z-20 flex items-center space-x-2">
                <span className="bg-black/75 backdrop-blur-sm text-white text-[10px] font-mono px-2.5 py-0.5 rounded-full tracking-wider">
                  {selectedImageIndex + 1} / {totalImages}
                </span>
                <span className="hidden sm:inline-flex items-center space-x-1 bg-white/80 backdrop-blur-sm text-black text-[9px] font-mono px-2 py-0.5 rounded-full">
                  <MoveHorizontal className="w-2.5 h-2.5" />
                  <span>SWIPE</span>
                </span>
              </div>

              {/* Crimson discount badge */}
              {discountPercent > 0 && (
                <div className="absolute bottom-4 left-4 z-10">
                  <span className="bg-[#8A1616] text-white text-xs font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-sm shadow-md">
                    SAVE {discountPercent}%
                  </span>
                </div>
              )}

              {/* Wishlist and Share */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
                    isSaved
                      ? 'bg-[#8A1616] text-white'
                      : 'bg-white/90 text-black/70 hover:text-black hover:bg-white'
                  }`}
                  aria-label="Toggle Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-full bg-white/90 text-black/70 hover:text-black hover:bg-white backdrop-blur-md transition-all shadow-sm"
                  aria-label="Share Link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {copiedLink && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black text-white rounded-full text-xs font-mono shadow-xl z-20">
                  Link copied to clipboard!
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Buying Options & Specifications (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div>
              {/* Anime Franchise & Rating */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#FF4D00]">
                  {product.anime}
                </span>
                <div className="flex items-center text-xs font-mono text-black">
                  <Star className="w-3.5 h-3.5 fill-black mr-1" />
                  <span className="font-bold">{product.rating}</span>
                  <span className="text-[#888888] ml-1">({product.reviewCount})</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-mono font-bold text-black tracking-tight uppercase mt-2">
                {product.title}
              </h1>

              {/* Price Block */}
              <div className="mt-4 p-4 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] flex items-baseline space-x-3 font-mono">
                <span className="text-2xl sm:text-3xl font-bold text-black">
                  Rs. {product.price.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-[#888888] line-through">
                  Rs. {product.originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] font-bold text-[#8A1616] px-2 py-0.5 rounded bg-[#8A1616]/10">
                  {discountPercent}% OFF
                </span>
                <span className="text-[10px] text-[#777777] ml-auto">Inclusive of all taxes</span>
              </div>

              {/* Stock Urgency Indicator */}
              {product.stockCount <= 10 && (
                <div className="mt-3 flex items-center text-xs text-[#8A1616] space-x-1.5 font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Selling Fast &bull; Only <strong className="text-black font-bold">{product.stockCount} pieces</strong> left in stock
                  </span>
                </div>
              )}

              {/* Description */}
              <p className="mt-4 text-xs sm:text-sm text-[#555555] leading-relaxed font-sans">
                {product.description}
              </p>

              {/* Color Selection */}
              {product.colors.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-[#888888]">COLOR:</span>
                    <span className="text-black font-bold">{selectedColor}</span>
                  </div>
                  <div className="flex space-x-2">
                    {product.colors.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(c.name)}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded border text-xs font-mono transition-all ${
                          selectedColor === c.name
                            ? 'bg-black text-white border-black font-bold'
                            : 'bg-white border-[#D5D5D5] text-[#555555] hover:text-black hover:border-black'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: c.hex }} />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-[#888888]">SELECT SIZE (OVERSIZED FIT):</span>
                  <button
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-black hover:underline flex items-center font-bold"
                  >
                    <Ruler className="w-3.5 h-3.5 mr-1" /> Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 rounded text-center font-mono text-xs font-bold transition-all border ${
                        selectedSize === size
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-[#D5D5D5] hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Stepper & Add to Bag CTAs */}
              <div className="mt-6 space-y-3">
                <div className="flex space-x-3">
                  <div className="flex items-center space-x-3 bg-white border border-[#D5D5D5] rounded px-3 py-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1 text-[#666666] hover:text-black transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs font-bold text-black px-1">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1 text-[#666666] hover:text-black transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="flex-1 py-3.5 rounded bg-black hover:bg-[#222222] text-white font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>ADD TO BAG</span>
                  </button>
                </div>

                <button
                  onClick={handleBuyNow}
                  className="w-full py-3.5 rounded bg-[#FF4D00] hover:bg-[#e04400] text-white font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md"
                >
                  <span>BUY NOW &bull; EXPRESS CHECKOUT</span>
                </button>
              </div>

              {/* Shiprocket Delivery Checker */}
              <div className="mt-8">
                <PincodeChecker />
              </div>

              {/* Garment Specifications List */}
              <div className="mt-8 p-5 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] space-y-3">
                <h4 className="text-xs font-mono font-bold text-black uppercase tracking-wider">
                  GARMENT SPECIFICATIONS
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[#888888] block text-[10px]">WEIGHT / GSM</span>
                    <span className="font-semibold text-black">{product.details.gsm}</span>
                  </div>
                  <div>
                    <span className="text-[#888888] block text-[10px]">FABRIC COMPOSITION</span>
                    <span className="font-semibold text-black">{product.details.fabric}</span>
                  </div>
                  <div>
                    <span className="text-[#888888] block text-[10px]">FIT SILHOUETTE</span>
                    <span className="font-semibold text-black">{product.details.fit}</span>
                  </div>
                  <div>
                    <span className="text-[#888888] block text-[10px]">PRINT TECHNIQUE</span>
                    <span className="font-semibold text-black">{product.details.printType}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Drops */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-[#EAEAEA]">
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-mono font-bold text-black uppercase tracking-tight">
                YOU MAY ALSO LIKE
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <ZeninFooter />
      <CartDrawer />
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
    </div>
  );
}
