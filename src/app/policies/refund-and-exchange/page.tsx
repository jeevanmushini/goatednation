import React from 'react';
import type { Metadata } from 'next';
import { RotateCcw, Clock, CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Return, Sizing Exchange & Refund Policy | GOATED NATION',
  description: '7-Day Sizing Exchange and Refund SLA integrated with Shiprocket Express Returns.',
};

export default function RefundAndExchangePage() {
  return (
    <article className="prose prose-neutral max-w-none font-mono text-xs leading-relaxed space-y-6 text-[#333333]">
      {/* Header Banner */}
      <div className="border-b border-[#E5E5E5] pb-6 space-y-2">
        <div className="inline-flex items-center space-x-2 bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase border border-neutral-300">
          <RotateCcw className="w-3.5 h-3.5 text-black" />
          <span>Consumer Protection (E-Commerce) Rules 2020 (Rule 4(11) & Rule 6)</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black m-0">
          Return, Sizing Exchange & Refund Policy
        </h1>
        <p className="text-[11px] text-[#777777] m-0">
          <strong>Coverage:</strong> 7 Calendar Days from Courier Delivery &nbsp;|&nbsp; <strong>Partner:</strong> Shiprocket Express Returns<br />
          <strong>Support Desk:</strong> <Link href="/support" className="text-black font-bold underline">goatednation.com/support</Link>
        </p>
      </div>

      {/* 1. Fit Guarantee */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>1. Heavyweight Silhouette & Fit Guarantee</span>
        </h2>
        <p>
          GOATED NATION silhouettes feature boxy, oversized streetwear draping constructed from heavy French Terry cotton (280–420 GSM). We are dedicated to ensuring your piece fits flawlessly. We provide an automated <strong>7-Day Sizing Exchange & Return Protocol</strong> commencing from the moment your package is marked <code>DELIVERED</code> by our courier partner.
        </p>
      </section>

      {/* 2. Mandatory Eligibility Criteria */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>2. Mandatory Eligibility Criteria</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA]">
            <span className="font-bold text-black flex items-center space-x-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unworn & Odor-Free</span>
            </span>
            <p className="text-[11px] text-[#666666] m-0">
              Garments must be pristine, unwashed, and free of fragrance, perfume, or cosmetic stains.
            </p>
          </div>
          <div className="p-3 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA]">
            <span className="font-bold text-black flex items-center space-x-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Original Tags Attached</span>
            </span>
            <p className="text-[11px] text-[#666666] m-0">
              All barcode tags, hangtags, and frosted polybags must remain attached and undamaged.
            </p>
          </div>
          <div className="p-3 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA]">
            <span className="font-bold text-black flex items-center space-x-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>7-Day Window</span>
            </span>
            <p className="text-[11px] text-[#666666] m-0">
              Tickets must be initiated within 7 calendar days of delivery via <code>/support</code>.
            </p>
          </div>
          <div className="p-3 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA]">
            <span className="font-bold text-black flex items-center space-x-1.5 mb-1">
              <AlertOctagon className="w-3.5 h-3.5 text-red-500" />
              <span>Non-Returnable Items</span>
            </span>
            <p className="text-[11px] text-[#666666] m-0">
              For hygiene reasons, headwear, socks, and &quot;Final Archive&quot; items cannot be returned unless manufacturing distress is documented.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Exchange Workflow */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>3. Automated Shiprocket Sizing Exchange Protocol</span>
        </h2>
        <ol className="list-decimal pl-5 space-y-1.5 text-[#444444]">
          <li><strong>Initiate Request:</strong> Visit <Link href="/support" className="underline font-bold text-black">/support</Link> and select <strong>&quot;Sizing & Fit Exchange&quot;</strong>.</li>
          <li><strong>Select Replacement Size:</strong> Choose your desired size (<code>S</code>, <code>M</code>, <code>L</code>, <code>XL</code>, <code>XXL</code>).</li>
          <li><strong>Reverse Pickup:</strong> Our integration books an automated reverse pickup via Delhivery or Blue Dart. The courier agent arrives with a digital reverse AWB.</li>
          <li><strong>Dispatch of Exchange:</strong> Upon scan verification at our Bangalore facility, the exchange garment is immediately manifested with tracking.</li>
        </ol>
      </section>

      {/* 4. Transit Damage */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>4. Transit Damage & Manufacturing Distress</span>
        </h2>
        <p>
          If a parcel arrives damaged or exhibits fabric or stitching distress:
        </p>
        <p>
          Submit a ticket within <strong>48 hours</strong> with photographs attached. We guarantee a replacement or <strong>100% full refund</strong> with zero reverse shipping deductions.
        </p>
      </section>

      {/* 5. Timelines */}
      <section className="space-y-3 pt-4 border-t border-[#E5E5E5]">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>5. Refund Execution & Bank Settlement Timelines</span>
        </h2>
        <p>
          Refunds are authorized immediately upon return inspection approval (within 24 hours) via <strong>Razorpay</strong>:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-[#E5E5E5] text-[11px]">
            <thead>
              <tr className="bg-[#F5F5F5] text-black">
                <th className="p-2 border border-[#E5E5E5]">Payment Mode</th>
                <th className="p-2 border border-[#E5E5E5]">Settlement Window</th>
                <th className="p-2 border border-[#E5E5E5]">Proof Provided</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold">UPI (GPay / PhonePe / Paytm)</td>
                <td className="p-2 border border-[#E5E5E5]">24 to 48 Hours</td>
                <td className="p-2 border border-[#E5E5E5]">Razorpay Refund ARN / UTR</td>
              </tr>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold">NetBanking / Debit Cards</td>
                <td className="p-2 border border-[#E5E5E5]">3 to 5 Business Days</td>
                <td className="p-2 border border-[#E5E5E5]">Bank Reference Number</td>
              </tr>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold">Credit Cards</td>
                <td className="p-2 border border-[#E5E5E5]">5 to 7 Business Days</td>
                <td className="p-2 border border-[#E5E5E5]">Card Reversal Transaction Note</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}
