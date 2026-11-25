'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  Truck,
  RotateCcw,
  CreditCard,
  Ban,
  FileText,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Star,
  RefreshCw,
  Sparkles,
  Phone,
  Mail,
  User,
  Tag,
  Package,
} from 'lucide-react';
import { Ticket, TicketMessage, TicketMetrics } from '../../../types/ticket';

const CANNED_RESPONSES = [
  {
    title: 'Approve Sizing Exchange',
    text: 'Your sizing exchange request has been approved. We have scheduled a reverse pickup from your delivery address via Shiprocket. Once the pickup is scanned, your replacement garment will be manifested.',
  },
  {
    title: 'Courier Delay Escalation',
    text: 'We have escalated your shipment delay directly with the courier logistics operations wing. Your delivery attempt has been expedited and will be prioritized within the next 24 hours.',
  },
  {
    title: 'Request Defect Photos',
    text: 'To process your replacement or refund under our Quality Guarantee, please upload 1–2 clear photographs displaying the garment print or stitching distress alongside the original tag.',
  },
  {
    title: 'UPI Payment Reconciled',
    text: 'Your UPI transaction has been verified with our banking gateway. Your order has been placed into production, and your visual confirmation receipt is available in your account archive.',
  },
  {
    title: 'Refund Dispatched Notice',
    text: 'Your refund has been executed through our payment gateway. The funds will credit back to your source account / UPI ID within 3–5 business days.',
  },
];

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metrics, setMetrics] = useState<TicketMetrics>({
    totalOpen: 0,
    urgentSla: 0,
    inProgress: 0,
    resolvedToday: 0,
    averageCsat: 5.0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Selected Ticket Workspace State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<TicketMessage[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

  // Reply Composer State
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replyStatus, setReplyStatus] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // 1-Click Action Modals / State
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load ticket queue
  const fetchTickets = (targetIdToSelect?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());

    fetch(`/api/admin/tickets?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success) {
          setTickets(data.tickets || []);
          if (data.metrics) setMetrics(data.metrics);

          // Select first ticket or specified ticket
          const selectId = targetIdToSelect || (data.tickets?.[0]?.id ?? null);
          if (selectId && (!selectedTicketId || targetIdToSelect)) {
            setSelectedTicketId(selectId);
          }
        }
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  // Load Selected Ticket Workspace Details
  useEffect(() => {
    if (selectedTicketId) {
      setLoadingWorkspace(true);
      setActionFeedback(null);
      fetch(`/api/admin/tickets/${selectedTicketId}`)
        .then((res) => res.json())
        .then((data) => {
          setLoadingWorkspace(false);
          if (data.success) {
            setSelectedTicket(data.ticket);
            setSelectedMessages(data.messages || []);
            setSelectedOrder(data.order || null);
            setReplyStatus(data.ticket.status);
          }
        })
        .catch(() => setLoadingWorkspace(false));
    }
  }, [selectedTicketId]);

  // Handle Search Submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  // Submit Admin Reply or Staff Note
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setSubmittingReply(true);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage.trim(),
          isInternal: isInternalNote,
          newStatus: replyStatus,
        }),
      });
      const data = await res.json();
      setSubmittingReply(false);

      if (data.success && data.message) {
        setSelectedMessages((prev) => [...prev, data.message]);
        setReplyMessage('');
        setIsInternalNote(false);
        setActionFeedback({
          type: 'success',
          text: isInternalNote ? 'Staff private note saved.' : 'Reply dispatched and customer emailed.',
        });
        fetchTickets(selectedTicket.id);
      } else {
        setActionFeedback({ type: 'error', text: data.error || 'Failed to dispatch reply.' });
      }
    } catch {
      setSubmittingReply(false);
      setActionFeedback({ type: 'error', text: 'Network error sending reply.' });
    }
  };

  // 1-Click Shiprocket Reverse Pickup
  const handleReversePickup = async () => {
    if (!selectedTicket) return;
    setActionLoading(true);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/shiprocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REVERSE_PICKUP' }),
      });
      const data = await res.json();
      setActionLoading(false);

      if (data.success) {
        setActionFeedback({ type: 'success', text: data.message });
        fetchTickets(selectedTicket.id);
      } else {
        setActionFeedback({ type: 'error', text: data.error || 'Failed to schedule reverse pickup.' });
      }
    } catch {
      setActionLoading(false);
      setActionFeedback({ type: 'error', text: 'Reverse pickup communication error.' });
    }
  };

  // 1-Click NDR Courier Re-Attempt
  const handleNdrReattempt = async () => {
    if (!selectedTicket) return;
    const awb = selectedTicket.shiprocketAwb || selectedOrder?.awbCode;
    if (!awb) {
      setActionFeedback({ type: 'error', text: 'No AWB found for this ticket.' });
      return;
    }

    setActionLoading(true);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/shiprocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'NDR_REATTEMPT',
          awbCode: awb,
          instructions: 'Admin requested urgent re-attempt.',
        }),
      });
      const data = await res.json();
      setActionLoading(false);

      if (data.success) {
        setActionFeedback({ type: 'success', text: data.message });
        fetchTickets(selectedTicket.id);
      } else {
        setActionFeedback({ type: 'error', text: data.error || 'Failed to trigger NDR reattempt.' });
      }
    } catch {
      setActionLoading(false);
      setActionFeedback({ type: 'error', text: 'NDR reattempt communication error.' });
    }
  };

  // 1-Click Cancel Order
  const handleCancelOrder = async () => {
    if (!selectedTicket) return;
    if (!confirm('Are you sure you want to cancel this order in Shiprocket and mark ticket RESOLVED?')) {
      return;
    }

    setActionLoading(true);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/shiprocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL_ORDER' }),
      });
      const data = await res.json();
      setActionLoading(false);

      if (data.success) {
        setActionFeedback({ type: 'success', text: data.message });
        fetchTickets(selectedTicket.id);
      } else {
        setActionFeedback({ type: 'error', text: data.error || 'Failed to cancel order.' });
      }
    } catch {
      setActionLoading(false);
      setActionFeedback({ type: 'error', text: 'Cancel order communication error.' });
    }
  };

  // 1-Click Razorpay Refund
  const handleRazorpayRefund = async () => {
    if (!selectedTicket) return;
    const paymentId = selectedOrder?.razorpayPaymentId || selectedTicket.paymentDetails?.paymentId;
    if (!paymentId) {
      const manualId = prompt('Enter Razorpay Payment ID to refund:');
      if (!manualId) return;
      executeRefund(manualId);
      return;
    }

    if (!confirm(`Execute full Razorpay refund for payment ${paymentId}?`)) return;
    executeRefund(paymentId);
  };

  const executeRefund = async (paymentId: string) => {
    if (!selectedTicket) return;
    setActionLoading(true);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          amount: selectedOrder?.totalAmount || selectedTicket.paymentDetails?.amount,
        }),
      });
      const data = await res.json();
      setActionLoading(false);

      if (data.success) {
        setActionFeedback({ type: 'success', text: data.message });
        fetchTickets(selectedTicket.id);
      } else {
        setActionFeedback({ type: 'error', text: data.error || 'Failed to execute refund.' });
      }
    } catch {
      setActionLoading(false);
      setActionFeedback({ type: 'error', text: 'Refund API communication error.' });
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. TOP KPI METRICS BAR                                            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border-2 border-black p-4">
          <span className="text-[10px] text-[#777777] uppercase block tracking-wider">
            TOTAL OPEN
          </span>
          <span className="text-2xl font-black text-black mt-1 block">
            {metrics.totalOpen}
          </span>
          <span className="text-[9px] text-[#999999] mt-0.5 block">Queued requests</span>
        </div>

        <div className="bg-white border-2 border-red-500 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">
              URGENT / SLA BREACH
            </span>
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          </div>
          <span className="text-2xl font-black text-red-600 mt-1 block">
            {metrics.urgentSla}
          </span>
          <span className="text-[9px] text-red-400 mt-0.5 block">Requires action &lt; 2h</span>
        </div>

        <div className="bg-white border border-[#E5E5E5] p-4">
          <span className="text-[10px] text-[#777777] uppercase block tracking-wider">
            PROCESSING
          </span>
          <span className="text-2xl font-black text-[#EA580C] mt-1 block">
            {metrics.inProgress}
          </span>
          <span className="text-[9px] text-[#999999] mt-0.5 block">In courier / QC transit</span>
        </div>

        <div className="bg-white border border-[#E5E5E5] p-4">
          <span className="text-[10px] text-[#777777] uppercase block tracking-wider">
            RESOLVED TODAY
          </span>
          <span className="text-2xl font-black text-[#16A34A] mt-1 block">
            {metrics.resolvedToday}
          </span>
          <span className="text-[9px] text-[#999999] mt-0.5 block">Closed successfully</span>
        </div>

        <div className="bg-white border border-[#E5E5E5] p-4 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-[#777777] uppercase block tracking-wider">
            AVERAGE CSAT
          </span>
          <div className="flex items-center space-x-1 mt-1">
            <span className="text-2xl font-black text-black">
              {metrics.averageCsat.toFixed(1)}
            </span>
            <span className="text-amber-500 text-lg">★</span>
          </div>
          <span className="text-[9px] text-[#999999] mt-0.5 block">Customer score</span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. TWO-PANE RESOLUTION WORKBENCH                                  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
        {/* ── LEFT PANE: QUEUE (4 COLS) ── */}
        <div className="lg:col-span-4 bg-white border border-[#E5E5E5] flex flex-col h-[700px]">
          {/* Queue Header & Filters */}
          <div className="p-4 border-b border-[#E5E5E5] space-y-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
              <input
                type="text"
                placeholder="Search Ticket, Name, Email, AWB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#F9F9F9] border border-[#E0E0E0] text-xs outline-none focus:border-black uppercase"
              />
            </form>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1 text-[10px]">
              {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1 uppercase font-bold tracking-wider ${
                    statusFilter === f
                      ? 'bg-black text-white'
                      : 'bg-[#F0F0F0] text-[#666666] hover:bg-[#E5E5E5]'
                  }`}
                >
                  {f.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F0F0F0]">
            {loading ? (
              <div className="p-8 text-center text-[#888888]">
                LOADING SUPPORT QUEUE...
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-[#888888]">
                NO TICKETS MATCHING FILTERS
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicketId === t.id;
                const isUrgent = t.priority === 'URGENT';
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full text-left p-4 transition-colors block ${
                      isSelected
                        ? 'bg-[#F5F5F5] border-l-4 border-black'
                        : 'hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-black text-xs flex items-center gap-1.5">
                        {isUrgent && <span className="w-2 h-2 rounded-full bg-red-600" />}
                        <span>{t.ticketNumber}</span>
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 ${
                          t.status === 'RESOLVED'
                            ? 'bg-green-100 text-green-800'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="font-bold text-black truncate mb-0.5">
                      {t.subject}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#777777]">
                      <span>{t.customerName}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANE: RESOLUTION WORKSPACE (8 COLS) ── */}
        <div className="lg:col-span-8 bg-white border border-[#E5E5E5] flex flex-col h-[700px] overflow-hidden">
          {loadingWorkspace ? (
            <div className="flex-1 flex items-center justify-center text-[#888888]">
              LOADING WORKSPACE DATA...
            </div>
          ) : !selectedTicket ? (
            <div className="flex-1 flex items-center justify-center text-[#888888]">
              SELECT A TICKET FROM THE QUEUE TO BEGIN RESOLUTION
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Header Info & 1-Click Action Buttons */}
              <div className="p-5 border-b border-[#E5E5E5] bg-[#FAFAFA] space-y-4 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-base font-black text-black">
                        {selectedTicket.ticketNumber}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-black text-white">
                        {selectedTicket.category.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 ${
                          selectedTicket.priority === 'URGENT'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <div className="text-xs text-[#555555] flex flex-wrap gap-x-4 gap-y-1">
                      <span>Customer: <strong>{selectedTicket.customerName}</strong></span>
                      <span>Email: <strong>{selectedTicket.customerEmail}</strong></span>
                      {selectedTicket.orderId && <span>Order: <strong>#{selectedTicket.orderId}</strong></span>}
                    </div>
                  </div>

                  {/* Status Picker */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-[#777777] uppercase">STATUS:</span>
                    <select
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-[#CCCCCC] font-bold text-xs uppercase outline-none"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="WAITING_CUSTOMER">WAITING CUSTOMER</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                </div>

                {/* 1-Click Shiprocket & Razorpay Quick Actions */}
                <div className="pt-3 border-t border-[#EAEAEA] flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-[#777777] mr-1">
                    ACTIONS:
                  </span>

                  <button
                    type="button"
                    onClick={handleReversePickup}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-black text-white font-bold text-[10px] uppercase tracking-wider hover:bg-[#333333] flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3 h-3 text-[#FF4D00]" />
                    <span>1-CLICK SHIPROCKET REVERSE PICKUP</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNdrReattempt}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-[#FFFBEB] border border-[#F59E0B] text-[#92400E] font-bold text-[10px] uppercase tracking-wider hover:bg-[#FEF3C7] flex items-center space-x-1.5"
                  >
                    <Truck className="w-3 h-3" />
                    <span>FORCE COURIER NDR RETRY</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRazorpayRefund}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-white border border-[#D5D5D5] hover:border-black font-bold text-[10px] uppercase tracking-wider text-black flex items-center space-x-1.5"
                  >
                    <CreditCard className="w-3 h-3 text-green-600" />
                    <span>1-CLICK RAZORPAY REFUND</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1"
                  >
                    <Ban className="w-3 h-3" />
                    <span>CANCEL ORDER</span>
                  </button>
                </div>

                {/* Action Feedback Toast Banner */}
                {actionFeedback && (
                  <div
                    className={`p-2.5 text-[11px] border font-bold ${
                      actionFeedback.type === 'success'
                        ? 'bg-green-50 text-green-800 border-green-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    {actionFeedback.text}
                  </div>
                )}
              </div>

              {/* Thread Messages Timeline */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FBFBFB]">
                {selectedMessages.map((msg) => {
                  const isAdmin = msg.senderType === 'ADMIN';
                  const isStaffNote = Boolean(msg.isInternal);
                  const isSystem = msg.senderType === 'SYSTEM';

                  if (isStaffNote) {
                    return (
                      <div
                        key={msg.id}
                        className="p-4 bg-[#FEF9C3] border-2 border-[#EAB308] text-xs font-mono shadow-xs"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#854D0E] uppercase mb-1">
                          <span>STAFF INTERNAL NOTE (HIDDEN FROM CUSTOMER) &bull; {msg.senderName}</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-black leading-relaxed whitespace-pre-wrap">
                          {msg.message}
                        </div>
                      </div>
                    );
                  }

                  if (isSystem) {
                    return (
                      <div
                        key={msg.id}
                        className="p-3 bg-white border border-[#E0E0E0] text-[11px] text-[#555555]"
                      >
                        <span className="font-bold text-black uppercase block mb-0.5">
                          [SYSTEM DISPATCH] {msg.senderName}:
                        </span>
                        {msg.message}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`p-4 border ${
                        isAdmin
                          ? 'bg-white border-black shadow-xs ml-6'
                          : 'bg-[#F0F0F0] border-[#DCDCDC] mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#666666] uppercase mb-1">
                        <span>{isAdmin ? 'ADMIN DISPATCH' : 'CUSTOMER MESSAGE'} &bull; {msg.senderName}</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-xs text-black leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </div>
                      {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-[#EAEAEA]">
                          {msg.attachments.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="w-14 h-14 border overflow-hidden">
                              <img src={url} alt="Proof" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reply Box & Canned Responses */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-[#E5E5E5] bg-white space-y-3 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Public Reply vs Internal Note Toggle */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      className={`px-3 py-1 uppercase font-bold text-[10px] tracking-wider ${
                        !isInternalNote
                          ? 'bg-black text-white'
                          : 'bg-[#EEEEEE] text-[#666666]'
                      }`}
                    >
                      Reply to Customer (Sends Email)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={`px-3 py-1 uppercase font-bold text-[10px] tracking-wider ${
                        isInternalNote
                          ? 'bg-[#EAB308] text-black font-extrabold'
                          : 'bg-[#EEEEEE] text-[#666666]'
                      }`}
                    >
                      Staff Note (Private)
                    </button>
                  </div>

                  {/* Canned Responses Dropdown */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) setReplyMessage(e.target.value);
                    }}
                    className="px-2 py-1 bg-[#F9F9F9] border border-[#CCCCCC] text-[10px] uppercase font-mono outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Insert Canned Policy Template...</option>
                    {CANNED_RESPONSES.map((cr, idx) => (
                      <option key={idx} value={cr.text}>
                        {cr.title}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  rows={3}
                  required
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={
                    isInternalNote
                      ? 'Write an internal staff note (only administrators can see this)...'
                      : 'Compose response to customer (dispatches automated email notification)...'
                  }
                  className={`w-full p-2.5 text-xs font-mono outline-none border ${
                    isInternalNote
                      ? 'bg-[#FEFCE8] border-[#EAB308] focus:border-black'
                      : 'bg-white border-[#D0D0D0] focus:border-black'
                  }`}
                />

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={submittingReply || !replyMessage.trim()}
                    className={`px-5 py-2 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 disabled:opacity-50 ${
                      isInternalNote
                        ? 'bg-[#EAB308] text-black hover:bg-[#CA8A04]'
                        : 'bg-black text-white hover:bg-[#222222]'
                    }`}
                  >
                    <span>{submittingReply ? 'SAVING...' : isInternalNote ? 'SAVE STAFF NOTE' : 'DISPATCH REPLY'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
