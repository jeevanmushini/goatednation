import React from 'react';
import type { Metadata } from 'next';
import { Truck, MapPin, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Shipping, Dispatch & Logistics Policy | GOATED NATION',
  description: 'Pan-India shipping coverage, courier SLAs, and NDR delivery protocols.',
};

export default function ShippingAndDeliveryPage() {
  return (
    <article className="prose prose-neutral max-w-none font-mono text-xs leading-relaxed space-y-6 text-[#333333]">
      {/* Header Banner */}
      <div className="border-b border-[#E5E5E5] pb-6 space-y-2">
        <div className="inline-flex items-center space-x-2 bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase border border-neutral-300">
          <Truck className="w-3.5 h-3.5 text-black" />
          <span>Express Courier Regulations & Logistics SLA</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black m-0">
          Shipping, Dispatch & Courier Logistics Policy
        </h1>
        <p className="text-[11px] text-[#777777] m-0">
          <strong>Fulfillment Hub:</strong> Peenya Industrial Area, Bengaluru, Karnataka, 560054<br />
          <strong>Logistics Infrastructure:</strong> Shiprocket API Integration with Delhivery, Blue Dart & DTDC
        </p>
      </div>

      {/* 1. Geographic Coverage */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>1. Pan-India Geographic Coverage (27,000+ PIN Codes)</span>
        </h2>
        <p>
          GOATED NATION services over <strong>27,000+ postal PIN codes</strong> covering all 28 States and 8 Union Territories across the Republic of India through premier air and surface carriers:
        </p>
        <p className="text-[#666666]">
          Carriers include: <strong>Delhivery Air/Surface, Blue Dart Express, DTDC, Xpressbees, and Shadowfax</strong>.
        </p>
      </section>

      {/* 2. Dispatch SLAs */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>2. Processing Timelines & Dispatch SLAs</span>
        </h2>
        <ul className="list-disc pl-5 space-y-1 text-[#444444]">
          <li><strong>Same-Day Cutoff:</strong> Orders confirmed prior to 2:00 PM IST on working business days are packed and manifested the same day.</li>
          <li><strong>Standard Dispatch SLA:</strong> Orders are handed to courier partners within <strong>24 to 48 business hours</strong>.</li>
          <li><strong>Capsule Releases:</strong> During heavy drop launches, dispatch may extend to 72 hours to ensure artisan packaging checks.</li>
          <li><strong>Sundays & Public Holidays:</strong> Courier sorting and hub pickups are paused on Sundays and gazetted holidays.</li>
        </ul>
      </section>

      {/* 3. Regional Delivery Transit Times */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>3. Regional Transit Timelines</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-[#E5E5E5] text-[11px]">
            <thead>
              <tr className="bg-[#F5F5F5] text-black">
                <th className="p-2 border border-[#E5E5E5]">Destination Zone</th>
                <th className="p-2 border border-[#E5E5E5]">Transit Mode</th>
                <th className="p-2 border border-[#E5E5E5]">Estimated Delivery</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold">Bengaluru & Karnataka</td>
                <td className="p-2 border border-[#E5E5E5]">Express Local Surface</td>
                <td className="p-2 border border-[#E5E5E5] font-semibold text-emerald-700">1 – 2 Business Days</td>
              </tr>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold">Tier-1 Metros (Mumbai, NCR, HYD, MAA, CCU, PNQ)</td>
                <td className="p-2 border border-[#E5E5E5]">Priority Air Cargo</td>
                <td className="p-2 border border-[#E5E5E5] font-semibold text-emerald-700">2 – 4 Business Days</td>
              </tr>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold">Tier-2 & Tier-3 Rest of India</td>
                <td className="p-2 border border-[#E5E5E5]">Express Surface Logistics</td>
                <td className="p-2 border border-[#E5E5E5]">4 – 6 Business Days</td>
              </tr>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold">North-East, J&K & Islands</td>
                <td className="p-2 border border-[#E5E5E5]">Dedicated Air Transit</td>
                <td className="p-2 border border-[#E5E5E5]">5 – 8 Business Days</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Tracking */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>4. Live Air Waybill (AWB) Tracking</span>
        </h2>
        <p>
          Upon courier handover, a live AWB tracking number is generated. Real-time notifications are dispatched via email across four milestone stages:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-bold">
          <div className="p-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded">1. MANIFESTED</div>
          <div className="p-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded">2. IN TRANSIT</div>
          <div className="p-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded">3. OUT FOR DELIVERY</div>
          <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">4. DELIVERED</div>
        </div>
      </section>

      {/* 5. NDR & Non-Delivery Protocol */}
      <section className="space-y-3 pt-4 border-t border-[#E5E5E5]">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>5. Non-Delivery Report (NDR) & RTO Protocol</span>
        </h2>
        <p>
          Couriers make up to <strong>3 delivery attempts</strong>. If delivery cannot be completed due to customer unavailability or incomplete address:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-[#444444]">
          <li>An automated NDR notification is triggered via email/SMS allowing you to update contact numbers, landmark directions, or reschedule delivery dates.</li>
          <li>In the event of package return to our Bangalore hub (Return To Origin / RTO), our support desk will contact you to arrange free re-dispatch.</li>
        </ul>
      </section>
    </article>
  );
}
