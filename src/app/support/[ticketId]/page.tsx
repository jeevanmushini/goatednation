'use client';

import React, { useState, useEffect, useRef, use, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  Send,
  Upload,
  X,
  Star,
  ExternalLink,
  Shield,
  MessageSquare,
  Truck,
  Image as ImageIcon,
} from 'lucide-react';
import { ZeninAnnouncementBar } from '../../../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../../../components/zenin/ZeninHeader';
import { ZeninFooter } from '../../../components/zenin/ZeninFooter';
import { Ticket, TicketMessage } from '../../../types/ticket';

function TicketThreadContent({ ticketId }: { ticketId: string }) {
  const searchParams = useSearchParams();
  const queryRate = searchParams.get('rate');
  const queryAction = searchParams.get('action');

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reply Form State
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSAT Rating State
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Load ticket and messages
  const loadThread = () => {
    fetch(`/api/tickets/${ticketId}`)
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success) {
          setTicket(data.ticket);
          setMessages(data.messages || []);
          if (data.ticket.customerRating) {
            setUserRating(data.ticket.customerRating);
          }
        } else {
          setError(data.error || 'Failed to load ticket.');
        }
      })
      .catch(() => {
        setLoading(false);
        setError('Network error loading ticket thread.');
      });
  };

  useEffect(() => {
    loadThread();
  }, [ticketId]);

  // Handle URL deep links for rating or reopening (e.g. from email links)
  useEffect(() => {
    if (queryRate && !ratingSubmitted) {
      handleRate(Number(queryRate));
    }
    if (queryAction === 'reopen') {
      handleReopen();
    }
  }, [queryRate, queryAction]);

  // Submit CSAT Rating
  const handleRate = async (stars: number) => {
    setUserRating(stars);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: stars }),
      });
      const data = await res.json();
      if (data.success) {
        setRatingSubmitted(true);
      }
    } catch {
      console.warn('Failed to submit rating.');
    }
  };

  // Reopen Ticket
  const handleReopen = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reopen' }),
      });
      const data = await res.json();
      if (data.success) {
        loadThread();
      }
    } catch {
      console.warn('Failed to reopen ticket.');
    }
  };

  // Upload Reply Attachment
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        const res = await fetch('/api/tickets/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.url) {
          setReplyAttachments((prev) => [...prev, data.url]);
        }
      }
    } catch {
      console.warn('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Send Customer Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage.trim(),
          attachments: replyAttachments,
        }),
      });
      const data = await res.json();
      setSubmitting(false);

      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setReplyMessage('');
        setReplyAttachments([]);
        // Refresh ticket status
        loadThread();
      }
    } catch {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center font-mono text-xs">
        RETRIEVING ENCRYPTED TICKET DOSSIER...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center justify-center p-4 font-mono text-xs text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
        <h2 className="text-sm font-bold uppercase text-black mb-2">TICKET RECORD NOT FOUND</h2>
        <p className="text-[#666666] mb-4">{error || 'This support thread does not exist or has been removed.'}</p>
        <Link href="/support" className="px-5 py-2.5 bg-black text-white uppercase font-bold tracking-widest">
          &larr; RETURN TO SUPPORT DESK
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFB] text-black">
      <ZeninAnnouncementBar />
      <ZeninHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 font-mono">
        {/* Top Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/settings"
            className="inline-flex items-center space-x-1.5 text-xs text-[#666666] hover:text-black uppercase font-bold tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Settings</span>
          </Link>

          <span className="text-[10px] text-[#888888] uppercase tracking-widest">
            LOGISTICS SUPPORT THREAD
          </span>
        </div>

        {/* Ticket Header Card */}
        <div className="bg-white border-2 border-black p-6 sm:p-8 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EEEEEE] pb-5 mb-5">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-xl sm:text-2xl font-black uppercase text-black">
                  {ticket.ticketNumber}
                </h1>
                <span
                  className={`text-[9px] font-bold uppercase px-2.5 py-0.5 border ${
                    ticket.status === 'RESOLVED'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : ticket.status === 'IN_PROGRESS'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : ticket.status === 'WAITING_CUSTOMER'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {ticket.status.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-[#888888] font-bold">
                  // {ticket.category.replace(/_/g, ' ')}
                </span>
              </div>
              <h2 className="text-sm font-bold text-[#333333]">{ticket.subject}</h2>
            </div>

            <div className="text-right sm:text-right font-mono text-[11px] text-[#777777]">
              <div>Opened: {new Date(ticket.createdAt).toLocaleDateString('en-IN')}</div>
              {ticket.orderId && (
                <div className="font-bold text-black mt-0.5">
                  Order Reference: #{ticket.orderId}
                </div>
              )}
            </div>
          </div>

          {/* Sizing Exchange / Courier Waybill Highlights */}
          {ticket.shiprocketAwb && (
            <div className="p-3.5 bg-[#F0FDF4] border border-[#86EFAC] text-[#166534] text-xs font-mono mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-[#16A34A]" />
                <span>
                  <strong>SHIPROCKET RETURN WAYBILL ASSIGNED:</strong> {ticket.shiprocketAwb}
                </span>
              </div>
              <Link
                href={`/track?awb=${ticket.shiprocketAwb}`}
                className="text-[10px] font-bold uppercase underline hover:text-black"
              >
                Track Return &rarr;
              </Link>
            </div>
          )}

          {/* CSAT Rating Widget (If Ticket is RESOLVED) */}
          {ticket.status === 'RESOLVED' && (
            <div className="p-5 bg-[#FAFAFA] border-2 border-black mt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A] block mb-1">
                    ✓ CASE MARKED AS RESOLVED
                  </span>
                  <p className="text-xs text-[#555555]">
                    {ticket.resolutionNotes || 'All requested actions have been finalized.'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#888888] uppercase block mb-1.5">
                    RATE SUPPORT SATISFACTION:
                  </span>
                  <div className="flex items-center justify-end space-x-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleRate(s)}
                        className={`p-1.5 text-base transition-transform hover:scale-110 ${
                          (userRating || 0) >= s ? 'text-[#F59E0B]' : 'text-[#D1D5DB]'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 1-Click Reopen Button */}
              <div className="mt-4 pt-3 border-t border-[#EAEAEA] flex items-center justify-between text-[11px]">
                <span className="text-[#888888]">
                  Still need adjustments or issue not resolved?
                </span>
                <button
                  type="button"
                  onClick={handleReopen}
                  className="font-bold text-[#DC2626] uppercase hover:underline"
                >
                  [ ⚠️ REOPEN TICKET IN 1-CLICK ]
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* CONVERSATION THREAD TIMELINE                                      */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div className="space-y-6 mb-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#888888] flex items-center space-x-2">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>CONVERSATION HISTORY ({messages.length} ENTRIES)</span>
          </h3>

          <div className="space-y-4">
            {messages.map((msg) => {
              const isAdmin = msg.senderType === 'ADMIN';
              const isSystem = msg.senderType === 'SYSTEM';

              if (isSystem) {
                return (
                  <div
                    key={msg.id}
                    className="p-3.5 bg-[#F5F5F5] border-l-4 border-black text-xs text-[#444444] font-mono leading-relaxed"
                  >
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-black uppercase mb-1">
                      <Truck className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>{msg.senderName}</span>
                      <span className="text-[#888888] font-normal">
                        &bull; {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {msg.message}
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`p-5 sm:p-6 border-2 relative ${
                    isAdmin
                      ? 'border-black bg-white shadow-xs'
                      : 'border-[#EAEAEA] bg-[#FAFAFA]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 border-b border-[#F0F0F0] pb-2 text-[11px]">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`font-bold uppercase px-2 py-0.5 text-[9px] ${
                          isAdmin
                            ? 'bg-black text-white'
                            : 'bg-[#E5E5E5] text-[#333333]'
                        }`}
                      >
                        {isAdmin ? 'GOATED SUPPORT // ADMIN' : 'YOU'}
                      </span>
                      <span className="font-bold text-black">{msg.senderName}</span>
                    </div>
                    <span className="text-[#888888] text-[10px]">
                      {new Date(msg.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="text-xs text-[#222222] leading-relaxed whitespace-pre-wrap mb-3">
                    {msg.message}
                  </div>

                  {/* Photo Attachments */}
                  {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F5F5F5]">
                      {msg.attachments.map((url, imgIdx) => (
                        <button
                          key={imgIdx}
                          type="button"
                          onClick={() => setLightboxImage(url)}
                          className="w-16 h-16 border border-[#CCCCCC] hover:border-black overflow-hidden relative"
                        >
                          <img src={url} alt="Proof" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* CUSTOMER REPLY COMPOSER                                           */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {ticket.status !== 'CLOSED' && (
          <form onSubmit={handleSendReply} className="bg-white border-2 border-black p-5 sm:p-6 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF4D00] block mb-2">
              POST A FOLLOW-UP MESSAGE // 返信
            </span>

            <textarea
              rows={4}
              required
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply, additional order details, or address clarification..."
              className="w-full p-3 bg-white border border-[#D5D5D5] text-xs font-mono outline-none focus:border-black leading-relaxed mb-3"
            />

            {/* Photo Attachment Preview */}
            {replyAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {replyAttachments.map((url, idx) => (
                  <div key={idx} className="relative w-14 h-14 border border-black overflow-hidden">
                    <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setReplyAttachments((p) => p.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-black text-white hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-2 bg-[#F5F5F5] border border-[#D5D5D5] hover:border-black text-[10px] font-bold text-black uppercase flex items-center space-x-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'UPLOADING...' : '+ ATTACH PHOTO'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting || !replyMessage.trim()}
                className="px-6 py-2.5 bg-black text-white font-bold text-xs uppercase tracking-widest hover:bg-[#222222] transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <span>{submitting ? 'SENDING...' : 'SEND REPLY'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          >
            <div className="relative max-w-3xl max-h-[90vh] overflow-hidden bg-black p-2 border border-white">
              <img src={lightboxImage} alt="Expanded proof" className="max-w-full max-h-[85vh] object-contain" />
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 right-3 p-1.5 bg-black text-white border border-white hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      <ZeninFooter />
    </div>
  );
}

export default function TicketThreadPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center font-mono text-xs">
        LOADING TICKET THREAD...
      </div>
    }>
      <TicketThreadContent ticketId={resolvedParams.ticketId} />
    </Suspense>
  );
}
