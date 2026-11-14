'use client';

import React from 'react';
import Image from 'next/image';
import { useCmsStore } from '../../lib/cms/cmsStore';
import { CmsEditorialBanner } from '../../types/cms';

interface ZeninEditorialBannerProps {
  initialBanner?: CmsEditorialBanner;
}

const FALLBACK_BANNER = {
  title: 'GOATED NATION STREET ARCHIVE',
  followersText: '176K FOLLOWERS',
  image: 'https://zenin.co.in/cdn/shop/files/webwallpaperss.jpg',
  instagramUrl: 'https://instagram.com/goatednation',
  ctaText: 'INSTAGRAM',
};

export const ZeninEditorialBanner: React.FC<ZeninEditorialBannerProps> = ({ initialBanner }) => {
  const cmsBanner = useCmsStore((state) => state.editorialBanner);
  const banner =
    cmsBanner && cmsBanner.image
      ? cmsBanner
      : initialBanner && initialBanner.image
      ? initialBanner
      : FALLBACK_BANNER;

  return (
    <section className="relative w-full h-[450px] sm:h-[550px] lg:h-[650px] overflow-hidden select-none">
      {/* Background Cinematic Photo */}
      <Image
        src={banner.image || FALLBACK_BANNER.image}
        alt={banner.title || 'Goated Nation Tokyo Anime Streetwear Editorial'}
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority
      />

      {/* Dark tint overlay */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Center 176K FOLLOWERS + INSTAGRAM button (Exact match to Screenshot 5) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 space-y-4 px-4">
        <span className="text-xs sm:text-sm font-mono tracking-[0.3em] uppercase text-white font-medium drop-shadow-md">
          {banner.followersText || '176K FOLLOWERS'}
        </span>

        <a
          href={banner.instagramUrl || 'https://instagram.com/goatednation'}
          target="_blank"
          rel="noreferrer"
          className="px-8 py-2.5 rounded border border-white/70 hover:border-white bg-black/40 hover:bg-white text-white hover:text-black font-mono text-xs uppercase tracking-widest transition-all duration-200 backdrop-blur-sm shadow-lg hover:scale-105 active:scale-95"
        >
          {banner.ctaText || 'INSTAGRAM'}
        </a>
      </div>
    </section>
  );
};

