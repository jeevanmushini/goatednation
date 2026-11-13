'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Instagram, Facebook, Check } from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cmsStore';

export const ZeninFooter: React.FC = () => {
  const settings = useCmsStore((state) => state.settings);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer className="bg-[#0E0E0E] text-white border-t border-[#1C1C1C]">
      {/* Newsletter & Socials Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-14 border-b border-[#1C1C1C]">
          {/* Left: Newsletter */}
          <div className="max-w-md w-full">
            <h3 className="text-sm sm:text-base font-mono uppercase tracking-widest text-[#E5E5E5] mb-4">
              Subscribe to our emails
            </h3>

            {subscribed ? (
              <div className="flex items-center space-x-2 text-xs font-mono text-[#22C55E]">
                <Check className="w-4 h-4" />
                <span>WELCOME TO THE INNER SYNDICATE • 10% CODE APPLIED</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full bg-transparent border border-[#2A2A2A] focus:border-white rounded-none px-4 py-3 text-xs text-white placeholder-[#777777] font-mono outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-3 p-1.5 text-[#888888] hover:text-white transition-colors"
                  aria-label="Submit Email"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Right: Social Media Icons */}
          <div className="flex items-center space-x-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 text-[#888888] hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5 stroke-[1.5]" />
            </a>
            <a
              href={settings?.instagramUrl || 'https://instagram.com/goatednation'}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-[#888888] hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5 stroke-[1.5]" />
            </a>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar (Exact match to Screenshot 5) */}
        <div className="pt-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-[#666666] tracking-wider">
          <p>
            &copy; {new Date().getFullYear()}, {settings?.brandName || 'GOATED NATION'} Powered by Shopify
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link href="/about" className="hover:text-white transition-colors">
              Refund policy
            </Link>
            <span>&bull;</span>
            <Link href="/about" className="hover:text-white transition-colors">
              Privacy policy
            </Link>
            <span>&bull;</span>
            <Link href="/about" className="hover:text-white transition-colors">
              Terms of service
            </Link>
            <span>&bull;</span>
            <Link href="/about" className="hover:text-white transition-colors">
              Shipping policy
            </Link>
            <span>&bull;</span>
            <Link href="/about" className="hover:text-white transition-colors">
              Contact information
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

