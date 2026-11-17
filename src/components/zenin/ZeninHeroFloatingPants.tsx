'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MoveHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cmsStore';
import { INITIAL_HERO_BOTTOMS } from '../../lib/cms/initialCmsData';
import { CmsHeroBottomItem } from '../../types/cms';

interface BottomHeroItem {
  id: string;
  name: string;
  image: string;
  link: string;
}

interface ZeninHeroFloatingPantsProps {
  initialBottoms?: CmsHeroBottomItem[];
}

const isLegacyTrackpant = (img?: string) =>
  !img ||
  img.trim() === '' ||
  img.includes('pant1s.png') ||
  img.includes('pant2.png') ||
  img.includes('pant3ss.png') ||
  img.includes('pant5.png') ||
  img.includes('pant6.png') ||
  img.includes('pant_7.png') ||
  img.includes('pant_8.png');

const FALLBACK_HERO_BOTTOMS: BottomHeroItem[] = INITIAL_HERO_BOTTOMS.map((b, idx) => ({
  id: b.id || `b-${idx + 1}`,
  name: b.name,
  image: b.image,
  link: (b as { link?: string }).link || '/collections/hoodies',
}));

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

export const ZeninHeroFloatingPants: React.FC<ZeninHeroFloatingPantsProps> = ({ initialBottoms }) => {
  const cmsBottoms = useCmsStore((state) => state.heroBottoms);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Stable single source of truth: guarantees SSR HTML and hydrated DOM match on frame 1
  const items: BottomHeroItem[] = useMemo(() => {
    const rawList =
      (initialBottoms && initialBottoms.length > 0)
        ? initialBottoms
        : (cmsBottoms && cmsBottoms.length > 0)
        ? cmsBottoms
        : FALLBACK_HERO_BOTTOMS;

    return rawList.map((cmsItem, idx) => {
      const fb = FALLBACK_HERO_BOTTOMS[idx] || FALLBACK_HERO_BOTTOMS[0];
      const validImage = !isLegacyTrackpant(cmsItem.image) ? (cmsItem.image as string) : fb.image;
      return {
        id: cmsItem.id || fb.id || `b-${idx + 1}`,
        name: cmsItem.name || fb.name,
        image: validImage,
        link: (cmsItem as { link?: string }).link || fb.link || '/collections',
      };
    });
  }, [cmsBottoms, initialBottoms]);

  const total = items.length;

  // Center index: middle item
  const initialCenterIndex = useMemo(() => {
    return Math.floor(total / 2);
  }, [total]);

  const [activeIndex, setActiveIndex] = useState(initialCenterIndex);

  const isPointerDown = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalDrag = useRef(false);
  const isVerticalScroll = useRef(false);
  const hasMoved = useRef(false);
  const lastWheelTime = useRef(0);

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
      if (Math.abs(dx) > 8) {
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
      const threshold = 35;
      if (dragOffsetPx < -threshold) {
        slideNext();
      } else if (dragOffsetPx > threshold) {
        slidePrev();
      }
    }
    setDragOffsetPx(0);
    isHorizontalDrag.current = false;
    isVerticalScroll.current = false;
    // Debounce resetting hasMoved so link onClick handlers can cleanly prevent default navigation
    setTimeout(() => {
      hasMoved.current = false;
    }, 120);
  };

  const handlePointerCancel = () => {
    isPointerDown.current = false;
    setIsDragging(false);
    setDragOffsetPx(0);
    isHorizontalDrag.current = false;
    isVerticalScroll.current = false;
    setTimeout(() => {
      hasMoved.current = false;
    }, 120);
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
        setTimeout(() => {
          hasMoved.current = false;
        }, 120);
      }
    };
    window.addEventListener('pointerup', onGlobalUp);
    return () => window.removeEventListener('pointerup', onGlobalUp);
  }, []);

  const safeActiveIndex = Math.min(activeIndex, Math.max(0, items.length - 1));
  const activeItem = items[safeActiveIndex] || items[0] || FALLBACK_HERO_BOTTOMS[0];

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
          FEATURED SILHOUETTES // 3D LOOKBOOK
        </span>
        <div className="flex items-center space-x-1.5 text-[9px] font-mono tracking-widest text-[#AAAAAA] uppercase">
          <MoveHorizontal className="w-3 h-3 text-[#999999]" />
          <span>SLIDE HORIZONTALLY TO EXPLORE</span>
        </div>
      </div>

      {/* 2. Panoramic Arc of Sliding Floating Stage */}
      <div className="relative z-20 w-full max-w-7xl mx-auto h-[360px] sm:h-[460px] lg:h-[520px] flex items-center justify-center">
        {/* Left & Right Slide Arrow Buttons */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            slidePrev();
          }}
          aria-label="Previous silhouette"
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
          aria-label="Next silhouette"
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
              ? (MOBILE_POSITIONS[rel] || (rel > 0
                  ? { x: 120, y: 25, scale: 0.5, rotate: 12, zIndex: 2, opacity: 0 }
                  : { x: -120, y: 25, scale: 0.5, rotate: -12, zIndex: 2, opacity: 0 }))
              : (DESKTOP_POSITIONS[rel] || (rel > 0
                  ? { x: 55, y: 30, scale: 0.7, rotate: 15, zIndex: 5, opacity: 0 }
                  : { x: -55, y: 30, scale: 0.7, rotate: -15, zIndex: 5, opacity: 0 }));
            const isCenter = rel === 0;

            // Fluid real-time drag calculation
            const dynamicX = basePos.x + dragPercentShift;
            const dynamicRotate = basePos.rotate + dragPercentShift * 0.25;

            // CSS-based responsive visibility: Hide outer items on mobile phones directly in CSS without JS flip
            const isOuter = Math.abs(rel) > 1;

            return (
              <motion.div
                key={item.id}
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
                  stiffness: isDragging ? 450 : 280,
                  damping: isDragging ? 38 : 28,
                  mass: 0.6,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 ${
                  isOuter ? 'hidden md:block' : 'block'
                }`}
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
                  {/* Subtle float drifting animation (GPU transform, no conflict with hover) */}
                  <motion.div
                    className="relative w-[140px] sm:w-[200px] md:w-[240px] lg:w-[280px] h-[260px] sm:h-[360px] md:h-[420px] lg:h-[480px]"
                    animate={{
                      y: [0, -8, 0],
                      rotate: [0, 0.4, 0],
                    }}
                    transition={{
                      duration: isCenter ? 4.2 : 5.0 + (Math.abs(rel) % 3) * 0.4,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                      delay: Math.abs(rel) * 0.2,
                    }}
                  >
                    <div className="relative w-full h-full transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-2">
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
                          <span>{item.name}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Dynamic Studio Ground Shadow Ellipse anchored beneath each silhouette */}
                  <motion.div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[70%] h-4 rounded-[100%] pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(ellipse at center, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0) 80%)',
                      filter: 'blur(3.5px)',
                    }}
                    animate={{
                      scaleX: [1, 0.88, 1],
                      opacity: [0.75, 0.5, 0.75],
                    }}
                    transition={{
                      duration: isCenter ? 4.2 : 5.0 + (Math.abs(rel) % 3) * 0.4,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                      delay: Math.abs(rel) * 0.2,
                    }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 3. Active Centered Silhouette Title & Action Link */}
      <div className="relative z-30 pt-2 pb-2 text-center pointer-events-auto">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
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

      {/* 4. Minimalist collection archive link */}
      <div className="relative z-20 pb-1 text-center">
        <Link
          href="/collections"
          className="inline-block text-[9px] sm:text-[10px] font-mono tracking-[0.25em] text-[#999999] hover:text-black uppercase transition-colors"
        >
          &bull; EXPLORE FULL STREETWEAR COLLECTION &bull;
        </Link>
      </div>
    </section>
  );
};
