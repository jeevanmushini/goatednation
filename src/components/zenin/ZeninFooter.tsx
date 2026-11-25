'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Instagram, Facebook, Check, ShieldCheck } from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cmsStore';

export const ZeninFooter: React.FC = () => {
  const settings = useCmsStore((state) => state.settings);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer className="mt-auto w-full bg-[#0A0A0A] text-white border-t border-[#1C1C1C] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Main Grid: Brand & Mission + Newsletter + Socials */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center pb-8 border-b border-[#1A1A1A]">
          {/* Col 1: Brand Identifier & Monogram (5 cols) */}
          <div className="md:col-span-5 space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-mono font-bold tracking-[0.25em] uppercase text-white">
                {settings?.brandName || 'GOATED NATION'}
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#FF4D00] bg-[#FF4D00]/10 border border-[#FF4D00]/20 px-1.5 py-0.5 rounded uppercase">
                東京 // BLR
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#777777] leading-relaxed max-w-sm">
              Heavyweight anime-inspired streetwear syndicate. Engineered in Bengaluru, India.
            </p>
          </div>

          {/* Col 2: Compact Inline Newsletter (5 cols) */}
          <div className="md:col-span-5">
            {subscribed ? (
              <div className="flex items-center space-x-2 text-[11px] font-mono text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-3 py-2 rounded">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>SUBSCRIBED • 10% VOUCHER DISPATCHED TO EMAIL</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex items-center">
                <div className="relative w-full">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email for private drops & drops..."
                    className="w-full bg-[#121212] border border-[#262626] focus:border-[#FF4D00] focus:bg-black rounded-l-md px-3.5 py-2 text-xs text-white placeholder-[#555555] font-mono outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-white hover:bg-[#E5E5E5] text-black px-3.5 py-2 rounded-r-md text-xs font-mono uppercase font-bold flex items-center space-x-1 transition-colors shrink-0"
                  title="Subscribe to Syndicate Drops"
                >
                  <span className="hidden sm:inline text-[11px] tracking-wider">JOIN</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

          {/* Col 3: Social Links & Compliance Pill (2 cols) */}
          <div className="md:col-span-2 flex items-center md:justify-end space-x-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded border border-[#222222] bg-[#121212] hover:bg-white hover:text-black hover:border-white text-[#888888] flex items-center justify-center transition-all"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href={settings?.instagramUrl || 'https://instagram.com/goatednation'}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded border border-[#222222] bg-[#121212] hover:bg-white hover:text-black hover:border-white text-[#888888] flex items-center justify-center transition-all"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Bottom Legal & Statutory Policies Bar */}
        <div className="pt-6 flex flex-col lg:flex-row items-center justify-between gap-4 text-[10px] font-mono text-[#666666] tracking-wider">
          <div className="flex items-center space-x-2">
            <span>
              &copy; {new Date().getFullYear()} {settings?.brandName || 'GOATED NATION'}. ALL RIGHTS RESERVED.
            </span>
            <span className="text-[#333333] hidden sm:inline">&bull;</span>
            <span className="text-[#555555] hidden sm:inline flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500 inline mr-1" />
              <span>DPDP ACT 2023 COMPLIANT</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px]">
            <Link
              href="/policies/refund-and-exchange"
              className="text-[#888888] hover:text-white transition-colors"
            >
              Refund policy
            </Link>
            <span className="text-[#333333]">&bull;</span>
            <Link
              href="/policies/privacy-policy"
              className="text-[#888888] hover:text-white transition-colors"
            >
              Privacy policy
            </Link>
            <span className="text-[#333333]">&bull;</span>
            <Link
              href="/policies/terms-of-service"
              className="text-[#888888] hover:text-white transition-colors"
            >
              Terms of service
            </Link>
            <span className="text-[#333333]">&bull;</span>
            <Link
              href="/policies/shipping-and-delivery"
              className="text-[#888888] hover:text-white transition-colors"
            >
              Shipping policy
            </Link>
            <span className="text-[#333333]">&bull;</span>
            <Link
              href="/policies/grievance-redressal"
              className="text-[#888888] hover:text-white transition-colors"
            >
              Grievance & Legal
            </Link>
            <span className="text-[#333333]">&bull;</span>
            <Link
              href="/support"
              className="text-white font-bold hover:text-[#FF4D00] transition-colors"
            >
              Support Desk
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
