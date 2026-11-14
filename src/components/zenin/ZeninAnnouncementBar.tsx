'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCmsStore } from '../../lib/cms/cmsStore';
import { CmsAnnouncement } from '../../types/cms';

interface ZeninAnnouncementBarProps {
  initialAnnouncement?: CmsAnnouncement;
}

export const ZeninAnnouncementBar: React.FC<ZeninAnnouncementBarProps> = ({ initialAnnouncement }) => {
  const cmsAnnouncement = useCmsStore((state) => state.announcement);
  const settings = useCmsStore((state) => state.settings);

  const activeAnn = cmsAnnouncement || initialAnnouncement;
  const announcementText = activeAnn?.text || 'APPLIED AT CHECKOUT';
  const highlightText = activeAnn?.highlightText || 'EXTRA 15% OFF ON PREPAID ORDERS';
  const ctaText = activeAnn?.ctaText || 'SHOP NOW';
  const ctaLink = activeAnn?.ctaLink || '/collections';
  const countdownDays = activeAnn?.countdownDays || 2;

  const [secondsRemaining, setSecondsRemaining] = useState(
    countdownDays * 86400 + 14 * 3600 + 22 * 60 + 5
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : countdownDays * 86400));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownDays]);

  if (settings && settings.announcementEnabled === false) {
    return null;
  }

  const days = Math.floor(secondsRemaining / 86400);
  const hours = Math.floor((secondsRemaining % 86400) / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="bg-[#242424] text-white text-[11px] font-mono border-b border-[#2C2C2C] py-2 px-4 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 sm:gap-8 tracking-wider flex-wrap">
        <div className="flex flex-col items-center sm:items-start text-center">
          <span className="font-bold text-white text-[11px] tracking-widest uppercase">
            {highlightText}
          </span>
          <span className="text-[#999999] uppercase tracking-wider text-[9px]">
            {announcementText}
          </span>
        </div>

        <div className="flex items-center gap-2 font-bold text-[#FFFFFF] text-xs">
          <div className="flex flex-col items-center">
            <span>{pad(days)}</span>
            <span className="text-[#888888] font-normal text-[8px] uppercase">days</span>
          </div>
          <span className="text-[#666666] -mt-2">:</span>
          <div className="flex flex-col items-center">
            <span>{pad(hours)}</span>
            <span className="text-[#888888] font-normal text-[8px] uppercase">hrs</span>
          </div>
          <span className="text-[#666666] -mt-2">:</span>
          <div className="flex flex-col items-center">
            <span>{pad(minutes)}</span>
            <span className="text-[#888888] font-normal text-[8px] uppercase">mins</span>
          </div>
          <span className="text-[#666666] -mt-2">:</span>
          <div className="flex flex-col items-center">
            <span className="text-[#FF5000]">{pad(seconds)}</span>
            <span className="text-[#888888] font-normal text-[8px] uppercase">secs</span>
          </div>
        </div>

        <Link
          href={ctaLink}
          className="px-3.5 py-1.5 bg-[#FF5000] hover:bg-[#e64700] text-white font-mono font-bold text-[10px] uppercase rounded tracking-widest transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm"
        >
          {ctaText || 'SHOP NOW!'}
        </Link>
      </div>
    </div>
  );
};

