'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Shield,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  LifeBuoy,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  Bell,
  ArrowRight,
  ExternalLink,
  FileText,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { ZeninAnnouncementBar } from '../../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../../components/zenin/ZeninHeader';
import { ZeninFooter } from '../../components/zenin/ZeninFooter';

interface UserOrder {
  id: string;
  userEmail: string;
  status: string;
  awbCode?: string;
  items: Array<{
    title?: string;
    name?: string;
    price?: number;
    selling_price?: number;
    quantity?: number;
    units?: number;
    size?: string;
    color?: string;
    image?: string;
  }>;
  shippingAddress: {
    customerName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  totalAmount: number;
  createdAt: string;
}

interface UserTicket {
  id: string;
  ticketNumber: string;
  category: string;
  status: string;
  priority: string;
  subject: string;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

function SettingsContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'tickets' | 'profile' | 'security' | 'preferences'>('orders');
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Security password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // NDR quick reattempt state
  const [ndrAlert, setNdrAlert] = useState(false);
  const [ndrPhone, setNdrPhone] = useState('');
  const [ndrLandmark, setNdrLandmark] = useState('');
  const [ndrSuccess, setNdrSuccess] = useState(false);
  const [ndrSubmitting, setNdrSubmitting] = useState(false);

  // Drop preferences
  const [prefDropAlerts, setPrefDropAlerts] = useState(true);
  const [prefLogisticsSms, setPrefLogisticsSms] = useState(true);
  const [prefEditorialDigest, setPrefEditorialDigest] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/settings');
    }
  }, [isLoading, isAuthenticated, router]);

  // Load User Orders
  useEffect(() => {
    if (user?.email) {
      setLoadingOrders(true);
      fetch(`/api/user/orders?email=${encodeURIComponent(user.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.orders)) {
            setOrders(data.orders);
            // Check if any order is flagged with NDR
            const hasNdr = data.orders.some((o: UserOrder) => o.status === 'NDR' || o.status === 'UNDELIVERED');
            if (hasNdr) setNdrAlert(true);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingOrders(false));

      // Load User Tickets
      setLoadingTickets(true);
      fetch(`/api/tickets?email=${encodeURIComponent(user.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.tickets)) {
            setTickets(data.tickets);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingTickets(false));
    }
  }, [user]);

  // Separate active in-flight vs delivered orders
  const activeOrders = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  );
  const pastOrders = orders.filter(
    (o) => o.status === 'DELIVERED' || o.status === 'CANCELLED'
  );

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8 || !/[0-9]/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) {
      setPasswordMsg({
        type: 'error',
        text: 'New password must be at least 8 characters and include both letters and numbers.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          newPassword,
          otp: 'DIRECT',
        }),
      });
      const data = await res.json();
      setSavingPassword(false);

      if (data.success) {
        setPasswordMsg({ type: 'success', text: 'Security credentials updated successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: data.error || 'Failed to update credentials.' });
      }
    } catch {
      setSavingPassword(false);
      setPasswordMsg({ type: 'error', text: 'Network communication failed.' });
    }
  };

  const handleNdrSubmit = async (awbCode: string) => {
    if (!ndrPhone.trim()) return;
    setNdrSubmitting(true);
    try {
      const res = await fetch('/api/shipping/ndr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          awbCode,
          action: 'reattempt',
          phone: ndrPhone,
          instructions: ndrLandmark,
        }),
      });
      const data = await res.json();
      setNdrSubmitting(false);
      if (data.success) {
        setNdrSuccess(true);
      }
    } catch {
      setNdrSubmitting(false);
    }
  };

  if (isLoading || (!isAuthenticated && typeof window !== 'undefined')) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center font-mono">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest text-[#666666]">
            LOADING ARCHIVE CLEARANCE...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFB] text-black">
      <ZeninAnnouncementBar />
      <ZeninHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Top Header & Breadcrumb */}
        <div className="mb-8 border-b border-[#EAEAEA] pb-6">
          <div className="flex items-center space-x-2 text-[10px] font-mono text-[#888888] uppercase tracking-widest mb-2">
            <Link href="/" className="hover:text-black transition-colors">
              HOME
            </Link>
            <span>/</span>
            <span className="text-black font-bold">MEMBER SETTINGS & ORDERS</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold uppercase font-mono tracking-tight text-black flex items-center gap-3">
                <span>ACCOUNT ARCHIVE</span>
                <span className="text-[10px] font-mono tracking-[0.2em] font-normal px-2.5 py-1 bg-black text-white rounded-none">
                  // {user?.role || 'CUSTOMER'}
                </span>
              </h1>
              <p className="text-xs text-[#666666] font-mono mt-1">
                Manage your active in-flight drops, past orders, and support tickets.
              </p>
            </div>

            <Link
              href="/support"
              className="inline-flex items-center justify-center space-x-2 bg-black text-white px-5 py-2.5 text-xs font-mono font-bold tracking-widest uppercase hover:bg-[#222222] transition-colors"
            >
              <LifeBuoy className="w-4 h-4 text-[#FF4D00]" />
              <span>OPEN SUPPORT DESK</span>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#EAEAEA] pb-4 mb-8 font-mono text-xs">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 uppercase font-bold tracking-wider transition-colors flex items-center space-x-2 ${
              activeTab === 'orders'
                ? 'bg-black text-white'
                : 'bg-white text-[#555555] border border-[#EAEAEA] hover:border-black'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Orders & Drops ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 uppercase font-bold tracking-wider transition-colors flex items-center space-x-2 ${
              activeTab === 'tickets'
                ? 'bg-black text-white'
                : 'bg-white text-[#555555] border border-[#EAEAEA] hover:border-black'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Support Tickets ({tickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 uppercase font-bold tracking-wider transition-colors flex items-center space-x-2 ${
              activeTab === 'profile'
                ? 'bg-black text-white'
                : 'bg-white text-[#555555] border border-[#EAEAEA] hover:border-black'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Clearance</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 uppercase font-bold tracking-wider transition-colors flex items-center space-x-2 ${
              activeTab === 'security'
                ? 'bg-black text-white'
                : 'bg-white text-[#555555] border border-[#EAEAEA] hover:border-black'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 uppercase font-bold tracking-wider transition-colors flex items-center space-x-2 ${
              activeTab === 'preferences'
                ? 'bg-black text-white'
                : 'bg-white text-[#555555] border border-[#EAEAEA] hover:border-black'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Drop Alerts</span>
          </button>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* TAB 1: ORDERS & IN-FLIGHT DROPS                                   */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="space-y-10">
            {/* 1. In-Flight Live Hero Orders */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-black flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#FF4D00] rounded-full animate-pulse" />
                  <span>ACTIVE IN-FLIGHT DROPS (LOGISTICS RADAR)</span>
                </h2>
                <span className="text-[11px] font-mono text-[#777777]">
                  {activeOrders.length} active shipment{activeOrders.length === 1 ? '' : 's'}
                </span>
              </div>

              {loadingOrders ? (
                <div className="p-12 text-center bg-white border border-[#EAEAEA] font-mono text-xs text-[#888888]">
                  CONNECTING TO LOGISTICS RADAR...
                </div>
              ) : activeOrders.length === 0 ? (
                <div className="bg-white border border-[#EAEAEA] p-8 text-center font-mono">
                  <p className="text-xs text-[#777777] uppercase tracking-wider mb-3">
                    NO SHIPMENTS CURRENTLY IN TRANSIT
                  </p>
                  <Link
                    href="/collections"
                    className="inline-block bg-black text-white px-5 py-2.5 text-xs uppercase font-bold tracking-widest hover:bg-[#222222]"
                  >
                    EXPLORE NEW DROPS &rarr;
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeOrders.map((order) => {
                    const statusStr = (order.status || 'CONFIRMED').toUpperCase();
                    // 5-Stage Stepper calculation
                    const stages = ['ORDER CONFIRMED', 'PACKED', 'IN TRANSIT', 'OUT FOR DELIVERY', 'DELIVERED'];
                    let currentStageIndex = 0;
                    if (statusStr.includes('DELIVERED')) currentStageIndex = 4;
                    else if (statusStr.includes('OUT') || statusStr.includes('DELIVERY')) currentStageIndex = 3;
                    else if (statusStr.includes('TRANSIT') || statusStr.includes('SHIPPED')) currentStageIndex = 2;
                    else if (statusStr.includes('PACK') || statusStr.includes('CONFIRMED')) currentStageIndex = 1;

                    return (
                      <div
                        key={order.id}
                        className="bg-white border-2 border-black p-6 sm:p-8 shadow-xs relative overflow-hidden"
                      >
                        {/* Top bar info */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EEEEEE] pb-5 mb-6">
                          <div>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-mono font-black text-black">
                                #{order.id}
                              </span>
                              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 bg-black text-white">
                                {statusStr}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-[#888888] mt-1">
                              Ordered on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>

                          <div className="flex items-center space-x-3 font-mono text-xs">
                            {order.awbCode && (
                              <Link
                                href={`/track?awb=${order.awbCode}`}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#F5F5F5] border border-[#D5D5D5] hover:border-black font-bold text-black"
                              >
                                <Truck className="w-3.5 h-3.5 text-[#FF4D00]" />
                                <span>AWB: {order.awbCode}</span>
                              </Link>
                            )}
                            <Link
                              href={`/support?orderId=${encodeURIComponent(order.id)}`}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-black text-white font-bold hover:bg-[#333333]"
                            >
                              <LifeBuoy className="w-3.5 h-3.5" />
                              <span>NEED HELP WITH THIS ORDER</span>
                            </Link>
                          </div>
                        </div>

                        {/* 5-Stage Stepper Bar */}
                        <div className="mb-8">
                          <div className="grid grid-cols-5 gap-2 relative">
                            {stages.map((stg, idx) => {
                              const isCompleted = idx <= currentStageIndex;
                              const isCurrent = idx === currentStageIndex;
                              return (
                                <div key={stg} className="text-center relative">
                                  <div
                                    className={`h-1.5 w-full mb-2 ${
                                      isCompleted ? 'bg-black' : 'bg-[#E5E5E5]'
                                    }`}
                                  />
                                  <div className="flex items-center justify-center mb-1">
                                    <div
                                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                                        isCompleted
                                          ? 'bg-black text-white'
                                          : 'bg-[#EEEEEE] text-[#999999]'
                                      } ${isCurrent ? 'ring-2 ring-[#FF4D00]' : ''}`}
                                    >
                                      {idx + 1}
                                    </div>
                                  </div>
                                  <span
                                    className={`text-[9px] sm:text-[10px] font-mono uppercase tracking-wider block ${
                                      isCurrent
                                        ? 'text-[#FF4D00] font-bold'
                                        : isCompleted
                                        ? 'text-black font-medium'
                                        : 'text-[#999999]'
                                    }`}
                                  >
                                    {stg}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* NDR Warning Banner (If Courier failed delivery attempt) */}
                        {ndrAlert && (
                          <div className="mb-6 bg-[#FFFBEB] border-2 border-[#F59E0B] p-4 sm:p-5 rounded-none font-mono">
                            <div className="flex items-start space-x-3">
                              <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                                  ACTION REQUIRED: COURIER REPORTED RECIPIENT NOT REACHABLE
                                </h4>
                                <p className="text-[11px] text-[#555555] mt-1 leading-relaxed">
                                  Blue Dart / Delhivery attempted delivery today but could not reach you. Verify your contact phone and nearby landmark below to force an immediate courier re-attempt tomorrow:
                                </p>

                                {ndrSuccess ? (
                                  <div className="mt-3 p-2.5 bg-[#ECFDF5] border border-[#10B981] text-[#065F46] text-xs font-bold flex items-center space-x-2">
                                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                                    <span>COURIER RE-ATTEMPT SCHEDULED FOR TOMORROW // BLUE DART NOTIFIED</span>
                                  </div>
                                ) : (
                                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <input
                                      type="tel"
                                      placeholder="Confirm Active Phone Number"
                                      value={ndrPhone}
                                      onChange={(e) => setNdrPhone(e.target.value)}
                                      className="px-3 py-2 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Nearby Landmark / Delivery Instructions"
                                      value={ndrLandmark}
                                      onChange={(e) => setNdrLandmark(e.target.value)}
                                      className="px-3 py-2 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black"
                                    />
                                    <button
                                      onClick={() => handleNdrSubmit(order.awbCode || order.id)}
                                      disabled={ndrSubmitting || !ndrPhone.trim()}
                                      className="px-4 py-2 bg-[#F59E0B] text-black font-bold uppercase text-xs tracking-wider hover:bg-[#D97706] disabled:opacity-50"
                                    >
                                      {ndrSubmitting ? 'SCHEDULING...' : 'RE-ATTEMPT DELIVERY &rarr;'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Itemized Garment List */}
                        <div className="divide-y divide-[#F0F0F0]">
                          {(order.items || []).map((item, itemIdx) => {
                            const title = item.title || item.name || 'Syndicate Garment';
                            const price = item.price || item.selling_price || 0;
                            const qty = item.quantity || item.units || 1;
                            return (
                              <div
                                key={itemIdx}
                                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs"
                              >
                                <div>
                                  <span className="font-bold text-black uppercase">
                                    {title}
                                  </span>
                                  <div className="text-[11px] text-[#777777] mt-0.5 space-x-2">
                                    {item.size && <span>SIZE: <strong>{item.size}</strong></span>}
                                    {item.color && <span>&bull; COLOR: <strong>{item.color}</strong></span>}
                                    <span>&bull; QTY: <strong>{qty}</strong></span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                  <span className="font-bold text-black">
                                    ₹{price * qty}
                                  </span>
                                  <Link
                                    href={`/support?category=SIZE_EXCHANGE&orderId=${encodeURIComponent(order.id)}&item=${encodeURIComponent(title)}&currentSize=${encodeURIComponent(item.size || 'L')}`}
                                    className="text-[10px] uppercase font-bold text-[#FF4D00] hover:underline"
                                  >
                                    [ SWAP SIZE / EXCHANGE ]
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Past Delivered Archive */}
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-black mb-4">
                PAST DELIVERED ARCHIVE
              </h2>

              {pastOrders.length === 0 ? (
                <div className="bg-white border border-[#EAEAEA] p-6 text-center font-mono text-xs text-[#888888]">
                  NO COMPLETED ORDERS IN ARCHIVE
                </div>
              ) : (
                <div className="bg-white border border-[#EAEAEA] divide-y divide-[#EAEAEA]">
                  {pastOrders.map((order) => (
                    <div key={order.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-black">#{order.id}</span>
                          <span className="text-[9px] uppercase px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 font-bold">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#777777] mt-1">
                          Delivered &bull; Total: ₹{order.totalAmount}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/support?category=SIZE_EXCHANGE&orderId=${encodeURIComponent(order.id)}`}
                          className="px-3 py-1.5 bg-[#F5F5F5] border border-[#D5D5D5] hover:border-black text-[11px] font-bold text-black uppercase"
                        >
                          Request Size Exchange
                        </Link>
                        <Link
                          href={`/support?category=DEFECT_DAMAGE&orderId=${encodeURIComponent(order.id)}`}
                          className="px-3 py-1.5 bg-white border border-[#D5D5D5] hover:border-black text-[11px] font-bold text-[#555555] uppercase"
                        >
                          Report Defect
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* TAB 2: SUPPORT TICKETS CENTER                                     */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-black">
                  ACTIVE SUPPORT CASES & THREADS
                </h2>
                <p className="text-xs font-mono text-[#777777] mt-0.5">
                  Track ongoing inquiries, sizing exchanges, and resolution progress.
                </p>
              </div>

              <Link
                href="/support"
                className="px-4 py-2 bg-black text-white text-xs font-mono font-bold uppercase tracking-widest hover:bg-[#222222]"
              >
                + NEW TICKET
              </Link>
            </div>

            {loadingTickets ? (
              <div className="p-12 text-center bg-white border border-[#EAEAEA] font-mono text-xs text-[#888888]">
                LOADING SUPPORT THREADS...
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-white border border-[#EAEAEA] p-10 text-center font-mono">
                <p className="text-xs text-[#777777] uppercase tracking-wider mb-3">
                  YOU HAVE NO ACTIVE SUPPORT TICKETS
                </p>
                <Link
                  href="/support"
                  className="inline-block bg-black text-white px-5 py-2.5 text-xs uppercase font-bold tracking-widest hover:bg-[#222222]"
                >
                  LOG A REQUEST &rarr;
                </Link>
              </div>
            ) : (
              <div className="bg-white border border-[#EAEAEA] divide-y divide-[#EAEAEA]">
                {tickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/support/${t.id}`}
                    className="p-5 sm:p-6 block hover:bg-[#FAFAFA] transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                      <div>
                        <div className="flex items-center space-x-2.5 mb-1.5">
                          <span className="font-bold text-black text-sm">
                            {t.ticketNumber}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase px-2.5 py-0.5 border ${
                              t.status === 'RESOLVED'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : t.status === 'IN_PROGRESS'
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : t.status === 'WAITING_CUSTOMER'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {t.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-[#888888]">
                            // {t.category.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h3 className="font-bold text-black text-sm">{t.subject}</h3>
                        <p className="text-[11px] text-[#777777] mt-1">
                          Created {new Date(t.createdAt).toLocaleDateString('en-IN')} &bull; Updated {new Date(t.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 text-black font-bold uppercase text-xs">
                        <span>VIEW LIVE THREAD</span>
                        <ChevronRight className="w-4 h-4 text-[#FF4D00]" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* TAB 3: MEMBER PROFILE & CLEARANCE                                 */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-[#EAEAEA] p-6 sm:p-8 max-w-2xl font-mono text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-black mb-6 border-b border-[#EEEEEE] pb-3">
              MEMBER DOSSIER & CLEARANCE
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase text-[#888888] tracking-wider block mb-1">
                  FULL NAME
                </label>
                <div className="p-3 bg-[#F8F8F8] border border-[#E5E5E5] font-bold text-black">
                  {user?.name || 'MEMBER'}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-[#888888] tracking-wider block mb-1">
                  REGISTERED EMAIL
                </label>
                <div className="p-3 bg-[#F8F8F8] border border-[#E5E5E5] font-bold text-black">
                  {user?.email}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-[#888888] tracking-wider block mb-1">
                  SECURITY CLEARANCE LEVEL
                </label>
                <div className="p-3 bg-[#F8F8F8] border border-[#E5E5E5] flex items-center justify-between font-bold">
                  <span>{user?.role === 'ADMIN' ? 'SYNDICATE ADMINISTRATOR (LVL 5)' : 'SYNDICATE COLLECTOR (STANDARD)'}</span>
                  <span className="text-[10px] uppercase px-2 py-0.5 bg-black text-white">
                    {user?.role}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-[#888888] tracking-wider block mb-1">
                  AUTHENTICATION PROVIDER
                </label>
                <div className="p-3 bg-[#F8F8F8] border border-[#E5E5E5] text-black">
                  {user?.provider === 'google' ? 'Google OAuth 2.0 Identity Gateway' : 'Encrypted Credentials Protocol'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* TAB 4: SECURITY & CREDENTIALS                                     */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="bg-white border border-[#EAEAEA] p-6 sm:p-8 max-w-xl font-mono text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-black mb-6 border-b border-[#EEEEEE] pb-3">
              SECURITY CREDENTIALS MANAGEMENT
            </h2>

            {passwordMsg && (
              <div
                className={`p-3 mb-6 border text-xs font-mono ${
                  passwordMsg.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase text-[#888888] tracking-wider block mb-1">
                  NEW PASSWORD (MIN 8 CHARS, LETTERS & NUMBERS)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black pr-10"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-[#888888] tracking-wider block mb-1">
                  CONFIRM NEW PASSWORD
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black"
                  placeholder="••••••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-3 bg-black text-white text-xs font-mono font-bold uppercase tracking-widest hover:bg-[#222222] disabled:opacity-50 mt-4"
              >
                {savingPassword ? 'UPDATING CREDENTIALS...' : 'UPDATE PASSWORD &rarr;'}
              </button>
            </form>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* TAB 5: DROP PREFERENCES                                           */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'preferences' && (
          <div className="bg-white border border-[#EAEAEA] p-6 sm:p-8 max-w-xl font-mono text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-black mb-6 border-b border-[#EEEEEE] pb-3">
              SYNDICATE BROADCAST PREFERENCES
            </h2>

            <div className="space-y-5">
              <label className="flex items-center justify-between cursor-pointer p-3 border border-[#EEEEEE] hover:border-black transition-colors">
                <div>
                  <span className="font-bold text-black uppercase block">Anime Capsule Drop Announcements</span>
                  <span className="text-[11px] text-[#777777]">Early access notifications for limited streetwear capsules.</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefDropAlerts}
                  onChange={(e) => setPrefDropAlerts(e.target.checked)}
                  className="w-4 h-4 accent-black"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-3 border border-[#EEEEEE] hover:border-black transition-colors">
                <div>
                  <span className="font-bold text-black uppercase block">Shiprocket Courier Milestone Updates</span>
                  <span className="text-[11px] text-[#777777]">Real-time tracking notifications via email on out-for-delivery events.</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefLogisticsSms}
                  onChange={(e) => setPrefLogisticsSms(e.target.checked)}
                  className="w-4 h-4 accent-black"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-3 border border-[#EEEEEE] hover:border-black transition-colors">
                <div>
                  <span className="font-bold text-black uppercase block">Tokyo Editorial Lookbook Digest</span>
                  <span className="text-[11px] text-[#777777]">Monthly streetwear styling archives and culture articles.</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefEditorialDigest}
                  onChange={(e) => setPrefEditorialDigest(e.target.checked)}
                  className="w-4 h-4 accent-black"
                />
              </label>
            </div>
          </div>
        )}
      </main>

      <ZeninFooter />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center font-mono text-xs">
        LOADING SETTINGS ARCHIVE...
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
