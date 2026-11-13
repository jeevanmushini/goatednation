'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { ZENIN_ALL_PRODUCTS } from '../../data/products';
import { useCmsStore } from '../../lib/cms/cmsStore';
import { Product } from '../../types/product';
import { ZeninAnnouncementBar } from '../../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../../components/zenin/ZeninHeader';
import { ZeninFooter } from '../../components/zenin/ZeninFooter';
import { CartDrawer } from '../../components/layout/CartDrawer';

type SortOption =
  | 'featured'
  | 'best-selling'
  | 'alpha-asc'
  | 'alpha-desc'
  | 'price-low'
  | 'price-high'
  | 'date-old'
  | 'date-new';

const SORT_LABELS: Record<SortOption, string> = {
  featured: 'Featured',
  'best-selling': 'Best selling',
  'alpha-asc': 'Alphabetically, A-Z',
  'alpha-desc': 'Alphabetically, Z-A',
  'price-low': 'Price, low to high',
  'price-high': 'Price, high to low',
  'date-old': 'Date, old to new',
  'date-new': 'Date, new to old',
};

const ITEMS_PER_PAGE = 16;

export default function CollectionsPage() {
  const cmsProducts = useCmsStore((state) => state.products);

  // Filter & Sort States
  const [inStockOnly, setInStockOnly] = useState(false);
  const [outOfStockOnly, setOutOfStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [currentPage, setCurrentPage] = useState(1);

  // Popover Dropdown States
  const [openDropdown, setOpenDropdown] = useState<'availability' | 'price' | 'sort' | null>(null);

  const availabilityRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const gridTopRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        openDropdown === 'availability' &&
        availabilityRef.current &&
        !availabilityRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      } else if (
        openDropdown === 'price' &&
        priceRef.current &&
        !priceRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      } else if (
        openDropdown === 'sort' &&
        sortRef.current &&
        !sortRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Combine default Zenin items with any CMS items edited in Admin
  const sourceProducts: Product[] = useMemo(() => {
    const list = [...ZENIN_ALL_PRODUCTS];
    if (cmsProducts && cmsProducts.length > 0) {
      cmsProducts.forEach((cp) => {
        const existingIdx = list.findIndex((p) => p.id === cp.id || p.slug === cp.slug);
        if (existingIdx !== -1) {
          list[existingIdx] = cp;
        } else {
          list.push(cp);
        }
      });
    }
    return list;
  }, [cmsProducts]);

  // Max price among available products
  const highestProductPrice = useMemo(() => {
    return Math.max(...sourceProducts.map((p) => p.price), 5999);
  }, [sourceProducts]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...sourceProducts];

    // Availability Filter
    if (inStockOnly && !outOfStockOnly) {
      result = result.filter((p) => p.inStock);
    } else if (outOfStockOnly && !inStockOnly) {
      result = result.filter((p) => !p.inStock);
    }

    // Price Filter
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min)) {
      result = result.filter((p) => p.price >= min);
    }
    if (!isNaN(max)) {
      result = result.filter((p) => p.price <= max);
    }

    // Sort By
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'alpha-asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'alpha-desc') {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === 'best-selling') {
      result.sort((a, b) => b.reviewCount - a.reviewCount);
    } else if (sortBy === 'date-new') {
      result.sort((a, b) => (b.isNewDrop ? 1 : 0) - (a.isNewDrop ? 1 : 0));
    } else if (sortBy === 'date-old') {
      result.sort((a, b) => (a.isNewDrop ? 1 : 0) - (b.isNewDrop ? 1 : 0));
    }

    return result;
  }, [sourceProducts, inStockOnly, outOfStockOnly, minPrice, maxPrice, sortBy]);

  // Handlers that reset page to 1 on filter/sort changes
  const handleInStockChange = (checked: boolean) => {
    setInStockOnly(checked);
    if (checked) setOutOfStockOnly(false);
    setCurrentPage(1);
  };

  const handleOutOfStockChange = (checked: boolean) => {
    setOutOfStockOnly(checked);
    if (checked) setInStockOnly(false);
    setCurrentPage(1);
  };

  const handleMinPriceChange = (val: string) => {
    setMinPrice(val);
    setCurrentPage(1);
  };

  const handleMaxPriceChange = (val: string) => {
    setMaxPrice(val);
    setCurrentPage(1);
  };

  const handleSortChange = (opt: SortOption) => {
    setSortBy(opt);
    setCurrentPage(1);
    setOpenDropdown(null);
  };

  const handleResetFilters = () => {
    setInStockOnly(false);
    setOutOfStockOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('featured');
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, activePage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const inStockCount = useMemo(() => sourceProducts.filter((p) => p.inStock).length, [sourceProducts]);
  const outOfStockCount = useMemo(() => sourceProducts.filter((p) => !p.inStock).length, [sourceProducts]);

  const selectedAvailabilityCount = (inStockOnly ? 1 : 0) + (outOfStockOnly ? 1 : 0);
  const isPriceFiltered = minPrice !== '' || maxPrice !== '';

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-black antialiased selection:bg-[#FF4D00] selection:text-white">
      {/* 1. Zenin Announcement Bar (Top) */}
      <ZeninAnnouncementBar />

      {/* 2. Zenin Header */}
      <ZeninHeader />

      <main className="flex-1 max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 w-full" ref={gridTopRef}>
        {/* Page Title: "All Products" (Exact match to Screenshot 1) */}
        <div className="pt-2 pb-6 sm:pb-8">
          <h1 className="text-2xl sm:text-3xl font-mono text-black font-normal tracking-tight">
            All Products
          </h1>
        </div>

        {/* Filter and Sort Control Bar (Exact match to Screenshot 1) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#EAEAEA] text-xs font-mono text-[#555555]">
          {/* Left Controls: Filter: Availability ˅  Price ˅ */}
          <div className="flex items-center space-x-6 sm:space-x-8">
            <span className="text-[#666666] font-medium">Filter:</span>

            {/* Availability Popover */}
            <div className="relative" ref={availabilityRef}>
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(openDropdown === 'availability' ? null : 'availability')
                }
                className={`flex items-center space-x-1.5 hover:text-black transition-colors ${
                  selectedAvailabilityCount > 0 ? 'text-black font-bold' : 'text-[#333333]'
                }`}
              >
                <span>Availability</span>
                {selectedAvailabilityCount > 0 && (
                  <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded-full">
                    {selectedAvailabilityCount}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openDropdown === 'availability' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'availability' && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-[#E5E5E5] rounded-xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0] text-[11px] text-[#777777]">
                    <span>{selectedAvailabilityCount} selected</span>
                    {selectedAvailabilityCount > 0 && (
                      <button
                        onClick={handleResetFilters}
                        className="text-black hover:underline font-medium"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="py-3 space-y-2.5">
                    <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-black">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => handleInStockChange(e.target.checked)}
                        className="rounded border-[#CCCCCC] text-black focus:ring-black"
                      />
                      <span>In stock ({inStockCount})</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-black">
                      <input
                        type="checkbox"
                        checked={outOfStockOnly}
                        onChange={(e) => handleOutOfStockChange(e.target.checked)}
                        className="rounded border-[#CCCCCC] text-black focus:ring-black"
                      />
                      <span>Out of stock ({outOfStockCount})</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Price Popover */}
            <div className="relative" ref={priceRef}>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
                className={`flex items-center space-x-1.5 hover:text-black transition-colors ${
                  isPriceFiltered ? 'text-black font-bold' : 'text-[#333333]'
                }`}
              >
                <span>Price</span>
                {isPriceFiltered && (
                  <span className="w-1.5 h-1.5 bg-[#FF4D00] rounded-full" />
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openDropdown === 'price' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'price' && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-[#E5E5E5] rounded-xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0] text-[11px] text-[#777777]">
                    <span>The highest price is Rs. {highestProductPrice.toLocaleString('en-IN')}</span>
                    {isPriceFiltered && (
                      <button
                        onClick={() => {
                          setMinPrice('');
                          setMaxPrice('');
                        }}
                        className="text-black hover:underline font-medium"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="pt-3 pb-2 flex items-center space-x-3">
                    <div className="flex-1">
                      <label className="block text-[10px] text-[#888888] mb-1">From</label>
                      <div className="flex items-center border border-[#D5D5D5] rounded px-2 py-1.5">
                        <span className="text-[11px] text-[#777777] mr-1">Rs.</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={minPrice}
                          onChange={(e) => handleMinPriceChange(e.target.value)}
                          className="w-full text-xs outline-none bg-transparent font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex-1">
                      <label className="block text-[10px] text-[#888888] mb-1">To</label>
                      <div className="flex items-center border border-[#D5D5D5] rounded px-2 py-1.5">
                        <span className="text-[11px] text-[#777777] mr-1">Rs.</span>
                        <input
                          type="number"
                          placeholder={highestProductPrice.toString()}
                          value={maxPrice}
                          onChange={(e) => handleMaxPriceChange(e.target.value)}
                          className="w-full text-xs outline-none bg-transparent font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Sort by: Featured ˅   103 products */}
          <div className="flex items-center justify-between sm:justify-end space-x-6 sm:space-x-8">
            <div className="flex items-center space-x-2">
              <span className="text-[#666666]">Sort by:</span>

              {/* Sort By Dropdown */}
              <div className="relative" ref={sortRef}>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                  className="flex items-center space-x-1.5 text-black hover:opacity-75 transition-opacity font-medium"
                >
                  <span>{SORT_LABELS[sortBy]}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openDropdown === 'sort' ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openDropdown === 'sort' && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#E5E5E5] rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1">
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleSortChange(opt)}
                        className={`w-full text-left px-4 py-2 text-xs font-mono transition-colors flex items-center justify-between ${
                          sortBy === opt ? 'bg-[#F5F5F5] text-black font-bold' : 'text-[#444444] hover:bg-[#FAFAFA]'
                        }`}
                      >
                        <span>{SORT_LABELS[opt]}</span>
                        {sortBy === opt && <span className="text-black">&bull;</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Total Products Count (e.g. 103 products) */}
            <span className="text-[#888888] whitespace-nowrap">
              {filteredProducts.length} products
            </span>
          </div>
        </div>

        {/* 4-Column Responsive Product Grid (Exact match to Screenshots 1-4) */}
        {paginatedProducts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-base font-mono text-[#555555]">No products match the selected filters.</p>
            <button
              onClick={() => {
                setInStockOnly(false);
                setOutOfStockOnly(false);
                setMinPrice('');
                setMaxPrice('');
                setSortBy('featured');
              }}
              className="mt-4 px-6 py-2 rounded-lg bg-black text-white text-xs font-mono uppercase tracking-wider hover:bg-neutral-800 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:gap-x-6 lg:gap-y-10">
            {paginatedProducts.map((product) => (
              <ZeninAllProductsCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination Bar (Exact match to Screenshot 4: "1 2 3 ... 7 >") */}
        {totalPages > 1 && (
          <div className="mt-16 sm:mt-20 flex items-center justify-center space-x-4 sm:space-x-6 text-xs sm:text-sm font-mono text-[#555555]">
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`w-7 h-7 flex items-center justify-center transition-colors ${
                  currentPage === p
                    ? 'text-black font-bold border-b border-black'
                    : 'hover:text-black'
                }`}
              >
                {p}
              </button>
            ))}

            {totalPages > 4 && <span className="text-[#888888] px-1">&hellip;</span>}

            {totalPages > 3 && (
              <button
                onClick={() => handlePageChange(totalPages)}
                className={`w-7 h-7 flex items-center justify-center transition-colors ${
                  currentPage === totalPages
                    ? 'text-black font-bold border-b border-black'
                    : 'hover:text-black'
                }`}
              >
                {totalPages}
              </button>
            )}

            {currentPage < totalPages && (
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                className="w-7 h-7 flex items-center justify-center hover:text-black transition-colors"
                aria-label="Next Page"
              >
                &gt;
              </button>
            )}
          </div>
        )}
      </main>

      {/* 5. Zenin Minimalist Pitch-Black Footer (Screenshot 5) */}
      <ZeninFooter />

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
}

// ─── Individual Card with Dual-Image Hover Transition & Crimson Discount Badge (Screenshots 1-4) ───

const ZeninAllProductsCard: React.FC<{
  product: Product;
}> = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);

  const primaryImage = product.images[0] || 'https://cdn.shopify.com/s/files/1/0651/5215/5705/files/web1s.jpg';
  const secondaryImage = product.images[1] || primaryImage;

  return (
    <div
      className="group flex flex-col justify-between"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="block">
        {/* 3:4 Aspect Ratio Image Box with Rounded Corners matching Screenshots */}
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-[10px] bg-[#F5F5F5] mb-2.5">
          {/* Primary Main Image */}
          <Image
            src={primaryImage}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover object-center transition-all duration-500 ease-out ${
              isHovered && secondaryImage !== primaryImage
                ? 'opacity-0 scale-105'
                : 'opacity-100 scale-100'
            }`}
          />

          {/* Secondary Hover Image (if different) */}
          {secondaryImage && secondaryImage !== primaryImage && (
            <Image
              src={secondaryImage}
              alt={`${product.title} alternate view`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover object-center transition-all duration-500 ease-out absolute inset-0 ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            />
          )}

          {/* Crimson Red Discount Badge in Bottom-Left Corner (Exact match to Screenshots) */}
          {product.discountPercent > 0 && (
            <div className="absolute bottom-2.5 left-2.5 z-10">
              <span className="bg-[#8B1D1D] text-white font-mono text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-[3px] tracking-wider uppercase shadow-xs">
                {product.badge || `SAVE ${product.discountPercent}%`}
              </span>
            </div>
          )}
        </div>

        {/* Product Title (Monospace Uppercase with exact Zenin styling) */}
        <div className="space-y-1">
          <h2 className="text-[11px] sm:text-xs font-mono font-medium text-black uppercase tracking-wide line-clamp-1 group-hover:underline underline-offset-2 transition-colors">
            {product.title}
          </h2>

          {/* Price Line (Exact match to screenshots: strikethrough original + current price) */}
          <div className="flex items-center space-x-2 text-[11px] sm:text-xs font-mono">
            <span className="text-[#888888] line-through">
              Rs. {product.originalPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-black font-semibold">
              Rs. {product.price.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};
