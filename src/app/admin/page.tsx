'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Grid,
  Layers,
  Image as ImageIcon,
  ArrowRight,
  Clock,
  Eye,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cmsStore';

export default function AdminOverviewPage() {
  const { products, categories, sections, media, lastPublishedAt, isDraft } = useCmsStore();

  const enabledSections = sections.filter((s) => s.enabled).length;

  const stats = [
    {
      label: 'Products in Catalog',
      value: products.length,
      sub: 'All active drops',
      icon: ShoppingBag,
      href: '/admin/products',
    },
    {
      label: 'Curated Categories',
      value: categories.length,
      sub: 'Active silhouettes',
      icon: Grid,
      href: '/admin/categories',
    },
    {
      label: 'Homepage Sections',
      value: `${enabledSections} / ${sections.length}`,
      sub: 'Enabled on storefront',
      icon: Layers,
      href: '/admin/homepage',
    },
    {
      label: 'Media Assets Stored',
      value: media.length,
      sub: 'High-res photos & banners',
      icon: ImageIcon,
      href: '/admin/media',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome Banner */}
      <div className="p-8 rounded-xl bg-white border border-[#EAEAEA] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-[#F5F5F5] border border-[#EAEAEA] text-[11px] font-mono text-black font-bold mb-3 uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>GOATED NATION CMS ENGINE ACTIVE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-black uppercase tracking-tight">
            STOREFRONT CONTENT MANAGEMENT
          </h1>
          <p className="text-xs sm:text-sm font-mono text-[#666666] mt-1.5 max-w-xl">
            Control all public copy, 3D hero bottoms, category card decks, promotional banners, and product collections.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Link
            href="/admin/homepage"
            className="px-5 py-3 rounded bg-black hover:bg-[#222222] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            <span>Edit Homepage</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            target="_blank"
            className="px-5 py-3 rounded bg-[#FAFAFA] hover:bg-[#F0F0F0] border border-[#EAEAEA] text-black font-mono text-xs flex items-center justify-center space-x-2 transition-colors uppercase tracking-wider"
          >
            <Eye className="w-4 h-4 text-[#FF4D00]" />
            <span>Preview Store</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="p-5 rounded-lg bg-white border border-[#EAEAEA] hover:border-black transition-all group flex flex-col justify-between shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-[#777777] uppercase tracking-wider">{s.label}</span>
                <div className="p-2 rounded bg-[#FAFAFA] border border-[#EAEAEA] text-black group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-mono font-bold text-black">
                  {s.value}
                </div>
                <div className="text-[11px] font-mono text-[#888888] mt-0.5">{s.sub}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Layout: Quick Actions & Recent Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Quick Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
            Quick Content Shortcuts
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/admin/homepage"
              className="p-5 rounded-lg bg-white border border-[#EAEAEA] hover:border-black transition-all space-y-2 group shadow-sm"
            >
              <div className="w-9 h-9 rounded bg-[#FAFAFA] border border-[#EAEAEA] text-black flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-mono font-bold text-xs sm:text-sm text-black group-hover:underline">
                Visual Homepage Editor
              </h3>
              <p className="text-xs font-mono text-[#666666]">
                Upload 3D hero bottoms, category decks, and banners from laptop.
              </p>
            </Link>

            <Link
              href="/admin/products"
              className="p-5 rounded-lg bg-white border border-[#EAEAEA] hover:border-black transition-all space-y-2 group shadow-sm"
            >
              <div className="w-9 h-9 rounded bg-[#FAFAFA] border border-[#EAEAEA] text-black flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="font-mono font-bold text-xs sm:text-sm text-black group-hover:underline">
                Product Catalog Manager
              </h3>
              <p className="text-xs font-mono text-[#666666]">
                Add, edit, or delete streetwear pieces, set GSM, prices, and sizes.
              </p>
            </Link>

            <Link
              href="/admin/shipping"
              className="p-5 rounded-lg bg-white border border-[#EAEAEA] hover:border-black transition-all space-y-2 group shadow-sm"
            >
              <div className="w-9 h-9 rounded bg-[#FAFAFA] border border-[#EAEAEA] text-[#FF4D00] flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <h3 className="font-mono font-bold text-xs sm:text-sm text-black group-hover:underline">
                Shiprocket Logistics
              </h3>
              <p className="text-xs font-mono text-[#666666]">
                Connected to live Shiprocket gateway for tracking, rates, and AWB.
              </p>
            </Link>

            <Link
              href="/admin/categories"
              className="p-5 rounded-lg bg-white border border-[#EAEAEA] hover:border-black transition-all space-y-2 group shadow-sm"
            >
              <div className="w-9 h-9 rounded bg-[#FAFAFA] border border-[#EAEAEA] text-black flex items-center justify-center">
                <Grid className="w-4 h-4" />
              </div>
              <h3 className="font-mono font-bold text-xs sm:text-sm text-black group-hover:underline">
                Category Silhouettes
              </h3>
              <p className="text-xs font-mono text-[#666666]">
                Organize Oversized Tees, Hoodies, Cargo, and Jackets.
              </p>
            </Link>
          </div>
        </div>

        {/* Status & Audit Log (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
            System Status
          </h2>

          <div className="p-6 rounded-lg bg-white border border-[#EAEAEA] space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <span className="text-xs font-mono text-[#777777]">Sync Status:</span>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
                  isDraft
                    ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                    : 'bg-[#16A34A]/10 text-[#16A34A]'
                }`}
              >
                {isDraft ? 'Unpublished Draft' : 'Synchronized'}
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <span className="text-xs font-mono text-[#777777]">Last Published:</span>
              <span className="text-xs font-mono text-black flex items-center font-semibold">
                <Clock className="w-3.5 h-3.5 mr-1 text-[#888888]" />
                {new Date(lastPublishedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <span className="text-xs font-mono text-[#777777]">Payment Gateway:</span>
              <span className="text-xs font-mono font-bold text-[#16A34A]">Razorpay (Active)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#777777]">Logistics Partner:</span>
              <span className="text-xs font-mono font-bold text-[#16A34A]">
                Shiprocket (Connected)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
