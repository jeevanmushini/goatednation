'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cmsStore';

interface CardStackItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
}

const STACK_ITEMS: CardStackItem[] = [
  {
    id: 's-1',
    category: 'BACKPACK',
    title: 'ZORO TACTICAL // CROSSBODY',
    subtitle: 'MODULAR MOLLE SYSTEM • 1000D CORDURA',
    image: 'https://zenin.co.in/cdn/shop/files/backpackcollection.jpg',
    link: '/collections/accessories',
  },
  {
    id: 's-2',
    category: 'JACKETS',
    title: 'SUKUNA DOMAIN // JACQUARD JACKET',
    subtitle: 'METALLIC THREAD EMBROIDERY • BOX FIT',
    image: 'https://zenin.co.in/cdn/shop/files/W2_6048f97c-7344-4633-be03-4078572c4ab3.jpg',
    link: '/collections/jackets',
  },
  {
    id: 's-3',
    category: 'HOODIES',
    title: 'BERSERK ECLIPSE // 420 GSM HOODIE',
    subtitle: 'DOUBLE-LAYER HOOD • PUFF SCREEN PRINT',
    image: 'https://zenin.co.in/cdn/shop/files/W2_c73c0e9a-68a9-4ab7-ad83-2780a0d86305.jpg',
    link: '/collections/hoodies',
  },
  {
    id: 's-4',
    category: 'VEST',
    title: 'TACTICAL UTILITY // COMBAT VEST',
    subtitle: 'MULTI-POCKET HARNESS • REFLECTIVE WEBBING',
    image: 'https://zenin.co.in/cdn/shop/files/w2-16.jpg',
    link: '/collections',
  },
];

export const ZeninCategory3DStack: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);

  const isPointerDown = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalDrag = useRef(false);
  const isVerticalScroll = useRef(false);
  const hasMoved = useRef(false);

  const cmsStackCards = useCmsStore((state) => state.stackCards);
  const items = cmsStackCards && cmsStackCards.length > 0 ? cmsStackCards : STACK_ITEMS;
  const safeActiveIndex = Math.min(activeIndex, items.length - 1);
  const current = items[safeActiveIndex] || items[0] || STACK_ITEMS[0];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // Touch & Pointer gesture handling with vertical page scroll preservation
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
      const threshold = isMobile ? 30 : 45;
      if (dragOffsetPx < -threshold) {
        handleNext();
      } else if (dragOffsetPx > threshold) {
        handlePrev();
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

  return (
    <section className="bg-[#FFFFFF] py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-[#EAEAEA] overflow-hidden select-none">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        {/* Top Centered Category Title & Swipe Hint */}
        <div className="text-center mb-6 sm:mb-8 flex flex-col items-center space-y-1">
          <span className="text-xs font-mono tracking-[0.25em] text-[#666666] uppercase">
            {current.category}
          </span>
          <div className="flex items-center space-x-1.5 text-[9px] font-mono tracking-widest text-[#AAAAAA] uppercase">
            <MoveHorizontal className="w-3 h-3 text-[#999999]" />
            <span>SWIPE TO BROWSE CATEGORIES</span>
          </div>
        </div>

        {/* 3D Stack Stage */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{ touchAction: 'pan-y' }}
          className={`relative w-full max-w-4xl h-[440px] sm:h-[560px] flex items-center justify-center [perspective:1200px] ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Previous / Next Arrow buttons */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-1 sm:left-6 md:left-12 z-40 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/95 hover:bg-black text-black hover:text-white border border-[#D0D0D0] flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
            aria-label="Previous Category"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-1 sm:right-6 md:right-12 z-40 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/95 hover:bg-black text-black hover:text-white border border-[#D0D0D0] flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
            aria-label="Next Category"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Cards Stack */}
          <div className="relative w-[260px] sm:w-[340px] md:w-[380px] h-[390px] sm:h-[500px] [transform-style:preserve-3d]">
            {items.map((item, index) => {
              const offset = index - safeActiveIndex;
              let normalizedOffset = offset;
              if (offset > items.length / 2) normalizedOffset -= items.length;
              if (offset < -items.length / 2) normalizedOffset += items.length;

              const isCenter = normalizedOffset === 0;
              const isVisible = Math.abs(normalizedOffset) <= (isMobile ? 1 : 2);

              if (!isVisible) return null;

              const dynamicDragShift = isMobile ? (dragOffsetPx / 300) * 40 : (dragOffsetPx / 600) * 50;
              const xBase = isMobile ? normalizedOffset * 48 : normalizedOffset * 75;
              const x = xBase + dynamicDragShift;
              const z = -Math.abs(normalizedOffset) * (isMobile ? 70 : 120);
              const rotateY = normalizedOffset * (isMobile ? -8 : -12);
              const scale = isCenter ? 1 : isMobile ? 0.82 : 0.88;
              const opacity = isCenter ? 1 : isMobile ? 0.5 : 0.6;
              const zIndex = 20 - Math.abs(normalizedOffset);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (hasMoved.current) return;
                    setActiveIndex(index);
                  }}
                  className="absolute inset-0 rounded-2xl overflow-hidden cursor-pointer bg-[#0A0A0A] border border-[#222222] shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out"
                  style={{
                    zIndex,
                    opacity,
                    transform: `translate3d(${x}px, 0px, ${z}px) rotateY(${rotateY}deg) scale(${scale})`,
                  }}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 300px, 380px"
                      className="object-cover object-center pointer-events-none"
                      priority={isCenter}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                    {/* Card Internal Labels */}
                    <div className="absolute bottom-5 sm:bottom-6 left-5 sm:left-6 right-5 sm:right-6 text-white text-left pointer-events-none">
                      <span className="text-[10px] font-mono tracking-widest text-[#FF4D00] uppercase font-bold">
                        {item.category}
                      </span>
                      <h3 className="text-xs sm:text-base font-mono font-bold uppercase tracking-wider mt-0.5 line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-[9px] sm:text-[10px] text-[#A0A0A0] font-mono mt-1 line-clamp-1">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center space-x-2 mt-4 sm:mt-6">
          {items.map((it, idx) => (
            <button
              key={it.id}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to ${it.category}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                safeActiveIndex === idx
                  ? 'w-6 h-1.5 bg-black'
                  : 'w-1.5 h-1.5 bg-[#D5D5D5] hover:bg-[#888888]'
              }`}
            />
          ))}
        </div>

        {/* Bottom Pill CTA: BACKPACK  SHOP NOW */}
        <div className="mt-6 flex items-center justify-center">
          <Link
            href={current.link}
            className="inline-flex items-center space-x-3 px-6 py-2.5 rounded-full border border-black bg-white hover:bg-black text-black hover:text-white font-mono text-xs uppercase tracking-widest transition-all duration-200 shadow-sm"
          >
            <span className="font-bold">{current.category}</span>
            <span className="text-[#888888]">&bull;</span>
            <span>SHOP NOW &rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
};
