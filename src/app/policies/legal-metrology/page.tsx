import React from 'react';
import type { Metadata } from 'next';
import { Scale, Tag, Package, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Legal Metrology Declarations | GOATED NATION',
  description: 'Statutory declarations under Legal Metrology Act 2009 and Packaged Commodities Rules 2011.',
};

export default function LegalMetrologyPage() {
  return (
    <article className="prose prose-neutral max-w-none font-mono text-xs leading-relaxed space-y-6 text-[#333333]">
      {/* Header Banner */}
      <div className="border-b border-[#E5E5E5] pb-6 space-y-2">
        <div className="inline-flex items-center space-x-2 bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase border border-neutral-300">
          <Scale className="w-3.5 h-3.5 text-black" />
          <span>Legal Metrology (Packaged Commodities) Rules, 2011 (Rule 6(10))</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black m-0">
          Legal Metrology Declarations & Packaging Registry
        </h1>
        <p className="text-[11px] text-[#777777] m-0">
          Statutory Declarations applicable to ready-made knitted apparel listed on <code>goatednation.com</code>.
        </p>
      </div>

      {/* Declarations Grid */}
      <section className="space-y-4">
        <div className="space-y-2">
          <div className="p-3.5 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA]">
            <span className="font-bold text-black block mb-0.5">1. Generic Name of Commodity</span>
            <p className="text-[11px] text-[#555555] m-0">
              Men&apos;s & Unisex Ready-Made Knitted Garment (Heavyweight French Terry Cotton Oversized T-Shirt / Hoodie / Bottom).
            </p>
          </div>

          <div className="p-3.5 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA]">
            <span className="font-bold text-black block mb-0.5">2. Net Quantity</span>
            <p className="text-[11px] text-[#555555] m-0">
              1 Piece (1 N).
            </p>
          </div>

          <div className="p-3.5 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA]">
            <span className="font-bold text-black block mb-0.5">3. Country of Origin</span>
            <p className="text-[11px] text-emerald-700 font-bold m-0">
              INDIA (Made in India // 100% Sourced, Knitted & Assembled in Bengaluru, Karnataka).
            </p>
          </div>

          <div className="p-3.5 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA]">
            <span className="font-bold text-black block mb-0.5">4. Manufacturer & Packer Particulars</span>
            <p className="text-[11px] text-[#555555] m-0">
              Manufactured and Packed by: <strong>GOATED NATION PRIVATE LIMITED</strong><br />
              Logistics Hub, Phase 1, Outer Ring Road, Peenya Industrial Area, Bengaluru, Karnataka, 560054, India.
            </p>
          </div>

          <div className="p-3.5 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA]">
            <span className="font-bold text-black block mb-0.5">5. Maximum Retail Price (MRP)</span>
            <p className="text-[11px] text-[#555555] m-0">
              Clearly indicated on each individual product card and garment physical price tag, <strong>inclusive of all taxes (CGST + SGST / IGST)</strong>.
            </p>
          </div>

          <div className="p-3.5 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA]">
            <span className="font-bold text-black block mb-0.5">6. Dimensions & Sizing Metric Specifications</span>
            <p className="text-[11px] text-[#555555] m-0">
              Garment chest width, body length, and shoulder drop dimensions are provided in both Centimeters (cm) and Inches (in) on every item page.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
