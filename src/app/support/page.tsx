'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  LifeBuoy,
  Truck,
  RotateCcw,
  AlertTriangle,
  CreditCard,
  Bug,
  Users,
  CheckCircle2,
  Upload,
  X,
  ArrowRight,
  Search,
  ChevronRight,
  ShieldAlert,
  Clock,
  Sparkles,
  MapPin,
  FileImage,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { ZeninAnnouncementBar } from '../../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../../components/zenin/ZeninHeader';
import { ZeninFooter } from '../../components/zenin/ZeninFooter';
import { TicketCategory } from '../../types/ticket';

const CATEGORIES: Array<{
  code: TicketCategory;
  title: string;
  jpTitle: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
}> = [
  {
    code: 'SIZE_EXCHANGE',
    title: 'Size & Fit Exchange',
    jpTitle: 'サイズ交換',
    desc: 'Swap for a larger/smaller silhouette. 1-click reverse pickup available.',
    icon: RotateCcw,
    badge: '1-CLICK PICKUP',
  },
  {
    code: 'ORDER_STATUS',
    title: 'Tracking & Courier Delay',
    jpTitle: '配送遅延',
    desc: 'Shipment milestone check, courier delay escalation, or AWB tracking.',
    icon: Truck,
    badge: 'INSTANT LOOKUP',
  },
  {
    code: 'DEFECT_DAMAGE',
    title: 'Defective Print / Fabric',
    jpTitle: '品質不良',
    desc: 'Flawed puff print, damaged stitching, or transit packaging distress.',
    icon: AlertTriangle,
    badge: 'PRIORITY QC',
  },
  {
    code: 'PAYMENT_ISSUE',
    title: 'Payment Debited / UPI',
    jpTitle: '決済照会',
    desc: 'Bank account debited via UPI/Card without instant order confirmation.',
    icon: CreditCard,
    badge: 'URGENT SLA',
  },
  {
    code: 'WEBSITE_BUG',
    title: 'Website Bug / Glitch',
    jpTitle: 'システム障害',
    desc: 'Checkout loop, cart error, or visual display anomaly on your device.',
    icon: Bug,
    badge: 'DEV TEAM',
  },
  {
    code: 'BULK_GENERAL',
    title: 'Bulk & General Inquiries',
    jpTitle: '卸売・その他',
    desc: 'Wholesale community drops, editorial collaborations, or general questions.',
    icon: Users,
    badge: 'COMMUNITY',
  },
];

function SupportPortalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // URL Query Params Context-Aware Pre-fill
  const paramOrderId = searchParams.get('orderId') || '';
  const paramCategory = (searchParams.get('category') as TicketCategory) || null;
  const paramItem = searchParams.get('item') || '';
  const paramCurrentSize = searchParams.get('currentSize') || 'L';

  // Smart Tracking Deflection State
  const [deflectInput, setDeflectInput] = useState(paramOrderId);
  const [deflectLoading, setDeflectLoading] = useState(false);
  const [deflectResult, setDeflectResult] = useState<{
    order?: any;
    tracking?: any;
  } | null>(null);
  const [deflectError, setDeflectError] = useState<string | null>(null);
  const [deflectDismissed, setDeflectDismissed] = useState(false);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory>(
    paramCategory || 'SIZE_EXCHANGE'
  );
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderId, setOrderId] = useState(paramOrderId);
  const [subject, setSubject] = useState(
    paramItem ? `Support Request for ${paramItem}` : ''
  );
  const [message, setMessage] = useState('');

  // Conditional Fields: Size Exchange
  const [exchangeItem, setExchangeItem] = useState(paramItem);
  const [currentSize, setCurrentSize] = useState(paramCurrentSize);
  const [desiredSize, setDesiredSize] = useState('XL');
  const [unwornTags, setUnwornTags] = useState(true);

  // Conditional Fields: Payment Issue
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  // Conditional Fields: Website Bug
  const [bugLocation, setBugLocation] = useState('Checkout');

  // Conditional Fields: Bulk
  const [bulkOrg, setBulkOrg] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState('50');

  // File Attachments (Cloudinary URLs)
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<{
    id: string;
    ticketNumber: string;
    token?: string;
  } | null>(null);

  // Auto-fill user credentials when loaded
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name || '');
      if (!customerEmail) setCustomerEmail(user.email || '');
    }
  }, [user]);

  // Handle Smart Tracking Deflection Lookup
  const handleDeflectCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!deflectInput.trim()) return;

    setDeflectLoading(true);
    setDeflectError(null);
    setDeflectResult(null);

    try {
      const res = await fetch(`/api/tickets/lookup?identifier=${encodeURIComponent(deflectInput.trim())}`);
      const data = await res.json();
      setDeflectLoading(false);

      if (data.success && data.data) {
        setDeflectResult(data.data);
      } else {
        setDeflectError(data.error || 'No active shipment found matching this identifier.');
      }
    } catch {
      setDeflectLoading(false);
      setDeflectError('Network error checking tracking.');
    }
  };

  // Handle Photo Upload Proof
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    setErrorMsg(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/tickets/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        if (data.success && data.url) {
          setAttachments((prev) => [...prev, data.url]);
        } else {
          setErrorMsg(data.error || 'Failed to upload photo proof.');
        }
      }
    } catch {
      setErrorMsg('Error uploading image file.');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim() || !customerEmail.trim() || !message.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (selectedCategory === 'DEFECT_DAMAGE' && attachments.length === 0) {
      setErrorMsg('Defective print / damaged fabric reports require at least one photo upload.');
      return;
    }

    // Auto-generate subject if empty
    const computedSubject =
      subject.trim() ||
      `${selectedCategory.replace(/_/g, ' ')} ${orderId ? `#${orderId}` : ''}`.trim();

    // Collect silent device telemetry
    const telemetry = {
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
      path: typeof window !== 'undefined' ? window.location.href : '',
    };

    setIsSubmitting(true);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
        orderId: orderId.trim() || undefined,
        category: selectedCategory,
        subject: computedSubject,
        initialMessage: message.trim(),
        attachments,
        telemetry,
        exchangeDetails:
          selectedCategory === 'SIZE_EXCHANGE'
            ? {
                selectedItemTitle: exchangeItem || undefined,
                currentSize,
                desiredSize,
                unwornTagsVerified: unwornTags,
              }
            : undefined,
        paymentDetails:
          selectedCategory === 'PAYMENT_ISSUE'
            ? {
                utrNumber: utrNumber.trim() || undefined,
                amount: paymentAmount ? Number(paymentAmount) : undefined,
              }
            : undefined,
      };

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      setIsSubmitting(false);

      if (data.success && data.ticket) {
        setCreatedTicket({
          id: data.ticket.id,
          ticketNumber: data.ticket.ticketNumber,
          token: data.token,
        });
      } else {
        setErrorMsg(data.error || 'Failed to submit support ticket.');
      }
    } catch {
      setIsSubmitting(false);
      setErrorMsg('Network error submitting request. Please check your connection.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFB] text-black">
      <ZeninAnnouncementBar />
      <ZeninHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Top Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-block px-3 py-1 bg-black text-white text-[10px] font-mono tracking-[0.25em] uppercase mb-3">
            SUPPORT GATEWAY // 顧客サポート
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase font-mono tracking-tight text-black">
            GOATED NATION SUPPORT DESK
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] font-mono mt-2 leading-relaxed">
            Direct access to our Tokyo logistics specialists, size exchange desk, and engineering queue. Average first response time: 4–12 hours.
          </p>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* SUCCESS STATE CARD (Once ticket is created)                       */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {createdTicket ? (
          <div className="bg-white border-2 border-black p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm font-mono">
            <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-6 h-6 text-[#22C55E]" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#22C55E] bg-green-50 border border-green-200 px-3 py-1">
              TICKET REGISTERED IN QUEUE
            </span>
            <h2 className="text-2xl font-black uppercase text-black mt-4 mb-2">
              {createdTicket.ticketNumber}
            </h2>
            <p className="text-xs text-[#666666] leading-relaxed mb-8">
              A confirmation dispatch has been routed to <strong>{customerEmail}</strong>. You can follow real-time courier actions, admin replies, or upload further photos on your live thread.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/support/${createdTicket.id}${createdTicket.token ? `?token=${createdTicket.token}` : ''}`}
                className="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-[#222222] transition-colors"
              >
                VIEW LIVE TICKET THREAD &rarr;
              </Link>
              <Link
                href="/settings"
                className="px-6 py-3 bg-[#F5F5F5] border border-[#D5D5D5] hover:border-black text-xs font-bold uppercase tracking-widest text-black"
              >
                RETURN TO SETTINGS
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* ───────────────────────────────────────────────────────────── */}
            {/* 1. SMART SELF-SERVICE TRACKING DEFLECTION CHECKER             */}
            {/* ───────────────────────────────────────────────────────────── */}
            {!deflectDismissed && (
              <div className="bg-white border-2 border-black p-6 sm:p-8 font-mono shadow-xs">
                <div className="flex items-center space-x-2 text-[10px] font-bold text-[#FF4D00] uppercase tracking-wider mb-2">
                  <Truck className="w-4 h-4" />
                  <span>SMART SELF-SERVICE CHECKER (SKIP THE QUEUE)</span>
                </div>
                <h2 className="text-base sm:text-lg font-black uppercase text-black mb-1">
                  WHERE IS MY SHIPMENT? // 即時追跡
                </h2>
                <p className="text-xs text-[#666666] mb-4">
                  Check live Blue Dart / Delhivery courier GPS milestones instantly before filing a ticket:
                </p>

                <form onSubmit={handleDeflectCheck} className="flex flex-col sm:flex-row gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Enter Order ID (e.g. GN-99014) or AWB Tracking Code"
                      value={deflectInput}
                      onChange={(e) => setDeflectInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#D0D0D0] text-xs font-mono outline-none focus:border-black uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={deflectLoading || !deflectInput.trim()}
                    className="px-6 py-2.5 bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-[#222222] disabled:opacity-50"
                  >
                    {deflectLoading ? 'SCANNING RADAR...' : 'CHECK RADAR &rarr;'}
                  </button>
                </form>

                {/* Deflection Error */}
                {deflectError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs mt-3">
                    {deflectError}
                  </div>
                )}

                {/* Deflection Live Card Result */}
                {deflectResult && (
                  <div className="mt-4 p-5 bg-[#FAFAFA] border border-[#000000] relative">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAEAEA] pb-3 mb-3">
                      <div>
                        <span className="text-[10px] text-[#888888] uppercase block">
                          CARRIER & TRACKING IDENTIFIER
                        </span>
                        <span className="text-sm font-bold text-black uppercase">
                          {deflectResult.tracking?.courierName || 'Shiprocket Express'} &bull;{' '}
                          {deflectResult.tracking?.awbCode || deflectInput}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#888888] uppercase block sm:text-right">
                          LIVE STATUS
                        </span>
                        <span className="text-xs font-black text-[#FF4D00] uppercase sm:text-right block">
                          {deflectResult.tracking?.currentStatus || 'IN_TRANSIT'}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-[#555555] space-y-1 mb-5">
                      <p>
                        <strong>Estimated Delivery:</strong>{' '}
                        {deflectResult.tracking?.estimatedDelivery || 'Within 24–48 Hours'}
                      </p>
                      {deflectResult.tracking?.scans?.[0] && (
                        <p className="flex items-start gap-1.5 text-[11px] text-[#444444]">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-black mt-0.5" />
                          <span>
                            <strong>Latest Milestone:</strong>{' '}
                            {deflectResult.tracking.scans[0].activity} ({deflectResult.tracking.scans[0].location})
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Deflection Satisfaction Buttons */}
                    <div className="pt-3 border-t border-[#EAEAEA] flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[11px] text-[#666666]">
                        Did this answer your courier inquiry?
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDeflectDismissed(true)}
                          className="px-3.5 py-1.5 bg-[#16A34A] text-white text-[11px] font-bold uppercase tracking-wider"
                        >
                          ✓ YES, ANSWERED MY QUESTION
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('ORDER_STATUS');
                            setOrderId(deflectInput);
                            setDeflectResult(null);
                          }}
                          className="px-3.5 py-1.5 bg-black text-white text-[11px] font-bold uppercase tracking-wider"
                        >
                          STILL NEED SUPPORT &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 2. SIX-CATEGORY SELECTOR                                      */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#888888] mb-4">
                STEP 1: SELECT YOUR SUPPORT CATEGORY
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.code;
                  return (
                    <button
                      key={cat.code}
                      type="button"
                      onClick={() => setSelectedCategory(cat.code)}
                      className={`p-5 text-left transition-all border-2 relative ${
                        isSelected
                          ? 'border-black bg-white shadow-xs'
                          : 'border-[#EAEAEA] bg-white hover:border-[#CCCCCC]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-8 h-8 rounded-none flex items-center justify-center ${
                            isSelected ? 'bg-black text-white' : 'bg-[#F5F5F5] text-[#555555]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-[#F5F5F5] text-[#666666]">
                          {cat.badge}
                        </span>
                      </div>
                      <h3 className="font-bold text-xs uppercase text-black">
                        {cat.title}
                      </h3>
                      <p className="text-[10px] text-[#777777] mt-1 line-clamp-2">
                        {cat.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 3. DYNAMIC INPUT FORM                                         */}
            {/* ───────────────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmitTicket} className="bg-white border-2 border-black p-6 sm:p-10 font-mono text-xs shadow-xs">
              <div className="border-b border-[#EEEEEE] pb-4 mb-6">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#FF4D00]">
                  STEP 2: CASE PARTICULARS // 詳細情報
                </span>
                <h3 className="text-base font-black uppercase text-black mt-1">
                  {CATEGORIES.find((c) => c.code === selectedCategory)?.title}
                </h3>
              </div>

              {errorMsg && (
                <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-6">
                {/* Customer Details Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase text-[#777777] tracking-wider block mb-1">
                      YOUR FULL NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Kenji Sato"
                      className="w-full px-3 py-2.5 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-[#777777] tracking-wider block mb-1">
                      EMAIL ADDRESS (FOR PROGRESS UPDATES) *
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="customer@email.com"
                      className="w-full px-3 py-2.5 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase text-[#777777] tracking-wider block mb-1">
                      CONTACT PHONE NUMBER
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2.5 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-[#777777] tracking-wider block mb-1">
                      ORDER ID / AWB (IF APPLICABLE)
                    </label>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="e.g. GN-99014"
                      className="w-full px-3 py-2.5 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black uppercase"
                    />
                  </div>
                </div>

                {/* ── CONDITIONAL: SIZE EXCHANGE ── */}
                {selectedCategory === 'SIZE_EXCHANGE' && (
                  <div className="p-4 bg-[#F8F8F8] border border-[#E0E0E0] space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-black block">
                      EXCHANGE SIZING SPECIFICATION:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase text-[#777777] block mb-1">
                          CURRENT GARMENT SIZE
                        </label>
                        <select
                          value={currentSize}
                          onChange={(e) => setCurrentSize(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black"
                        >
                          {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase text-[#777777] block mb-1">
                          DESIRED REPLACEMENT SIZE
                        </label>
                        <select
                          value={desiredSize}
                          onChange={(e) => setDesiredSize(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black font-bold text-[#FF4D00]"
                        >
                          {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <label className="flex items-center space-x-2.5 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={unwornTags}
                        onChange={(e) => setUnwornTags(e.target.checked)}
                        className="w-4 h-4 accent-black"
                      />
                      <span className="text-[11px] text-[#444444]">
                        I confirm the garment is unworn, unwashed, and original syndicate tags are intact.
                      </span>
                    </label>
                  </div>
                )}

                {/* ── CONDITIONAL: PAYMENT ISSUE ── */}
                {selectedCategory === 'PAYMENT_ISSUE' && (
                  <div className="p-4 bg-[#F8F8F8] border border-[#E0E0E0] space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-black block">
                      PAYMENT RECONCILIATION DETAILS:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase text-[#777777] block mb-1">
                          12-DIGIT UPI UTR NUMBER / RAZORPAY ID *
                        </label>
                        <input
                          type="text"
                          required
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          placeholder="e.g. 328491827491"
                          className="w-full px-3 py-2.5 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black font-bold uppercase"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase text-[#777777] block mb-1">
                          AMOUNT DEBITED (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="2499"
                          className="w-full px-3 py-2.5 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── CONDITIONAL: WEBSITE BUG ── */}
                {selectedCategory === 'WEBSITE_BUG' && (
                  <div className="p-4 bg-[#F8F8F8] border border-[#E0E0E0] space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-black block">
                      BUG TELEMETRY CAPTURE:
                    </span>
                    <div>
                      <label className="text-[10px] uppercase text-[#777777] block mb-1">
                        WHERE DID THE ISSUE OCCUR?
                      </label>
                      <select
                        value={bugLocation}
                        onChange={(e) => setBugLocation(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black"
                      >
                        <option value="Checkout">Checkout & Payment Step</option>
                        <option value="Cart">Shopping Bag Drawer</option>
                        <option value="Product">Product Page / Size Picker</option>
                        <option value="Login">Login & Authentication</option>
                        <option value="Other">Other Visual Anomaly</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-[#888888]">
                      Device telemetry (browser, screen dimensions, operating system) will be packaged silently to assist our engineering team.
                    </p>
                  </div>
                )}

                {/* ── CONDITIONAL: BULK ORDERS ── */}
                {selectedCategory === 'BULK_GENERAL' && (
                  <div className="p-4 bg-[#F8F8F8] border border-[#E0E0E0] grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase text-[#777777] block mb-1">
                        ORGANIZATION / COMMUNITY NAME
                      </label>
                      <input
                        type="text"
                        value={bulkOrg}
                        onChange={(e) => setBulkOrg(e.target.value)}
                        placeholder="Anime Club / Creator Collective"
                        className="w-full px-3 py-2.5 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-[#777777] block mb-1">
                        ESTIMATED QUANTITY (PIECES)
                      </label>
                      <input
                        type="number"
                        value={bulkQuantity}
                        onChange={(e) => setBulkQuantity(e.target.value)}
                        placeholder="50"
                        className="w-full px-3 py-2.5 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black"
                      />
                    </div>
                  </div>
                )}

                {/* Subject & Description */}
                <div>
                  <label className="text-[10px] uppercase text-[#777777] tracking-wider block mb-1">
                    SUBJECT // タイトル
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of your inquiry"
                    className="w-full px-3 py-2.5 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-[#777777] tracking-wider block mb-1">
                    DETAILED EXPLANATION *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide full context, delivery address corrections, or specific styling adjustments..."
                    className="w-full p-3 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black leading-relaxed"
                  />
                </div>

                {/* Photo Proof Upload Area */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase text-[#777777] tracking-wider block">
                      ATTACH PHOTO PROOFS (UP TO 3 IMAGES &bull; MAX 10MB)
                    </label>
                    <span className="text-[10px] text-[#888888]">
                      {attachments.length}/3 attached
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center">
                    {attachments.map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 border-2 border-black bg-white overflow-hidden group">
                        <img src={url} alt="Proof" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="absolute top-1 right-1 p-1 bg-black text-white hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {attachments.length < 3 && (
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFile}
                          className="w-20 h-20 border-2 border-dashed border-[#D0D0D0] hover:border-black bg-[#FAFAFA] flex flex-col items-center justify-center text-[10px] text-[#777777] hover:text-black transition-colors"
                        >
                          <Upload className="w-4 h-4 mb-1" />
                          <span>{uploadingFile ? 'UPLOADING...' : '+ PHOTO'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-[#EEEEEE]">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-black text-white font-bold text-xs uppercase tracking-widest hover:bg-[#222222] transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'DISPATCHING TICKET TO QUEUE...' : 'LOG SUPPORT TICKET &rarr;'}
                  </button>
                  <p className="text-[10px] text-center text-[#888888] mt-2">
                    Tickets are processed chronologically. Automated notifications will be sent to your registered email.
                  </p>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      <ZeninFooter />
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center font-mono text-xs">
        LOADING SUPPORT DESK...
      </div>
    }>
      <SupportPortalContent />
    </Suspense>
  );
}
