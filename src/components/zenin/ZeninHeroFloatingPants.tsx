'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MoveHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cmsStore';

interface BottomHeroItem {
  id: string;
  name: string;
  image: string;
  link: string;
}

const DEFAULT_HERO_PANTS: BottomHeroItem[] = [
  {
    id: 'p-1',
    name: 'STEALTH SHADOW / COMBAT PANTS',
    image: 'https://zenin.co.in/cdn/shop/files/pant_7.png',
    link: '/collections/trackpant',
  },
  {
    id: 'p-2',
    name: 'AKIRA REDLINE / PIPED SWEATPANTS',
    image: 'https://zenin.co.in/cdn/shop/files/pant_8.png',
    link: '/collections/trackpant',
  },
  {
    id: 'p-3',
    name: 'HEAVYWEIGHT HEATHER GREY / BARREL',
    image: 'https://zenin.co.in/cdn/shop/files/pant2.png',
    link: '/collections/trackpant',
  },
  {
    id: 'p-4',
    name: 'CHERRY BLOSSOM / BARREL SWEATPANTS',
    image: 'https://zenin.co.in/cdn/shop/files/pant1s.png',
    link: '/products/cherry-blossom-barrel-sweatpants',
  },
  {
    id: 'p-5',
    name: 'KANJI LOVE / CREAM SWEATPANTS',
    image: 'https://zenin.co.in/cdn/shop/files/pant3ss.png',
    link: '/products/sand-king-barrel-sweatpants',
  },
  {
    id: 'p-6',
    name: 'CYBERPUNK PURPLE / TECH SWEAT',
    image: 'https://zenin.co.in/cdn/shop/files/pant5.png',
    link: '/products/purple-curse-barrel-sweatpant',
  },
  {
    id: 'p-7',
    name: 'MECHA MONOCHROME / CONTRAST CARGO',
    image: 'https://zenin.co.in/cdn/shop/files/pant6.png',
    link: '/collections/trackpant',
  },
];

// Base position parameters based on relative offset from active center item (-3 to +3)
const DESKTOP_POSITIONS: Record<number, { x: number; y: number; scale: number; rotate: number; zIndex: number; opacity: number }> = {
  [-3]: { x: -42, y: 25, scale: 0.82, rotate: -12, zIndex: 10, opacity: 0.55 },
  [-2]: { x: -28, y: 12, scale: 0.88, rotate: -8, zIndex: 15, opacity: 0.8 },
  [-1]: { x: -15, y: 4, scale: 0.94, rotate: -4, zIndex: 22, opacity: 0.95 },
  [0]: { x: 0, y: 0, scale: 1.08, rotate: 0, zIndex: 30, opacity: 1.0 },
  [1]: { x: 15, y: 4, scale: 0.94, rotate: 4, zIndex: 22, opacity: 0.95 },
  [2]: { x: 28, y: 12, scale: 0.88, rotate: 8, zIndex: 15, opacity: 0.8 },
  [3]: { x: 42, y: 25, scale: 0.82, rotate: 12, zIndex: 10, opacity: 0.55 },
};

const MOBILE_POSITIONS: Record<number, { x: number; y: number; scale: number; rotate: number; zIndex: number; opacity: number }> = {
  [-1]: { x: -56, y: 14, scale: 0.74, rotate: -8, zIndex: 16, opacity: 0.45 },
  [0]: { x: 0, y: 0, scale: 1.14, rotate: 0, zIndex: 30, opacity: 1.0 },
  [1]: { x: 56, y: 14, scale: 0.74, rotate: 8, zIndex: 16, opacity: 0.45 },
};

export const ZeninHeroFloatingPants: React.FC = () => {
  const cmsBottoms = useCmsStore((state) => state.heroBottoms);
  const [activeIndex, setActiveIndex] = useState(3); // Start with Cherry Blossom in center
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isPointerDown = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalDrag = useRef(false);
  const isVerticalScroll = useRef(false);
  const hasMoved = useRef(false);
  const lastWheelTime = useRef(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // If user updated bottoms from admin, map them
  const items: BottomHeroItem[] = useMemo(() => {
    if (!cmsBottoms || cmsBottoms.length === 0) return DEFAULT_HERO_PANTS;
    return cmsBottoms.map((cmsItem, idx) => {
      const def = DEFAULT_HERO_PANTS[idx] || DEFAULT_HERO_PANTS[0];
      return {
        id: cmsItem.id || `pant-${idx}`,
        name: cmsItem.name || def.name,
        image: cmsItem.image || def.image,
        link: def.link || '/collections/trackpant',
      };
    });
  }, [cmsBottoms]);

  const total = items.length;

  const slideNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const slidePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Pointer drag gestures (mouse click-and-drag + touch drag with directional lock)
  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDown.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    isHorizontalDrag.current = false;
    isVerticalScroll.current = false;
    hasMoved.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown.current || isVerticalScroll.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    // Detect gesture direction to avoid fighting native vertical page scroll
    if (!isHorizontalDrag.current && !isVerticalScroll.current) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 7) {
        isVerticalScroll.current = true;
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 7) {
        isHorizontalDrag.current = true;
        setIsDragging(true);
      }
    }

    if (isHorizontalDrag.current) {
      if (Math.abs(dx) > 10) {
        hasMoved.current = true;
      }
      setDragOffsetPx(dx);
    }
  };

  const handlePointerUp = () => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    setIsDragging(false);

    if (isHorizontalDrag.current) {
      const threshold = isMobile ? 32 : 45;
      if (dragOffsetPx < -threshold) {
        slideNext();
      } else if (dragOffsetPx > threshold) {
        slidePrev();
      }
    }
    setDragOffsetPx(0);
    isHorizontalDrag.current = false;
    isVerticalScroll.current = false;
  };

  const handlePointerCancel = () => {
    isPointerDown.current = false;
    setIsDragging(false);
    setDragOffsetPx(0);
    isHorizontalDrag.current = false;
    isVerticalScroll.current = false;
  };

  // Trackpad / Horizontal Mousewheel Swipe gesture
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 20) {
      const now = Date.now();
      if (now - lastWheelTime.current > 320) {
        if (e.deltaX > 20) {
          slideNext();
        } else if (e.deltaX < -20) {
          slidePrev();
        }
        lastWheelTime.current = now;
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') slideNext();
      if (e.key === 'ArrowLeft') slidePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slideNext, slidePrev]);

  // Global mouse up safety listener
  useEffect(() => {
    const onGlobalUp = () => {
      if (isPointerDown.current) {
        isPointerDown.current = false;
        setIsDragging(false);
        setDragOffsetPx(0);
        isHorizontalDrag.current = false;
        isVerticalScroll.current = false;
      }
    };
    window.addEventListener('pointerup', onGlobalUp);
    return () => window.removeEventListener('pointerup', onGlobalUp);
  }, []);

  const safeActiveIndex = Math.min(activeIndex, Math.max(0, items.length - 1));
  const activeItem = items[safeActiveIndex] || items[0] || DEFAULT_HERO_PANTS[0];

  // Convert pixel drag offset to a dynamic percentage shift across the arc (normalized to viewport standard)
  const dragPercentShift = isMobile
    ? (dragOffsetPx / 360) * 45
    : (dragOffsetPx / 1000) * 85;

  return (
    <section
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onWheel={handleWheel}
      style={{ touchAction: 'pan-y' }}
      className={`relative w-full bg-[#FFFFFF] overflow-hidden select-none border-b border-[#EAEAEA] min-h-[500px] sm:min-h-[620px] lg:min-h-[700px] flex flex-col justify-between py-6 transition-colors ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* 1. Centered Clean Top Label & Swipe Gesture Hint */}
      <div className="relative z-20 text-center pt-2 sm:pt-4 flex flex-col items-center space-y-1">
        <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.35em] text-[#777777] uppercase select-none">
          BOTTOMS
        </span>
        <div className="flex items-center space-x-1.5 text-[9px] font-mono tracking-widest text-[#AAAAAA] uppercase">
          <MoveHorizontal className="w-3 h-3 text-[#999999]" />
          <span>SLIDE HORIZONTALLY TO EXPLORE</span>
        </div>
      </div>

      {/* 2. Panoramic Arc of Sliding Floating Pants Stage */}
      <div className="relative z-20 w-full max-w-7xl mx-auto h-[360px] sm:h-[460px] lg:h-[520px] flex items-center justify-center">
        {/* Left & Right Slide Arrow Buttons */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            slidePrev();
          }}
          aria-label="Previous bottom"
          className="absolute left-2 sm:left-6 lg:left-12 top-1/2 -translate-y-1/2 z-35 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/95 hover:bg-black text-black hover:text-white border border-[#D5D5D5] flex items-center justify-center transition-all duration-200 shadow-md hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            slideNext();
          }}
          aria-label="Next bottom"
          className="absolute right-2 sm:right-6 lg:right-12 top-1/2 -translate-y-1/2 z-35 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/95 hover:bg-black text-black hover:text-white border border-[#D5D5D5] flex items-center justify-center transition-all duration-200 shadow-md hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="relative w-full h-full flex items-center justify-center">
          {items.map((item, idx) => {
            // Relative index from active center
            let rel = (idx - activeIndex) % total;
            if (rel > Math.floor(total / 2)) rel -= total;
            if (rel < -Math.floor(total / 2)) rel += total;

            const basePos = isMobile
              ? (MOBILE_POSITIONS[rel] ||
                  (rel > 0
                    ? { x: 120, y: 25, scale: 0.5, rotate: 12, zIndex: 2, opacity: 0 }
                    : { x: -120, y: 25, scale: 0.5, rotate: -12, zIndex: 2, opacity: 0 }))
              : (DESKTOP_POSITIONS[rel] ||
                  (rel > 0
                    ? { x: 55, y: 30, scale: 0.7, rotate: 15, zIndex: 5, opacity: 0 }
                    : { x: -55, y: 30, scale: 0.7, rotate: -15, zIndex: 5, opacity: 0 }));
            const isCenter = rel === 0;

            // Fluid real-time drag calculation
            const dynamicX = basePos.x + dragPercentShift;
            const dynamicRotate = basePos.rotate + dragPercentShift * 0.25;

            return (
              <motion.div
                key={item.id}
                layout
                initial={false}
                animate={{
                  left: `calc(50% + ${dynamicX}%)`,
                  top: `calc(48% + ${basePos.y}px)`,
                  scale: basePos.scale,
                  rotate: dynamicRotate,
                  zIndex: basePos.zIndex,
                  opacity: basePos.opacity,
                }}
                transition={{
                  type: 'spring',
                  stiffness: isDragging ? 400 : 260,
                  damping: isDragging ? 35 : 26,
                  mass: 0.7,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                onClick={() => {
                  if (hasMoved.current) return;
                  if (!isCenter) {
                    setActiveIndex(idx);
                  }
                }}
              >
                <Link
                  href={item.link}
                  className="block group relative"
                  onClick={(e) => {
                    if (hasMoved.current) {
                      e.preventDefault();
                      return;
                    }
                    if (!isCenter) {
                      e.preventDefault();
                      setActiveIndex(idx);
                    }
                  }}
                  draggable={false}
                >
                  {/* Subtle float drifting animation */}
                  <motion.div
                    className="relative w-[140px] sm:w-[200px] md:w-[240px] lg:w-[280px] h-[260px] sm:h-[360px] md:h-[420px] lg:h-[480px]"
                    animate={{
                      x: [0, 6, 3, 8, 0],
                      y: [0, -10, -5, -12, 0],
                      rotate: [0, 0.5, -0.3, 0.4, 0],
                    }}
                    transition={{
                      duration: isCenter ? 4.5 : 5.2 + (Math.abs(rel) % 3) * 0.4,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                      delay: Math.abs(rel) * 0.25,
                    }}
                    whileHover={{
                      scale: isCenter ? 1.05 : 1.02,
                      y: -12,
                      transition: { duration: 0.25, ease: 'easeOut' },
                    }}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 140px, (max-width: 1024px) 240px, 280px"
                        className="object-contain pointer-events-none transition-all duration-300 [filter:drop-shadow(0_6px_8px_rgba(0,0,0,0.18))_drop-shadow(0_18px_24px_rgba(0,0,0,0.16))_drop-shadow(0_32px_42px_rgba(0,0,0,0.10))] group-hover:[filter:drop-shadow(0_10px_12px_rgba(0,0,0,0.22))_drop-shadow(0_26px_34px_rgba(0,0,0,0.18))_drop-shadow(0_45px_55px_rgba(0,0,0,0.12))]"
                        priority={isCenter}
                        draggable={false}
                        unoptimized={item.image.startsWith('data:') || item.image.startsWith('/uploads/')}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-black/5 rounded-2xl border border-dashed border-[#CCCCCC] text-[#888888] font-mono text-xs">
                        <span>Drop Image Here</span>
                      </div>
                    )}
                  </motion.div>

                  {/* Dynamic Studio Ground Shadow Ellipse anchored beneath each pant */}
                  <motion.div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[70%] h-4 rounded-[100%] pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(ellipse at center, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0) 80%)',
                      filter: 'blur(3.5px)',
                    }}
                    animate={{
                      scaleX: [1, 0.88, 0.94, 0.86, 1],
                      opacity: [0.75, 0.5, 0.65, 0.45, 0.75],
                    }}
                    transition={{
                      duration: isCenter ? 4.5 : 5.2 + (Math.abs(rel) % 3) * 0.4,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                      delay: Math.abs(rel) * 0.25,
                    }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 3. Active Centered Pant Title & Action Link */}
      <div className="relative z-30 pt-2 pb-2 text-center pointer-events-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col items-center space-y-1.5"
          >
            <h3 className="text-xs sm:text-sm font-mono uppercase tracking-[0.2em] text-black font-semibold">
              {activeItem.name}
            </h3>

            <Link
              href={activeItem.link}
              className="inline-flex items-center space-x-1.5 text-[10px] font-mono tracking-widest text-[#777777] hover:text-black uppercase transition-colors"
            >
              <span>VIEW PRODUCT</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center space-x-2 pt-4">
          {items.map((it, idx) => (
            <button
              key={it.id}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Slide to ${it.name}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                activeIndex === idx
                  ? 'w-6 h-1.5 bg-black'
                  : 'w-1.5 h-1.5 bg-[#D5D5D5] hover:bg-[#888888]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 4. Minimalist bottom archive link */}
      <div className="relative z-20 pb-1 text-center">
        <Link
          href="/collections/trackpant"
          className="inline-block text-[9px] sm:text-[10px] font-mono tracking-[0.25em] text-[#999999] hover:text-black uppercase transition-colors"
        >
          &bull; VIEW ALL BOTTOMS ARCHIVE &bull;
        </Link>
      </div>
    </section>
  );
};
