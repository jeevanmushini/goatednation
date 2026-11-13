'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const cmsStackCards = useCmsStore((state) => state.stackCards);
  const items = cmsStackCards && cmsStackCards.length > 0 ? cmsStackCards : STACK_ITEMS;
  const safeActiveIndex = Math.min(activeIndex, items.length - 1);
  const current = items[safeActiveIndex] || items[0] || STACK_ITEMS[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <section className="bg-[#FFFFFF] py-20 px-4 sm:px-6 lg:px-8 border-b border-[#EAEAEA] overflow-hidden select-none">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        {/* Top Centered Category Title */}
        <div className="text-center mb-8">
          <span className="text-xs font-mono tracking-[0.25em] text-[#666666] uppercase">
            {current.category}
          </span>
        </div>

        {/* 3D Stack Stage */}
        <div className="relative w-full max-w-4xl h-[480px] sm:h-[560px] flex items-center justify-center [perspective:1200px]">
          {/* Previous / Next Arrow buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-12 z-40 w-10 h-10 rounded-full bg-white/90 hover:bg-black text-black hover:text-white border border-[#D0D0D0] flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95"
            aria-label="Previous Category"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-12 z-40 w-10 h-10 rounded-full bg-white/90 hover:bg-black text-black hover:text-white border border-[#D0D0D0] flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95"
            aria-label="Next Category"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Cards Stack */}
          <div className="relative w-[280px] sm:w-[340px] md:w-[380px] h-[440px] sm:h-[520px] [transform-style:preserve-3d]">
            {items.map((item, index) => {
              const offset = index - safeActiveIndex;
              let normalizedOffset = offset;
              if (offset > items.length / 2) normalizedOffset -= items.length;
              if (offset < -items.length / 2) normalizedOffset += items.length;

              const isCenter = normalizedOffset === 0;
              const isVisible = Math.abs(normalizedOffset) <= 2;

              if (!isVisible) return null;

              const x = normalizedOffset * 75;
              const z = -Math.abs(normalizedOffset) * 120;
              const rotateY = normalizedOffset * -12;
              const scale = isCenter ? 1 : 0.88;
              const opacity = isCenter ? 1 : 0.6;
              const zIndex = 20 - Math.abs(normalizedOffset);

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  className="absolute inset-0 rounded-2xl overflow-hidden cursor-pointer bg-[#0A0A0A] border border-[#222222] shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out"
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
                      sizes="(max-width: 768px) 340px, 380px"
                      className="object-cover object-center"
                      priority={isCenter}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                    {/* Card Internal Labels */}
                    <div className="absolute bottom-6 left-6 right-6 text-white text-left">
                      <span className="text-[10px] font-mono tracking-widest text-[#FF4D00] uppercase font-bold">
                        {item.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider mt-0.5">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-[#A0A0A0] font-mono mt-1">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Pill CTA: BACKPACK  SHOP NOW */}
        <div className="mt-8 flex items-center justify-center">
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
