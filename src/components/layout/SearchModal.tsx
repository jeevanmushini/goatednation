'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, ArrowRight, Flame } from 'lucide-react';
import { PRODUCTS } from '../../data/products';
import { useCmsStore } from '../../lib/cms/cmsStore';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const cmsProducts = useCmsStore((state) => state.products);
  const allProducts = cmsProducts.length > 0 ? cmsProducts : PRODUCTS;

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return allProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.anime.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [query, allProducts]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickTags = [
    'Jujutsu Kaisen',
    'Berserk',
    'Cyberpunk',
    'Oversized Tees',
    'Acid Wash',
    'Heavy Hoodies',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/85 backdrop-blur-md px-4">
      <div className="relative w-full max-w-2xl bg-[#121212] border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="flex items-center px-6 py-4 border-b border-[#222222]">
          <Search className="w-5 h-5 text-[#E8FF00] mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime, oversized hoodies, acid-wash tees..."
            autoFocus
            className="w-full bg-transparent text-white placeholder-[#666666] outline-none text-base font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 mr-2 text-[#777777] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1C1C1C] hover:bg-[#282828] text-[#A0A0A0] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-6 py-3 bg-[#0E0E0E] border-b border-[#1E1E1E] flex items-center space-x-2 overflow-x-auto text-xs">
          <span className="text-[#666666] shrink-0 flex items-center">
            <Flame className="w-3 h-3 text-[#E8FF00] mr-1" /> Trending:
          </span>
          {quickTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-2.5 py-1 rounded-full bg-[#1A1A1A] text-[#A0A0A0] hover:text-[#E8FF00] hover:bg-[#252525] transition-colors shrink-0"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {query && results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-white mb-2">No streetwear drops found</p>
              <p className="text-sm text-[#777777]">
                Try searching for &quot;Jujutsu&quot;, &quot;Hoodie&quot;, or &quot;Berserk&quot;
              </p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs uppercase font-mono text-[#777777] tracking-wider mb-3">
                Found {results.length} Products
              </p>
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  onClick={onClose}
                  className="flex items-center space-x-4 p-3 rounded-xl bg-[#171717] hover:bg-[#202020] border border-transparent hover:border-[#333333] transition-all group"
                >
                  <div className="relative w-16 h-20 bg-[#0E0E0E] rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      sizes="64px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono uppercase text-[#E8FF00] tracking-wider">
                      {product.anime}
                    </span>
                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#E8FF00] transition-colors">
                      {product.title}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm font-bold text-white font-mono">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-[#666666] line-through font-mono">
                        ₹{product.originalPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] font-mono bg-[#E8FF00]/10 text-[#E8FF00] px-1.5 py-0.5 rounded">
                        {product.discountPercent}% OFF
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#555555] group-hover:text-[#E8FF00] transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-[#777777]">
                Type to start searching drops, collections, anime series, and techwear essentials.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
