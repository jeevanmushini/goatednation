import React from 'react';
import type { Metadata } from 'next';
import { ShieldCheck, Lock, Database, UserCheck, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy & DPDP Act Notice | GOATED NATION',
  description: 'Statutory Data Protection Notice in compliance with the Digital Personal Data Protection Act, 2023 (Republic of India).',
};

export default function PrivacyPolicyPage() {
  return (
    <article className="prose prose-neutral max-w-none font-mono text-xs leading-relaxed space-y-6 text-[#333333]">
      {/* Header Banner */}
      <div className="border-b border-[#E5E5E5] pb-6 space-y-2">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>DPDP Act 2023 Statutory Compliance</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black m-0">
          Privacy Policy & Data Protection Notice
        </h1>
        <p className="text-[11px] text-[#777777] m-0">
          <strong>Effective Date:</strong> January 1, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> November 25, 2026<br />
          <strong>Entity:</strong> GOATED NATION PRIVATE LIMITED (CIN: U18109KA2026PTC184920)
        </p>
      </div>

      {/* 1. Introduction & Scope */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>1. Introduction & Statutory Scope</span>
        </h2>
        <p>
          GOATED NATION PRIVATE LIMITED (hereinafter &quot;GOATED NATION&quot;, &quot;We&quot;, &quot;Us&quot;, or &quot;The Syndicate&quot;) is committed to protecting the privacy, confidentiality, and security of our customers (&quot;Data Principals&quot;). This Privacy Notice is published in compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, Section 43A of the Information Technology Act, 2000, and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
        </p>
        <p>
          This document explains how we collect, process, store, transfer, and protect your digital personal data when you access <code>goatednation.com</code>, acquire limited capsule drops, or communicate with our support desk.
        </p>
      </section>

      {/* 2. Categories of Personal Data Collected */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>2. Categories of Personal Data Collected</span>
        </h2>
        <p>
          In accordance with the principle of <strong>Data Minimization</strong>, we collect only the information strictly necessary to execute e-commerce contracts:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
          <div className="p-3.5 rounded-lg border border-[#EBEBEB] bg-[#FAFAFA]">
            <span className="font-bold text-black block mb-1">A. Identity & Contact Records</span>
            <p className="text-[11px] text-[#666666] m-0">
              Full Legal Name, Email Address, and Mobile Contact Number utilized for OTP authentication and courier delivery verification.
            </p>
          </div>
          <div className="p-3.5 rounded-lg border border-[#EBEBEB] bg-[#FAFAFA]">
            <span className="font-bold text-black block mb-1">B. Logistics & Physical Address</span>
            <p className="text-[11px] text-[#666666] m-0">
              Street Address, Apartment/Suite, Landmark, City, State, and Postal PIN Code (shared exclusively with Shiprocket for order transit).
            </p>
          </div>
          <div className="p-3.5 rounded-lg border border-[#EBEBEB] bg-[#FAFAFA]">
            <span className="font-bold text-black block mb-1">C. Transaction Metadata</span>
            <p className="text-[11px] text-[#666666] m-0">
              Razorpay Order IDs, Payment IDs, and chosen payment method (UPI, Card, NetBanking).
            </p>
          </div>
          <div className="p-3.5 rounded-lg border border-[#EBEBEB] bg-[#FAFAFA]">
            <span className="font-bold text-black block mb-1">D. Technical Telemetry</span>
            <p className="text-[11px] text-[#666666] m-0">
              IP address, browser user-agent, session identifiers, and fraud prevention cookies.
            </p>
          </div>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <span>
            <strong>Zero Card Data Retention:</strong> GOATED NATION never collects or stores 16-digit debit/credit card numbers, CVVs, or NetBanking credentials. All electronic payments are processed directly by RBI-authorized Payment Aggregators (Razorpay) adhering to PCI-DSS Level 1 tokenization standards.
          </span>
        </div>
      </section>

      {/* 3. Lawful Purpose */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>3. Lawful Basis & Purposes of Data Processing</span>
        </h2>
        <p>
          Under Sections 4, 5, and 6 of the DPDP Act 2023, personal data is processed solely for lawful purposes backed by affirmative consent:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-[#444444]">
          <li><strong>Contractual Order Fulfillment:</strong> Manifesting shipping orders, assigning couriers, and generating statutory GST tax invoices.</li>
          <li><strong>Transactional Notifications:</strong> Automated email delivery of order confirmations, tracking milestones, OTP password resets, and refund receipts via Resend.</li>
          <li><strong>Customer Dispute Resolution:</strong> Reviewing sizing exchange requests, verifying transit defects, and executing Razorpay refunds.</li>
          <li><strong>Statutory Compliance:</strong> Adhering to the Central GST Act 2017, Prevention of Money Laundering Act, and Consumer Protection Rules 2020.</li>
        </ul>
      </section>

      {/* 4. Sub-Processors */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>4. Verified Sub-Processors & Data Transfers</span>
        </h2>
        <p>
          We do not sell, rent, or monetize your personal data. Disclosures occur solely on a need-to-know basis with audited partners:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-[#E5E5E5] text-[11px]">
            <thead>
              <tr className="bg-[#F5F5F5] text-black">
                <th className="p-2 border border-[#E5E5E5]">Partner / Service</th>
                <th className="p-2 border border-[#E5E5E5]">Role</th>
                <th className="p-2 border border-[#E5E5E5]">Data Transferred</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold">Shiprocket (BigFoot Retail)</td>
                <td className="p-2 border border-[#E5E5E5]">Logistics Aggregator</td>
                <td className="p-2 border border-[#E5E5E5]">Customer Name, Delivery Address, Mobile Phone</td>
              </tr>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold">Razorpay Software Pvt Ltd</td>
                <td className="p-2 border border-[#E5E5E5]">Payment Aggregator</td>
                <td className="p-2 border border-[#E5E5E5]">Order Total, Customer Email, Billing ID</td>
              </tr>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold">Neon PostgreSQL / Aiven</td>
                <td className="p-2 border border-[#E5E5E5]">Encrypted Cloud Persistence</td>
                <td className="p-2 border border-[#E5E5E5]">Hashed Passwords, Profile Metadata, Order Logs</td>
              </tr>
              <tr>
                <td className="p-2 border border-[#E5E5E5] font-bold">Resend Inc.</td>
                <td className="p-2 border border-[#E5E5E5]">Transactional Mailer</td>
                <td className="p-2 border border-[#E5E5E5]">Customer Email, Name, Order Number, OTP</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Rights of the Data Principal */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>5. Statutory Rights of the Data Principal (DPDP Act 2023)</span>
        </h2>
        <p>You possess enforceable legal rights regarding your digital information:</p>
        <div className="space-y-2">
          <div className="p-3 rounded border border-[#EAEAEA] bg-[#FAFAFA]">
            <strong className="text-black block">1. Right to Access & Summary</strong>
            <span className="text-[#666666]">Review your account records, orders, and tickets anytime via <code>/settings</code>.</span>
          </div>
          <div className="p-3 rounded border border-[#EAEAEA] bg-[#FAFAFA]">
            <strong className="text-black block">2. Right to Correction & Erasure</strong>
            <span className="text-[#666666]">Request updating of inaccurate details or account deletion, subject to statutory 7-year GST audit retention rules.</span>
          </div>
          <div className="p-3 rounded border border-[#EAEAEA] bg-[#FAFAFA]">
            <strong className="text-black block">3. Right to Grievance Redressal</strong>
            <span className="text-[#666666]">Register disputes with our designated Grievance Officer, with escalation rights to the <strong>Data Protection Board of India (DPBI)</strong>.</span>
          </div>
          <div className="p-3 rounded border border-[#EAEAEA] bg-[#FAFAFA]">
            <strong className="text-black block">4. Right to Nominate</strong>
            <span className="text-[#666666]">Designate a representative to exercise rights on your behalf in the event of death or incapacity.</span>
          </div>
        </div>
      </section>

      {/* 6. Statutory Grievance Redressal Officer */}
      <section className="space-y-3 pt-4 border-t border-[#E5E5E5]">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2 border-b border-[#F0F0F0] pb-1.5">
          <span>6. Statutory Grievance Redressal Officer</span>
        </h2>
        <div className="p-4 rounded-lg bg-[#F9F9F9] border border-[#E5E5E5] space-y-1.5 text-[11px]">
          <p><strong>Officer Name:</strong> Jeevan M.</p>
          <p><strong>Designation:</strong> Head of Legal & Data Protection</p>
          <p><strong>Corporate Entity:</strong> GOATED NATION PRIVATE LIMITED</p>
          <p><strong>Registered Address:</strong> Logistics Hub, Phase 1, Outer Ring Road, Peenya Industrial Area, Bengaluru, Karnataka, 560054, India</p>
          <p><strong>Email:</strong> <a href="mailto:grievance@goatednation.com" className="text-[#FF4D00] font-bold underline">grievance@goatednation.com</a></p>
          <p className="text-[#888888] pt-1">
            <em>Statutory SLA: Acknowledgment within 48 hours; Redressal within 30 days under Rule 3(2) of the IT Rules 2021.</em>
          </p>
        </div>
      </section>
    </article>
  );
}
