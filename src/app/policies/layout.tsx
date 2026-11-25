'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  FileText,
  RotateCcw,
  Truck,
  Scale,
  Building2,
  Printer,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { ZeninAnnouncementBar } from '../../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../../components/zenin/ZeninHeader';
import { ZeninFooter } from '../../components/zenin/ZeninFooter';

const POLICIES = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    statute: 'DPDP Act 2023',
    icon: ShieldCheck,
  },
  {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    statute: 'E-Comm Rules 2020',
    icon: FileText,
  },
  {
    slug: 'refund-and-exchange',
    title: 'Refund & Exchange',
    statute: '7-Day Return SLA',
    icon: RotateCcw,
  },
  {
    slug: 'shipping-and-delivery',
    title: 'Shipping & Delivery',
    statute: 'Shiprocket SLAs',
    icon: Truck,
  },
  {
    slug: 'grievance-redressal',
    title: 'Grievance Redressal',
    statute: 'IT Rules 2021',
    icon: Building2,
  },
  {
    slug: 'legal-metrology',
    title: 'Legal Metrology',
    statute: 'Packaged Goods 2011',
    icon: Scale,
  },
];

export default function PoliciesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] text-black antialiased selection:bg-[#FF4D00] selection:text-white print:bg-white">
      {/* Top Announcements & Minimal Header (Hidden during Print) */}
      <div className="print:hidden">
        <ZeninAnnouncementBar />
        <ZeninHeader />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E5E5E5] print:hidden">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 text-xs font-mono uppercase tracking-wider text-[#666666] hover:text-black transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </Link>
            <span className="text-[#CCCCCC] font-mono">/</span>
            <span className="text-xs font-mono uppercase tracking-widest text-[#999999]">
              Legal Registry
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-md border border-[#DCDCDC] bg-white hover:bg-[#F0F0F0] text-xs font-mono text-[#444444] transition-all shadow-xs cursor-pointer"
              title="Print Policy Document"
            >
              <Printer className="w-3.5 h-3.5 text-[#666666]" />
              <span>Print Document</span>
            </button>
            <Link
              href="/support"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-black hover:bg-[#222222] text-white text-xs font-mono uppercase tracking-wider transition-colors shadow-xs"
            >
              <span>Support Desk</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Layout Grid: Sidebar + Legal Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Sticky Sidebar Navigation (Hidden during Print) */}
          <aside className="lg:col-span-4 xl:col-span-3 sticky top-24 print:hidden">
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-xs space-y-4">
              <div className="border-b border-[#F0F0F0] pb-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#FF4D00] font-bold block mb-1">
                  法定規約 // COMPLIANCE
                </span>
                <h2 className="text-sm font-mono font-bold uppercase tracking-tight text-black">
                  Statutory Policies
                </h2>
              </div>

              <nav className="space-y-1">
                {POLICIES.map((policy) => {
                  const href = `/policies/${policy.slug}`;
                  const isActive = pathname === href;
                  const Icon = policy.icon;

                  return (
                    <Link
                      key={policy.slug}
                      href={href}
                      className={`flex items-start justify-between p-2.5 rounded-lg text-xs font-mono transition-all ${
                        isActive
                          ? 'bg-black text-white font-bold shadow-xs'
                          : 'text-[#444444] hover:bg-[#F5F5F5] hover:text-black'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-[#FF4D00]' : 'text-[#888888]'
                          }`}
                        />
                        <span className="truncate">{policy.title}</span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ml-2 ${
                          isActive
                            ? 'bg-[#222222] text-[#E0E0E0]'
                            : 'bg-[#F0F0F0] text-[#777777]'
                        }`}
                      >
                        {policy.statute}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-[#F0F0F0] pt-4 mt-4 space-y-2 text-[11px] font-mono text-[#777777] leading-relaxed">
                <p>
                  <strong className="text-black">Corporate Entity:</strong>
                  <br />
                  GOATED NATION PRIVATE LIMITED
                </p>
                <p>
                  <strong className="text-black">CIN:</strong> U18109KA2026PTC184920
                </p>
                <p>
                  <strong className="text-black">Grievance Cell:</strong>
                  <br />
                  <a
                    href="mailto:grievance@goatednation.com"
                    className="text-[#FF4D00] hover:underline"
                  >
                    grievance@goatednation.com
                  </a>
                </p>
              </div>
            </div>
          </aside>

          {/* Legal Document Article Body */}
          <section className="lg:col-span-8 xl:col-span-9 bg-white border border-[#E5E5E5] rounded-xl p-6 sm:p-10 shadow-xs print:border-none print:shadow-none print:p-0">
            {children}
          </section>
        </div>
      </main>

      {/* Zenin Footer (Hidden during Print) */}
      <div className="print:hidden">
        <ZeninFooter />
      </div>
    </div>
  );
}
