'use client';

import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, CheckCircle2, Sliders, Globe, Shield, Phone, Mail, Instagram, Twitter, Youtube, Truck } from 'lucide-react';
import { useCmsStore } from '../../../lib/cms/cmsStore';
import { CmsSiteSettings } from '../../../types/cms';

export default function AdminSettingsPage() {
  const currentSettings = useCmsStore((state) => state.settings);
  const updateSettings = useCmsStore((state) => state.updateSettings);
  const publishChanges = useCmsStore((state) => state.publishChanges);
  const resetToDefaults = useCmsStore((state) => state.resetToDefaults);

  const [formData, setFormData] = useState<CmsSiteSettings>({ ...currentSettings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Google OAuth Settings State
  const [oauthData, setOauthData] = useState({
    googleClientId: '',
    googleClientSecret: '',
  });
  const [oauthStatus, setOauthStatus] = useState({
    googleConfigured: false,
    callbackUrl: 'http://localhost:3000/api/auth/oauth/callback',
  });
  const [oauthSaveSuccess, setOauthSaveSuccess] = useState(false);
  const [isSavingOauth, setIsSavingOauth] = useState(false);

  useEffect(() => {
    fetch('/api/admin/oauth-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOauthData({
            googleClientId: data.google.clientId || '',
            googleClientSecret: '',
          });
          setOauthStatus({
            googleConfigured: data.google.configured,
            callbackUrl: data.callbackUrl || 'http://localhost:3000/api/auth/oauth/callback',
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveOauth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOauth(true);
    try {
      const res = await fetch('/api/admin/oauth-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oauthData),
      });
      const data = await res.json();
      if (data.success) {
        setOauthStatus((prev) => ({
          ...prev,
          googleConfigured: data.googleConfigured,
        }));
        setOauthSaveSuccess(true);
        setTimeout(() => setOauthSaveSuccess(false), 3000);
      }
    } catch {
      //
    } finally {
      setIsSavingOauth(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'freeShippingThreshold') {
      setFormData((prev) => ({ ...prev, [name]: Number(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    publishChanges();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset settings to original defaults?')) {
      resetToDefaults();
      setFormData({ ...useCmsStore.getState().settings });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAEAEA]">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF4D00]">
            STORE CONFIGURATION
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight mt-1 flex items-center gap-2 font-mono">
            <Sliders className="w-6 h-6 text-black" />
            Global Site Settings
          </h1>
          <p className="text-xs text-[#666666] mt-1 font-mono">
            Manage global storefront branding, announcement banner, contact info, and social media handles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-lg bg-white border border-[#D5D5D5] text-xs font-mono font-medium text-[#555555] hover:text-black hover:border-black transition-colors flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            Save & Publish
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] text-[#16A34A] flex items-center gap-3 text-xs font-mono font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          Settings updated and published successfully to live storefront components!
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Brand & Identity Section */}
        <div className="p-6 rounded-xl bg-white border border-[#EAEAEA] shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EAEAEA]">
            <Globe className="w-4 h-4 text-black" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-black font-mono">
              Brand Identity
            </h2>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-semibold text-[#555555] mb-1.5">
              Brand Name
            </label>
            <input
              type="text"
              name="brandName"
              value={formData.brandName}
              onChange={handleChange}
              className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              placeholder="e.g. GOATED NATION"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-semibold text-[#555555] mb-1.5">
              Brand Tagline
            </label>
            <input
              type="text"
              name="brandTagline"
              value={formData.brandTagline}
              onChange={handleChange}
              className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              placeholder="e.g. Wear the Culture • High-Fashion Anime Streetwear"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-semibold text-[#555555] mb-1.5">
              Logo Subtext (Japanese/English Katakana)
            </label>
            <input
              type="text"
              name="logoSubtext"
              value={formData.logoSubtext}
              onChange={handleChange}
              className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              placeholder="e.g. アニメストリート // TOKYO • MUMBAI"
            />
          </div>
        </div>

        {/* Announcement Bar Section */}
        <div className="p-6 rounded-xl bg-white border border-[#EAEAEA] shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EAEAEA]">
            <Truck className="w-4 h-4 text-black" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-black font-mono">
              Announcement & Logistics
            </h2>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#FAFAFA] border border-[#EEEEEE]">
            <div>
              <span className="text-xs font-bold text-black uppercase font-mono block">
                Announcement Bar
              </span>
              <span className="text-[11px] text-[#777777] font-mono">
                Display rolling top promotional marquee
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="announcementEnabled"
                checked={formData.announcementEnabled}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#D5D5D5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-semibold text-[#555555] mb-1.5">
              Announcement Message
            </label>
            <textarea
              name="announcementText"
              rows={2}
              value={formData.announcementText}
              onChange={handleChange}
              className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono resize-none"
              placeholder="e.g. FREE EXPRESS SHIPPING OVER ₹999..."
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-semibold text-[#555555] mb-1.5">
              Free Shipping Threshold (₹)
            </label>
            <input
              type="number"
              name="freeShippingThreshold"
              value={formData.freeShippingThreshold}
              onChange={handleChange}
              className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              placeholder="999"
            />
          </div>
        </div>

        {/* Customer Support & Contact */}
        <div className="p-6 rounded-xl bg-white border border-[#EAEAEA] shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EAEAEA]">
            <Shield className="w-4 h-4 text-black" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-black font-mono">
              Customer Support & Contact
            </h2>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-semibold text-[#555555] mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-black" />
              Support Email
            </label>
            <input
              type="email"
              name="supportEmail"
              value={formData.supportEmail}
              onChange={handleChange}
              className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              placeholder="support@goatednation.in"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-semibold text-[#555555] mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-black" />
              Support Phone / WhatsApp
            </label>
            <input
              type="text"
              name="supportPhone"
              value={formData.supportPhone}
              onChange={handleChange}
              className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-semibold text-[#555555] mb-1.5">
              Storefront Physical Address / Hub
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              placeholder="e.g. GOATED NATION Hub, Harajuku Road, Bangalore 560054"
            />
          </div>
        </div>

        {/* Social Media Links */}
        <div className="p-6 rounded-xl bg-white border border-[#EAEAEA] shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EAEAEA]">
            <Globe className="w-4 h-4 text-black" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-black font-mono">
              Social Media Channels
            </h2>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-semibold text-[#555555] mb-1.5 flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-black" />
              Instagram Profile URL
            </label>
            <input
              type="url"
              name="instagramUrl"
              value={formData.instagramUrl}
              onChange={handleChange}
              className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              placeholder="https://instagram.com/goatednation"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-semibold text-[#555555] mb-1.5 flex items-center gap-1.5">
              <Twitter className="w-3.5 h-3.5 text-black" />
              Twitter / X URL
            </label>
            <input
              type="url"
              name="twitterUrl"
              value={formData.twitterUrl}
              onChange={handleChange}
              className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              placeholder="https://twitter.com/goatednation"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-semibold text-[#555555] mb-1.5 flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5 text-black" />
              YouTube Channel URL
            </label>
            <input
              type="url"
              name="youtubeUrl"
              value={formData.youtubeUrl}
              onChange={handleChange}
              className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              placeholder="https://youtube.com/@goatednation"
            />
          </div>
        </div>

        <div className="lg:col-span-2 pt-2 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 rounded-lg bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save & Publish Settings
          </button>
        </div>
      </form>

      {/* OAuth 2.0 Credentials Card */}
      <div className="p-6 rounded-xl bg-white border border-[#EAEAEA] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#FF4D00]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-black font-mono">
              Google Cloud OAuth 2.0 Gateway
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className={`w-2 h-2 rounded-full ${oauthStatus.googleConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-[#666666]">Status: {oauthStatus.googleConfigured ? 'Active & Ready' : 'Credentials Missing'}</span>
          </div>
        </div>

        {oauthSaveSuccess && (
          <div className="p-3 rounded-lg bg-[#F0FDF4] border border-[#86EFAC] text-[#16A34A] text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Google OAuth credentials updated and saved to .env.local!</span>
          </div>
        )}

        <div className="p-3 bg-[#FAFAFA] border border-[#EAEAEA] rounded-lg text-xs font-mono space-y-1">
          <span className="text-[10px] text-[#888888] uppercase tracking-wider block">Google Cloud Authorized Redirect URI:</span>
          <div className="flex items-center justify-between font-bold text-black break-all">
            <code>{oauthStatus.callbackUrl}</code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(oauthStatus.callbackUrl);
                alert('Copied callback URL to clipboard!');
              }}
              className="px-2 py-0.5 text-[10px] bg-white border border-[#CCCCCC] rounded hover:border-black shrink-0 ml-2 cursor-pointer"
            >
              Copy
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveOauth} className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Google Credentials */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase text-[#555555] font-semibold">
              Google Client ID
            </label>
            <input
              type="text"
              value={oauthData.googleClientId}
              onChange={(e) => setOauthData({ ...oauthData, googleClientId: e.target.value })}
              placeholder="xxxx.apps.googleusercontent.com"
              className="w-full bg-white border border-[#D5D5D5] focus:border-black rounded-lg px-3 py-2 text-xs font-mono outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase text-[#555555] font-semibold">
              Google Client Secret
            </label>
            <input
              type="password"
              value={oauthData.googleClientSecret}
              onChange={(e) => setOauthData({ ...oauthData, googleClientSecret: e.target.value })}
              placeholder="GOCSPX-xxxxxxxxxxxxxx"
              className="w-full bg-white border border-[#D5D5D5] focus:border-black rounded-lg px-3 py-2 text-xs font-mono outline-none"
            />
          </div>

          <div className="md:col-span-2 pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingOauth}
              className="px-6 py-2.5 rounded-lg bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingOauth ? 'Saving...' : 'Save Google OAuth Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
