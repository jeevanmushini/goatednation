'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, User, ShoppingBag, ChevronDown, Menu, X, Shield, LogOut, Truck } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { useCmsStore } from '../../lib/cms/cmsStore';
import { SearchModal } from '../layout/SearchModal';

const emptySubscribe = () => () => {};

const CATEGORIES = [
  { name: 'BACKPACKS', slug: 'backpack' },
  { name: 'BOTTOMS', slug: 'trackpant' },
  { name: 'JACKET', slug: 'jacket' },
  { name: 'WINTER', slug: 'winter' },
  { name: 'T SHIRTS', slug: 'tees' },
  { name: 'ACCESSORIES', slug: 'accessories' },
  { name: 'HOODIE', slug: 'hoodie' },
  { name: 'CAPS', slug: 'caps' },
  { name: 'DESKMAT', slug: 'deskmat' },
  { name: 'JERSEY', slug: 'jersey' },
  { name: 'COMPRESSION', slug: 'compression' },
  { name: 'VEST', slug: 'vest' },
];

export const ZeninHeader: React.FC = () => {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());
  const openDrawer = useCartStore((state) => state.openDrawer);

  const cmsCategories = useCmsStore((state) => state.categories);
  const settings = useCmsStore((state) => state.settings);

  const categoriesList: { name: string; slug: string }[] = useMemo(() => {
    if (cmsCategories && cmsCategories.length > 0) {
      return cmsCategories
        .filter((c) => c.enabled !== false)
        .map((c) => ({ name: c.title.toUpperCase(), slug: c.slug }));
    }
    return CATEGORIES;
  }, [cmsCategories]);

  const { user, isAuthenticated, isAdmin, logout, checkAuth } = useAuthStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E8E8E8] shadow-xs">
        {/* Main Nav Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Mobile hamburger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-black hover:opacity-70 transition-opacity"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Left / Brand Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="group flex items-center">
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-black uppercase font-mono">
                {settings?.brandName ? (
                  settings.brandName.includes(' ') ? (
                    <>
                      {settings.brandName.split(' ')[0]}
                      <span className="text-[#FF4D00]">
                        {settings.brandName.slice(settings.brandName.indexOf(' ') + 1)}
                      </span>
                    </>
                  ) : (
                    settings.brandName
                  )
                ) : (
                  <>
                    GOATED<span className="text-[#FF4D00]">NATION</span>
                  </>
                )}
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6 text-[13px] font-sans tracking-wide">
              <Link
                href="/"
                className={`py-1 transition-all ${
                  pathname === '/'
                    ? 'text-black font-bold border-b-2 border-black'
                    : 'text-[#555555] hover:text-black'
                }`}
              >
                Home
              </Link>

              <Link
                href="/collections"
                className={`py-1 transition-all ${
                  pathname === '/collections' || pathname === '/collections/all-products'
                    ? 'text-black font-bold border-b-2 border-black'
                    : 'text-[#555555] hover:text-black'
                }`}
              >
                All Products
              </Link>

              {/* Categories with Dropdown */}
              <div
                className="relative py-1"
                onMouseEnter={() => setIsCategoriesOpen(true)}
                onMouseLeave={() => setIsCategoriesOpen(false)}
              >
                <button
                  type="button"
                  className="flex items-center space-x-1 text-[#555555] hover:text-black transition-colors"
                >
                  <span>Categories</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* Dropdown Menu */}
                {isCategoriesOpen && (
                  <div className="absolute top-full left-0 w-64 bg-white border border-[#E5E5E5] shadow-xl rounded-b-xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="grid grid-cols-1 gap-0.5">
                      {categoriesList.map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/collections/${cat.slug}`}
                          className="px-4 py-2 text-xs font-mono tracking-wider text-[#444444] hover:bg-[#F5F5F5] hover:text-black transition-colors flex items-center justify-between"
                        >
                          <span>{cat.name}</span>
                          <span className="text-[10px] text-[#AAAAAA]">&rarr;</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/track"
                className={`py-1 transition-all ${
                  pathname === '/track'
                    ? 'text-black font-bold border-b-2 border-black'
                    : 'text-[#555555] hover:text-black'
                }`}
              >
                Order Tracking
              </Link>

              <Link
                href="/about"
                className={`py-1 transition-all ${
                  pathname === '/about'
                    ? 'text-black font-bold border-b-2 border-black'
                    : 'text-[#555555] hover:text-black'
                }`}
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-4 text-black">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1 hover:opacity-60 transition-opacity"
              aria-label="Search"
            >
              <Search className="w-4 h-4 stroke-[2]" />
            </button>

            {/* User Account / Auth Dropdown */}
            {mounted && isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-1.5 p-1 hover:opacity-80 transition-opacity"
                  title="My Account"
                  aria-label="User Menu"
                >
                  <div className="relative w-6 h-6 rounded-full overflow-hidden border border-black/20 bg-black/5 flex items-center justify-center">
                    {user.avatar ? (
                      <Image src={user.avatar} alt={user.name} fill sizes="24px" className="object-cover" />
                    ) : (
                      <span className="text-[10px] font-mono font-bold">{user.name.charAt(0)}</span>
                    )}
                  </div>
                  {isAdmin && (
                    <span className="w-2 h-2 rounded-full bg-[#FF4D00] shrink-0" title="Admin Clearance" />
                  )}
                </button>

                {/* Popover User Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#E5E5E5] shadow-xl rounded-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-[#F0F0F0]">
                      <div className="text-xs font-mono font-bold text-black truncate uppercase">
                        {user.name}
                      </div>
                      <div className="text-[10px] font-mono text-[#888888] truncate">{user.email}</div>
                      <div className="mt-1.5 flex items-center space-x-1.5">
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            isAdmin ? 'bg-[#FF4D00] text-white' : 'bg-black text-white'
                          }`}
                        >
                          {user.role}
                        </span>
                        <span className="text-[9px] font-mono text-[#777777] uppercase">
                          Via {user.provider}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs font-mono text-[#333333] hover:bg-[#F5F5F5] hover:text-black transition-colors"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>My Account</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs font-mono font-bold text-[#FF4D00] hover:bg-orange-50 transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Admin Control Center</span>
                        </Link>
                      )}

                      <Link
                        href="/track"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs font-mono text-[#333333] hover:bg-[#F5F5F5] hover:text-black transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Order Tracking</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-[#F0F0F0]">
                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await logout();
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-mono text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="p-1 hover:opacity-60 transition-opacity hidden sm:block"
                title="Sign In / Register"
              >
                <User className="w-4 h-4 stroke-[2]" />
              </Link>
            )}

            <button
              onClick={openDrawer}
              className="relative p-1 hover:opacity-60 transition-opacity"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2]" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#FF4D00] text-white text-[9px] font-mono font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Slide-out */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E5E5E5] px-5 py-4 space-y-3 font-mono text-xs">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-black font-bold uppercase"
            >
              Home
            </Link>
            <Link
              href="/collections"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-[#444444] uppercase"
            >
              All Products
            </Link>
            <div className="py-2">
              <span className="text-[10px] text-[#888888] uppercase tracking-wider block mb-2">
                Categories
              </span>
              <div className="grid grid-cols-2 gap-2 pl-2">
                {categoriesList.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/collections/${cat.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-1 text-[#555555] hover:text-black text-[11px]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href="/track"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-[#444444] uppercase"
            >
              Order Tracking
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-[#444444] uppercase"
            >
              Contact
            </Link>

            {/* Mobile Auth / Role Links */}
            <div className="pt-3 border-t border-[#EAEAEA] space-y-2">
              {mounted && isAuthenticated && user ? (
                <>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[11px] font-bold text-black uppercase">{user.name}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        isAdmin ? 'bg-[#FF4D00] text-white' : 'bg-black text-white'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-1.5 text-[#555555] hover:text-black"
                  >
                    My Account Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-1.5 text-[#FF4D00] font-bold uppercase"
                    >
                      Admin Portal &rarr;
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await logout();
                    }}
                    className="block py-1.5 text-red-600 font-bold"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-4 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 py-2 text-center rounded border border-black bg-black text-white uppercase font-bold"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 py-2 text-center rounded border border-[#CCCCCC] text-black uppercase font-bold"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
