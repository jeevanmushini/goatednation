'use client';

import React, { useState } from 'react';
import { Truck, Check, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { ServiceabilityResponse } from '../../types/shipping';

export const PincodeChecker: React.FC = () => {
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ServiceabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      setError('Enter a valid 6-digit Indian pincode');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/shipping/serviceability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Pincode not serviceable');
      }
    } catch {
      setError('Could not verify pincode delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] space-y-3">
      <div className="flex items-center justify-between text-xs font-mono text-[#666666]">
        <span className="flex items-center text-black font-semibold">
          <Truck className="w-4 h-4 mr-1.5 text-black" />
          SHIPROCKET EXPRESS DELIVERY
        </span>
        <span className="text-[11px] text-[#22C55E] flex items-center font-medium">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Pan-India Delivery
        </span>
      </div>

      <form onSubmit={handleCheck} className="flex space-x-2">
        <input
          type="text"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setPincode(val);
            if (error) setError(null);
          }}
          placeholder="Enter Delivery Pincode (e.g. 400050)"
          className="flex-1 bg-white border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black placeholder-[#999999] outline-none focus:border-black font-mono"
        />
        <button
          type="submit"
          disabled={loading || pincode.length !== 6}
          className="px-5 py-2 bg-black hover:bg-[#222222] text-white font-mono font-bold text-xs uppercase tracking-wider rounded transition-colors disabled:opacity-40"
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
      </form>

      {error && (
        <div className="flex items-center text-xs text-[#8A1616] space-x-1.5 pt-1 font-mono">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && result.isServiceable && (
        <div className="pt-2 border-t border-[#EAEAEA] space-y-2 text-xs font-mono">
          <div className="flex items-center text-[#16A34A] font-medium">
            <Check className="w-4 h-4 mr-1.5 shrink-0" />
            <span>Serviceable for {result.city ? `${result.city}, ${result.state}` : 'your location'}</span>
          </div>

          {result.recommendedCourier && (
            <div className="p-2.5 rounded bg-white border border-[#EAEAEA] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-black flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-[#FF4D00]" />
                  Est. Delivery: {result.recommendedCourier.estimatedDeliveryDays}
                </div>
                <div className="text-[11px] text-[#777777]">
                  Via {result.recommendedCourier.courierName}
                </div>
              </div>
              <span className="text-black font-bold">
                ₹{result.recommendedCourier.rate}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

