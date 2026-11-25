import React from 'react';
import type { Metadata } from 'next';
import { Building2, ShieldAlert, Clock, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Statutory Grievance Redressal Mechanism | GOATED NATION',
  description: 'Official corporate disclosures and Grievance Officer details under Rule 4 & 5 of the Consumer Protection (E-Commerce) Rules 2020.',
};

export default function GrievanceRedressalPage() {
  return (
    <article className="prose prose-neutral max-w-none font-mono text-xs leading-relaxed space-y-6 text-[#333333]">
      {/* Header Banner */}
      <div className="border-b border-[#E5E5E5] pb-6 space-y-2">
        <div className="inline-flex items-center space-x-2 bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase border border-neutral-300">
          <Building2 className="w-3.5 h-3.5 text-black" />
          <span>Rule 4(4) & 5(3) Consumer Protection (E-Commerce) Rules 2020</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black m-0">
          Statutory Corporate Disclosures & Grievance Redressal
        </h1>
        <p className="text-[11px] text-[#777777] m-0">
          Published by GOATED NATION PRIVATE LIMITED in compliance with Indian E-Commerce and Intermediary Regulations.
        </p>
      </div>

      {/* 1. Corporate Disclosures */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>1. Mandatory Business Entity Particulars</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-[#E5E5E5] text-[11px]">
            <tbody>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold bg-[#F9F9F9] w-1/3">Corporate Legal Name</td>
                <td className="p-2 border border-[#E5E5E5] font-semibold text-black">GOATED NATION PRIVATE LIMITED</td>
              </tr>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold bg-[#F9F9F9]">Trade & Brand Name</td>
                <td className="p-2 border border-[#E5E5E5]">GOATED NATION // ZENIN STREETWEAR</td>
              </tr>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold bg-[#F9F9F9]">Corporate Identity Number (CIN)</td>
                <td className="p-2 border border-[#E5E5E5] font-mono">U18109KA2026PTC184920</td>
              </tr>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold bg-[#F9F9F9]">Goods & Services Tax (GSTIN)</td>
                <td className="p-2 border border-[#E5E5E5] font-mono">29AAACG8492P1ZF</td>
              </tr>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold bg-[#F9F9F9]">Registered Corporate Office</td>
                <td className="p-2 border border-[#E5E5E5]">
                  Logistics Hub, Phase 1, Outer Ring Road, Peenya Industrial Area, Bengaluru, Karnataka, 560054, India
                </td>
              </tr>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold bg-[#F9F9F9]">Customer Care Email</td>
                <td className="p-2 border border-[#E5E5E5]"><code>support@goatednation.com</code></td>
              </tr>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold bg-[#F9F9F9]">Customer Care Desk</td>
                <td className="p-2 border border-[#E5E5E5]">+91 99887 76655 (Mon–Sat, 10:00 AM – 7:00 PM IST)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Designated Grievance Officer */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>2. Designated Grievance Redressal Officer</span>
        </h2>
        <div className="p-4 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] space-y-2 text-[11px]">
          <p><strong>Officer Name:</strong> Jeevan M.</p>
          <p><strong>Designation:</strong> Head of Grievance Redressal & Consumer Affairs</p>
          <p><strong>Address:</strong> GOATED NATION Legal Division, Logistics Hub, Phase 1, Peenya Industrial Area, Bengaluru, Karnataka, 560054, India</p>
          <p>
            <strong>Dedicated Email:</strong>{' '}
            <a href="mailto:grievance@goatednation.com" className="text-[#FF4D00] font-bold underline">
              grievance@goatednation.com
            </a>
          </p>
          <p>
            <strong>Online Resolution Portal:</strong>{' '}
            <Link href="/support" className="text-black font-bold underline">
              https://goatednation.com/support
            </Link>
          </p>
        </div>
      </section>

      {/* 3. SLA Escalation Pipeline */}
      <section className="space-y-3 pt-4 border-t border-[#E5E5E5]">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>3. Statutory Grievance Escalation & Redressal SLAs</span>
        </h2>
        <div className="space-y-2">
          <div className="p-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded flex items-start space-x-3">
            <Clock className="w-4 h-4 text-black shrink-0 mt-0.5" />
            <div>
              <strong className="text-black block">Phase 1: Filing & Statutory Acknowledgment (T ≤ 48 Hours)</strong>
              <span className="text-[#666666]">
                Consumer logs dispute via <code>/support</code> or email. System issues a unique ticket tracking reference ID within 48 hours.
              </span>
            </div>
          </div>
          <div className="p-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded flex items-start space-x-3">
            <Clock className="w-4 h-4 text-black shrink-0 mt-0.5" />
            <div>
              <strong className="text-black block">Phase 2: Investigation & Audit (T ≤ 7 Business Days)</strong>
              <span className="text-[#666666]">
                Compliance desk reviews courier transit logs, CCTV packaging footage, or customer defect submissions.
              </span>
            </div>
          </div>
          <div className="p-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded flex items-start space-x-3">
            <Clock className="w-4 h-4 text-black shrink-0 mt-0.5" />
            <div>
              <strong className="text-black block">Phase 3: Formal Settlement (T ≤ 30 Calendar Days)</strong>
              <span className="text-[#666666]">
                Dispute resolved via garment exchange, full Razorpay refund execution, or formal statutory decision note.
              </span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-[#777777] pt-2">
          If you remain dissatisfied with the decision of our Grievance Officer, you have the right to submit your complaint to the <strong>National Consumer Helpline (NCH)</strong> at <code>consumerhelpline.gov.in</code> or toll-free at <code>1915</code>.
        </p>
      </section>
    </article>
  );
}
