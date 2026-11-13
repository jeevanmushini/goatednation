'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { ZeninAnnouncementBar } from '../../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../../components/zenin/ZeninHeader';
import { ZeninFooter } from '../../components/zenin/ZeninFooter';
import { CartDrawer } from '../../components/layout/CartDrawer';
import { TrackingResponse } from '../../types/shipping';

export default function TrackingPage() {
  const [trackingInput, setTrackingInput] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('awb') || params.get('id') || '';
    }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async (idToTrack: string) => {
    if (!idToTrack.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/shipping/track?id=${encodeURIComponent(idToTrack.trim())}`);
      const data = await res.json();
      if (data.success) {
        setTrackingData(data);
        setError(null);
      } else {
        setTrackingData(null);
        setError(data.error || 'No tracking details found for this code in Shiprocket.');
      }
    } catch {
      setTrackingData(null);
      setError('Could not connect to Shiprocket tracking gateway.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const initialId = params.get('awb') || params.get('id');
    if (!initialId) return;

    let ignore = false;
    fetch(`/api/shipping/track?id=${encodeURIComponent(initialId.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        if (data.success) {
          setTrackingData(data);
          setError(null);
        } else {
          setTrackingData(null);
          setError(data.error || 'No tracking details found for this code in Shiprocket.');
        }
      })
      .catch(() => {
        if (!ignore) {
          setTrackingData(null);
          setError('Could not connect to Shiprocket tracking gateway.');
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    fetchTracking(trackingInput.trim());
  };

  const handleDemoTrack = () => {
    setTrackingInput('DEMO');
    fetchTracking('DEMO');
  };

  const steps = [
    { label: 'Order Confirmed', key: 'ORDER_PLACED' },
    { label: 'Manifested & Handed Over', key: 'MANIFESTED' },
    { label: 'In Transit', key: 'IN_TRANSIT' },
    { label: 'Out for Delivery', key: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', key: 'DELIVERED' },
  ];

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const order = ['ORDER_PLACED', 'MANIFESTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-black antialiased selection:bg-[#FF4D00] selection:text-white">
      <ZeninAnnouncementBar />
      <ZeninHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F0FDF4] border border-[#86EFAC] text-[11px] font-mono text-[#16A34A] mb-3">
            <Wifi className="w-3.5 h-3.5" />
            <span className="font-bold">LIVE SHIPROCKET GATEWAY CONNECTED</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-mono font-bold text-black uppercase tracking-tight">
            TRACK YOUR ORDER
          </h1>
          <p className="text-xs sm:text-sm font-mono text-[#666666] mt-2">
            Enter your Shiprocket AWB Air Waybill tracking code or Order Reference ID to monitor live express transit.
          </p>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleTrack} className="max-w-xl mx-auto mb-6">
          <div className="flex space-x-2 p-1.5 rounded-lg bg-white border border-[#D5D5D5] focus-within:border-black shadow-sm transition-colors">
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Enter AWB Code (e.g. 14328912) or Order ID"
              className="flex-1 bg-transparent px-3 py-2 text-xs text-black placeholder-[#999999] outline-none font-mono"
            />
            <button
              type="submit"
              disabled={loading || !trackingInput.trim()}
              className="px-6 py-2.5 rounded bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-sm"
            >
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#777777]">
            <span>Need a test preview?</span>
            <button
              type="button"
              onClick={handleDemoTrack}
              className="inline-flex items-center space-x-1 text-black font-semibold hover:underline"
            >
              <Sparkles className="w-3 h-3 text-[#FF4D00]" />
              <span>Preview Demo Timeline</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#DC2626] font-mono space-y-1">
              <div className="flex items-center space-x-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Shiprocket API Response:</span>
              </div>
              <p className="pl-6 text-[11px] text-[#991B1B] leading-relaxed">{error}</p>
            </div>
          )}
        </form>

        {/* Tracking Card */}
        {trackingData && (
          <div className="p-6 sm:p-8 rounded-xl bg-white border border-[#EAEAEA] shadow-sm space-y-8 animate-in fade-in duration-200">
            {/* Top Bar with Status and Courier Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAEAEA] gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono uppercase text-[#777777] block font-semibold">
                    SHIPMENT STATUS
                  </span>
                  {trackingData.isLive ? (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-bold uppercase">
                      ● LIVE SHIPROCKET
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563] font-bold uppercase">
                      ● SIMULATED DEMO
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 mt-1.5">
                  <h3 className="text-xl sm:text-2xl font-mono font-bold text-black uppercase">
                    {trackingData.currentStatus.replace(/_/g, ' ')}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-black text-white">
                    {trackingData.currentStatus === 'DELIVERED' ? 'COMPLETED' : 'IN TRANSIT'}
                  </span>
                </div>
              </div>

              <div className="sm:text-right font-mono text-xs">
                <span className="text-[#777777] text-[10px] block font-semibold">COURIER PARTNER</span>
                <span className="font-bold text-black text-sm">{trackingData.courierName}</span>
                <div className="text-[#555555] text-[11px] mt-0.5">AWB: {trackingData.awbCode}</div>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-[#FAFAFA] border border-[#EEEEEE] text-xs font-mono">
              <div>
                <span className="text-[#888888] text-[10px] block font-semibold">ORIGIN WAREHOUSE</span>
                <span className="font-semibold text-black">{trackingData.origin}</span>
              </div>
              <div>
                <span className="text-[#888888] text-[10px] block font-semibold">DESTINATION</span>
                <span className="font-semibold text-black">{trackingData.destination}</span>
              </div>
              <div>
                <span className="text-[#888888] text-[10px] block font-semibold">ESTIMATED DELIVERY</span>
                <span className="font-semibold text-[#FF4D00]">
                  {trackingData.estimatedDelivery}
                </span>
              </div>
              <div>
                <span className="text-[#888888] text-[10px] block font-semibold">CURRENT CHECKPOINT</span>
                <span className="font-semibold text-black truncate block">
                  {trackingData.scans?.[0]?.location || trackingData.destination}
                </span>
              </div>
            </div>

            {/* Visual Stepper */}
            <div className="py-2">
              <h4 className="text-xs font-mono font-bold text-black uppercase tracking-wider mb-6">
                Transit Timeline
              </h4>

              <div className="relative flex flex-col md:flex-row justify-between">
                {steps.map((step, idx) => {
                  const status = getStepStatus(step.key, trackingData.currentStatus);
                  const isCompleted = status === 'completed';
                  const isCurrent = status === 'current';

                  return (
                    <div
                      key={step.key}
                      className="flex md:flex-col items-center md:items-center space-x-3 md:space-x-0 mb-4 md:mb-0 relative z-10 flex-1 text-center"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                          isCompleted
                            ? 'bg-[#16A34A] text-white'
                            : isCurrent
                            ? 'bg-black text-white shadow-md'
                            : 'bg-white text-[#999999] border border-[#D5D5D5]'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>

                      <div className="md:mt-3 text-left md:text-center">
                        <span
                          className={`text-xs font-mono font-semibold block ${
                            isCompleted || isCurrent ? 'text-black' : 'text-[#888888]'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checkpoint Logs */}
            {trackingData.scans && trackingData.scans.length > 0 && (
              <div className="pt-6 border-t border-[#EAEAEA]">
                <h4 className="text-xs font-mono font-bold text-black uppercase tracking-wider mb-4">
                  Logistics Activity Logs
                </h4>
                <div className="space-y-3 font-mono text-xs">
                  {trackingData.scans.map((scan, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg bg-[#FAFAFA] border border-[#EEEEEE] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
                    >
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-[#FF4D00] shrink-0" />
                        <span className="text-black font-semibold">{scan.activity}</span>
                        <span className="text-[#777777]">&bull; {scan.location}</span>
                      </div>
                      <div className="flex items-center text-[#888888] space-x-1 shrink-0 mt-1 sm:mt-0">
                        <Clock className="w-3 h-3" />
                        <span>{scan.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <ZeninFooter />
      <CartDrawer />
    </div>
  );
}
