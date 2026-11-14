'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Wifi,
  WifiOff,
  Package,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  Clock,
  ChevronRight,
  Search,
  Settings,
  Info,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectionStatus {
  connected: boolean;
  email?: string;
  companyName?: string;
  plan?: string;
  error?: string;
}

interface ShipmentRate {
  courierCompanyId: number;
  courierName: string;
  rate: number;
  codCharges: number;
  estimatedDeliveryDays: string;
  codAvailable: boolean;
  rating: number;
  isRecommended: boolean;
}

interface ServiceabilityResult {
  success: boolean;
  isServiceable: boolean;
  city?: string;
  state?: string;
  availableCouriers: { courierName: string; rate: number; estimatedDeliveryDays: string; codAvailable: boolean; rating: number }[];
  error?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminShippingPage() {
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Serviceability checker
  const [pincode, setPincode] = useState('');
  const [cod, setCod] = useState(true);
  const [weight, setWeight] = useState('0.5');
  const [serviceabilityResult, setServiceabilityResult] = useState<ServiceabilityResult | null>(null);
  const [isCheckingServiceability, setIsCheckingServiceability] = useState(false);

  // Rates checker
  const [ratesPincode, setRatesPincode] = useState('');
  const [rates, setRates] = useState<ShipmentRate[] | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // ── Test Connection ──
  const testConnection = useCallback(async () => {
    setIsTestingConnection(true);
    try {
      const res = await fetch('/api/shipping/test-connection');
      const data = await res.json();
      setConnection(data);
    } catch {
      setConnection({ connected: false, error: 'Network error — could not reach API' });
    } finally {
      setIsTestingConnection(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch('/api/shipping/test-connection')
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) setConnection(data);
      })
      .catch(() => {
        if (!ignore) setConnection({ connected: false, error: 'Network error — could not reach API' });
      });
    return () => {
      ignore = true;
    };
  }, []);

  // ── Check Serviceability ──
  const checkServiceability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode) return;
    setIsCheckingServiceability(true);
    setServiceabilityResult(null);
    try {
      const res = await fetch('/api/shipping/serviceability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode, cod, weight }),
      });
      const data = await res.json();
      setServiceabilityResult(data);
    } catch {
      setServiceabilityResult({ success: false, isServiceable: false, availableCouriers: [], error: 'Network error' });
    } finally {
      setIsCheckingServiceability(false);
    }
  };

  // ── Fetch Rates ──
  const fetchRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratesPincode) return;
    setIsLoadingRates(true);
    setRates(null);
    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: ratesPincode, weight: 0.5, cod: true }),
      });
      const data = await res.json();
      setRates(data.rates || []);
    } catch {
      setRates([]);
    } finally {
      setIsLoadingRates(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAEAEA] gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF4D00]">
            LOGISTICS &bull; SHIPROCKET GATEWAY
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight mt-1 flex items-center gap-2 font-mono">
            <Truck className="w-6 h-6 text-black" />
            SHIPROCKET DASHBOARD
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1">
            Manage courier partners, check serviceability, calculate live rates, and track shipments.
          </p>
        </div>
        <button
          onClick={testConnection}
          disabled={isTestingConnection}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-white border border-[#D5D5D5] hover:border-black text-black text-xs font-mono transition-all disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* ── Connection Status Card ── */}
      <div
        className={`p-6 rounded-xl border flex items-start gap-4 shadow-sm ${
          connection === null
            ? 'bg-white border-[#EAEAEA]'
            : connection.connected
            ? 'bg-[#F0FDF4] border-[#86EFAC]'
            : 'bg-[#FEF2F2] border-[#FCA5A5]'
        }`}
      >
        <div className={`p-3 rounded-lg ${connection?.connected ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'}`}>
          {connection === null ? (
            <Wifi className="w-6 h-6 text-[#888888]" />
          ) : connection.connected ? (
            <Wifi className="w-6 h-6 text-[#16A34A]" />
          ) : (
            <WifiOff className="w-6 h-6 text-[#DC2626]" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-black font-mono">
              {connection === null
                ? 'Testing Connection...'
                : connection.connected
                ? 'Shiprocket API Connected & Active'
                : 'Shiprocket Not Connected'}
            </h3>
            {connection?.connected && (
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#16A34A] text-white uppercase tracking-wider">
                LIVE PRODUCTION
              </span>
            )}
            {connection && !connection.connected && (
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FF4D00] text-white uppercase tracking-wider">
                MOCK MODE
              </span>
            )}
          </div>

          {connection?.connected ? (
            <div className="text-xs text-[#555555] font-mono space-y-1 mt-2">
              <div>Account Email: <span className="text-black font-semibold">{connection.email}</span></div>
              <div>Company Name: <span className="text-black font-semibold">{connection.companyName}</span></div>
              <div>API Tier: <span className="text-[#FF4D00] font-bold">{connection.plan}</span></div>
            </div>
          ) : connection?.error ? (
            <p className="text-xs text-[#DC2626] font-mono mt-1">{connection.error}</p>
          ) : null}

          {connection && !connection.connected && (
            <div className="mt-3 p-3 rounded-lg bg-white border border-[#E5E5E5]">
              <p className="text-[11px] text-[#666666] font-mono leading-relaxed">
                <span className="text-black font-bold">Mock mode active.</span> The storefront functions fully with simulated shipping data.
                To connect live Shiprocket API, add credentials to{' '}
                <code className="text-black bg-[#F2F2F2] px-1 py-0.5 rounded font-mono">.env.local</code>:
              </p>
              <div className="mt-2 p-2.5 rounded bg-[#F8F8F8] font-mono text-[10px] text-[#333333] space-y-0.5 border border-[#EAEAEA]">
                <div><span className="text-[#FF4D00] font-bold">SHIPROCKET_EMAIL</span>=jeevanmushini43@gmail.com</div>
                <div><span className="text-[#FF4D00] font-bold">SHIPROCKET_PASSWORD</span>=yourpassword</div>
                <div><span className="text-[#FF4D00] font-bold">SHIPROCKET_PICKUP_PINCODE</span>=560054</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── API Endpoints Reference ── */}
      <div className="p-5 rounded-xl bg-white border border-[#EAEAEA] shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-black" />
          <h3 className="text-xs font-bold text-black uppercase tracking-widest font-mono">Integrated API Endpoints</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { method: 'POST', path: '/api/shipping/serviceability', desc: 'Check pincode serviceability & rates' },
            { method: 'POST', path: '/api/shipping/rates', desc: 'Get courier rates & estimated delivery dates' },
            { method: 'POST', path: '/api/shipping/create-order', desc: 'Create shipment in Shiprocket & get AWB' },
            { method: 'GET', path: '/api/shipping/track?id={awb}', desc: 'Track shipment live by AWB' },
            { method: 'POST', path: '/api/shipping/cancel', desc: 'Cancel order(s) with courier' },
            { method: 'POST', path: '/api/shipping/manifest', desc: 'Generate pickup manifest' },
            { method: 'GET', path: '/api/shipping/ndr', desc: 'Fetch NDR (failed deliveries)' },
            { method: 'POST', path: '/api/shipping/webhook', desc: 'Shiprocket live webhook receiver' },
          ].map(({ method, path, desc }) => (
            <div key={path} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#FAFAFA] border border-[#EEEEEE]">
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                method === 'GET' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#DBEAFE] text-[#2563EB]'
              }`}>
                {method}
              </span>
              <div>
                <div className="text-[11px] font-mono text-black font-semibold">{path}</div>
                <div className="text-[10px] text-[#777777] font-mono">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two Column: Serviceability + Rates ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Serviceability Checker */}
        <div className="p-5 rounded-xl bg-white border border-[#EAEAEA] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-black" />
            <h3 className="text-xs font-bold text-black uppercase tracking-widest font-mono">Live Serviceability Check</h3>
          </div>

          <form onSubmit={checkServiceability} className="space-y-3">
            <div>
              <label className="text-[11px] font-mono font-semibold text-[#555555] mb-1 block uppercase">Delivery Pincode</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="e.g. 110001"
                maxLength={6}
                className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-[#555555]">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={cod}
                  onChange={(e) => setCod(e.target.checked)}
                  className="rounded text-black focus:ring-black"
                />
                COD Required
              </label>
              <div className="flex-1">
                <label className="block text-[10px] mb-1 font-semibold uppercase">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min="0.1"
                  max="10"
                  step="0.1"
                  className="w-full bg-white border border-[#D5D5D5] focus:border-black rounded-lg px-2 py-1.5 text-xs text-black outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCheckingServiceability || pincode.length !== 6}
              className="w-full py-2.5 rounded-lg bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
            >
              {isCheckingServiceability ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              Check Serviceability
            </button>
          </form>

          {serviceabilityResult && (
            <div className="mt-4">
              {serviceabilityResult.isServiceable ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#16A34A] text-xs font-mono font-bold">
                    <CheckCircle className="w-4 h-4" />
                    <span>SERVICEABLE {serviceabilityResult.city ? `— ${serviceabilityResult.city}, ${serviceabilityResult.state}` : ''}</span>
                  </div>
                  {serviceabilityResult.availableCouriers.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAFAFA] border border-[#EEEEEE]">
                      <div>
                        <div className="text-xs text-black font-semibold font-mono">{c.courierName}</div>
                        <div className="text-[10px] text-[#666666] font-mono">ETA: {c.estimatedDeliveryDays}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-black font-mono">₹{c.rate}</div>
                        {c.codAvailable && <div className="text-[9px] text-[#16A34A] font-mono font-bold">COD Available</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#DC2626] text-xs font-mono">
                  <XCircle className="w-4 h-4" />
                  <span>{serviceabilityResult.error || 'Not serviceable for this destination pincode'}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rate Calculator */}
        <div className="p-5 rounded-xl bg-white border border-[#EAEAEA] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-black" />
            <h3 className="text-xs font-bold text-black uppercase tracking-widest font-mono">Live Rate Calculator</h3>
          </div>

          <form onSubmit={fetchRates} className="space-y-3">
            <div>
              <label className="text-[11px] font-mono font-semibold text-[#555555] mb-1 block uppercase">Destination Pincode</label>
              <input
                type="text"
                value={ratesPincode}
                onChange={(e) => setRatesPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="e.g. 400001"
                maxLength={6}
                className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isLoadingRates || ratesPincode.length !== 6}
              className="w-full py-2.5 rounded-lg bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
            >
              {isLoadingRates ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Truck className="w-3.5 h-3.5" />
              )}
              Fetch Courier Rates
            </button>
          </form>

          {rates !== null && (
            <div className="mt-4 space-y-2">
              {rates.length === 0 ? (
                <p className="text-xs text-[#888888] font-mono">No rates available for this pincode.</p>
              ) : (
                rates.map((r, i) => (
                  <div key={i} className={`p-2.5 rounded-lg border ${r.isRecommended ? 'bg-[#FFF7ED] border-[#FDBA74]' : 'bg-[#FAFAFA] border-[#EEEEEE]'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black font-semibold font-mono">{r.courierName}</span>
                        {r.isRecommended && (
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-black text-white font-bold uppercase">BEST</span>
                        )}
                      </div>
                      <span className="text-sm font-black text-black font-mono">₹{r.rate}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[#666666] font-mono">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.estimatedDeliveryDays}</span>
                      {r.codAvailable && <span>COD: ₹{r.codCharges}</span>}
                      <span>⭐ {r.rating}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Webhook Configuration ── */}
      <div className="p-5 rounded-xl bg-white border border-[#EAEAEA] shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-black" />
          <h3 className="text-xs font-bold text-black uppercase tracking-widest font-mono">Webhook Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <p className="text-xs text-[#666666] leading-relaxed mb-3">
              Configure this webhook URL in your Shiprocket Dashboard to receive real-time shipping status and tracking updates automatically.
            </p>
            <div className="p-3 rounded-lg bg-[#F8F8F8] border border-[#EAEAEA]">
              <div className="text-[10px] font-mono text-[#888888] mb-1 font-semibold uppercase">Webhook Endpoint URL</div>
              <div className="text-xs font-mono text-black font-bold break-all">https://goatednation.com/api/shipping/webhook</div>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono text-[#555555] mb-2 uppercase tracking-widest font-semibold">Supported Real-Time Events</div>
            <div className="space-y-1">
              {[
                'shipment.booked', 'shipment.pickup_scheduled', 'shipment.manifested',
                'shipment.in_transit', 'shipment.out_for_delivery',
                'shipment.delivered', 'shipment.rto_initiated', 'shipment.ndr',
              ].map((evt) => (
                <div key={evt} className="flex items-center gap-2 text-[11px] font-mono text-[#444444]">
                  <ChevronRight className="w-3 h-3 text-[#FF4D00]" />
                  {evt}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] flex items-start gap-3 shadow-sm">
        <Info className="w-4 h-4 text-[#FF4D00] mt-0.5 shrink-0" />
        <div className="text-xs text-[#666666] leading-relaxed font-mono">
          <span className="text-black font-bold">Shiprocket Live Integration:</span>{' '}
          Connected with authorized JWT tokens and live courier serviceability.
          Pickup warehouse pincode is set to <code className="text-black bg-[#EFEFEF] px-1 rounded font-bold">{process.env.PRIVATE_SHIPROCKET_PICKUP_PINCODE || process.env.NEXT_PUBLIC_SHIPROCKET_PICKUP_PINCODE || '560054'}</code>.
          Real courier companies (Xpressbees, Blue Dart, Delhivery) are dynamically fetched with live rates.
        </div>
      </div>

      {/* ── Shipment Status Reference ── */}
      <div className="p-5 rounded-xl bg-white border border-[#EAEAEA] shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-black" />
          <h3 className="text-xs font-bold text-black uppercase tracking-widest font-mono">Shipment Lifecycle Reference</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { status: 'ORDER_PLACED', label: 'Order Placed', color: '#888888' },
            { status: 'MANIFESTED', label: 'Manifested', color: '#2563EB' },
            { status: 'IN_TRANSIT', label: 'In Transit', color: '#D97706' },
            { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: '#7C3AED' },
            { status: 'DELIVERED', label: 'Delivered', color: '#16A34A' },
          ].map(({ status, label, color }) => (
            <div key={status} className="p-3 rounded-lg bg-[#FAFAFA] border border-[#EEEEEE] text-center">
              <div
                className="w-2.5 h-2.5 rounded-full mx-auto mb-2"
                style={{ backgroundColor: color }}
              />
              <div className="text-[10px] font-mono text-black font-semibold uppercase">{label}</div>
              <div className="text-[8px] font-mono text-[#888888] mt-0.5">{status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
