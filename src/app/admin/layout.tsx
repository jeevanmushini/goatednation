'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  ShoppingBag,
  Grid,
  Image as ImageIcon,
  Compass,
  Settings,
  ExternalLink,
  Check,
  RotateCcw,
  Truck,
  Sparkles,
  Shield,
  Lock,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cmsStore';
import { useAuthStore } from '../../stores/authStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDraft, publishChanges, resetToDefaults } = useCmsStore();
  const { user, isAuthenticated, isAdmin, isLoading, checkAuth, login, logout } = useAuthStore();

  const [publishedToast, setPublishedToast] = useState(false);
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Homepage CMS', href: '/admin/homepage', icon: Layers },
    { label: 'Products', href: '/admin/products', icon: ShoppingBag },
    { label: 'Categories', href: '/admin/categories', icon: Grid },
    { label: 'Media Library', href: '/admin/media', icon: ImageIcon },
    { label: 'Shipping & Logistics', href: '/admin/shipping', icon: Truck },
    { label: 'Navigation', href: '/admin/navigation', icon: Compass },
    { label: 'Global Settings', href: '/admin/settings', icon: Settings },
  ];

  const handlePublish = () => {
    publishChanges();
    setPublishedToast(true);
    setTimeout(() => setPublishedToast(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all CMS content to default values?')) {
      resetToDefaults();
      alert('CMS content reset to official defaults.');
    }
  };

  const handleQuickAdminLogin = async () => {
    setQuickLoginLoading(true);
    await login('admin@goatednation.com', 'Admin@123');
    setQuickLoginLoading(false);
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBFBFB] font-mono">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest text-[#666666]">
            VERIFYING ADMIN CLEARANCE (RBAC)...
          </p>
        </div>
      </div>
    );
  }

  // 2. Access Denied / Not Authenticated or Non-Admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-4 selection:bg-[#FF4D00] selection:text-white">
        <div className="w-full max-w-lg bg-white border border-[#E5E5E5] rounded-xl p-6 sm:p-8 shadow-xs">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full inline-flex items-center space-x-1.5">
              <Lock className="w-3 h-3 text-red-500" />
              <span>403 FORBIDDEN // 権限なし</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight uppercase text-black mt-3">
              ADMINISTRATOR CLEARANCE REQUIRED
            </h1>
            <p className="text-xs font-mono text-[#666666] mt-1.5 tracking-wide leading-relaxed">
              This area is restricted to GOATED NATION syndicate administrators. Role-Based Access Control (RBAC) is enforced.
            </p>
          </div>

          {/* Current Auth Status */}
          {isAuthenticated && user && (
            <div className="mb-6 p-4 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center font-mono font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-black">{user.name}</div>
                  <div className="text-[10px] font-mono text-[#888888]">{user.email}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded bg-black text-white text-[9px] font-mono font-bold uppercase">
                  Role: {user.role}
                </span>
                <span className="block text-[9px] font-mono text-red-500 mt-0.5">No Admin Rights</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleQuickAdminLogin}
              disabled={quickLoginLoading}
              className="w-full py-3 px-4 rounded-lg bg-black hover:bg-[#222222] text-white text-xs font-mono uppercase tracking-widest font-bold flex items-center justify-center space-x-2 transition-all shadow-sm hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              <Shield className="w-4 h-4 text-[#FF4D00]" />
              <span>
                {quickLoginLoading ? 'AUTHENTICATING ADMIN...' : '1-CLICK ADMIN DEMO LOGIN'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="/login?redirect=/admin"
              className="w-full py-2.5 px-4 rounded-lg border border-[#D0D0D0] hover:border-black bg-white hover:bg-[#FAFAFA] text-xs font-mono uppercase tracking-widest font-bold text-black flex items-center justify-center space-x-2 transition-colors"
            >
              <span>SIGN IN WITH DIFFERENT ACCOUNT</span>
            </Link>

            <Link
              href="/"
              className="w-full py-2 text-center text-[11px] font-mono text-[#777777] hover:text-black uppercase tracking-wider block transition-colors"
            >
              &larr; Return to Public Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated as ADMIN
  return (
    <div className="flex min-h-screen bg-[#FBFBFB] text-black font-sans antialiased selection:bg-[#FF4D00] selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-[#EAEAEA] flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          {/* Admin Header */}
          <div className="p-6 border-b border-[#EAEAEA]">
            <Link href="/admin" className="flex items-center space-x-2">
              <span className="text-xl font-mono font-bold tracking-tight text-black">
                GOATED NATION
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF4D00] text-white font-bold">
                ADMIN
              </span>
            </Link>
            <div className="flex items-center space-x-1.5 mt-2">
              <Shield className="w-3 h-3 text-[#FF4D00]" />
              <span className="text-[10px] font-mono text-[#666666] uppercase tracking-wider font-semibold">
                JWT RBAC Verified
              </span>
            </div>
          </div>

          {/* Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-mono tracking-wide transition-all ${
                    isActive
                      ? 'bg-black text-white font-bold shadow-sm'
                      : 'text-[#666666] hover:text-black hover:bg-[#F2F2F2]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions & Admin User Info */}
        <div className="p-4 border-t border-[#EAEAEA] space-y-2">
          {/* Current Admin User Badge */}
          {user && (
            <div className="p-3 bg-[#FAFAFA] border border-[#EAEAEA] rounded-lg mb-2">
              <div className="flex items-center space-x-2.5">
                <div className="relative w-7 h-7 rounded-full overflow-hidden bg-black/10 shrink-0">
                  {user.avatar ? (
                    <Image src={user.avatar} alt={user.name} fill sizes="28px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-mono font-bold">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-mono font-bold text-black truncate uppercase">
                    {user.name}
                  </div>
                  <div className="text-[9px] font-mono text-[#888888] truncate">{user.email}</div>
                </div>
              </div>
            </div>
          )}

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg bg-[#FAFAFA] hover:bg-[#F0F0F0] border border-[#EAEAEA] text-black text-xs font-mono transition-colors"
          >
            <span className="flex items-center">
              <ExternalLink className="w-3.5 h-3.5 mr-2 text-[#FF4D00]" /> Live Storefront
            </span>
            <span className="text-[10px] text-[#888888]">&rarr;</span>
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center px-2 py-2 rounded-lg text-[11px] font-mono text-[#888888] hover:text-[#8A1616] transition-colors"
            >
              <RotateCcw className="w-3 h-3 mr-1" /> Reset
            </button>

            <button
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              className="flex-1 flex items-center justify-center px-2 py-2 rounded-lg text-[11px] font-mono text-[#888888] hover:text-black transition-colors"
            >
              <LogOut className="w-3 h-3 mr-1" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[#EAEAEA] px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase text-[#888888]">ADMIN /</span>
            <span className="text-xs font-mono text-black font-bold uppercase">
              {pathname === '/admin' ? 'Overview' : pathname.replace('/admin/', '').replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live Status indicator */}
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isDraft ? 'bg-[#F59E0B] animate-pulse' : 'bg-[#16A34A]'
                }`}
              />
              <span className={isDraft ? 'text-[#F59E0B] font-semibold' : 'text-[#888888]'}>
                {isDraft ? 'Draft Changes Pending' : 'All Published'}
              </span>
            </div>

            {/* Publish Button */}
            <button
              onClick={handlePublish}
              className="flex items-center space-x-1.5 px-4 py-2 rounded bg-black hover:bg-[#222222] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Publish to Live Store</span>
            </button>
          </div>
        </header>

        {/* Toast Alert */}
        {publishedToast && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-lg bg-white border border-[#16A34A] text-black text-xs font-mono flex items-center space-x-3 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="w-6 h-6 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#16A34A]">Published Successfully!</div>
              <div className="text-[#666666] text-[11px]">
                Changes are now live across the public storefront.
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
