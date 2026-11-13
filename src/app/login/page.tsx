'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { ZeninAnnouncementBar } from '../../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../../components/zenin/ZeninHeader';
import { ZeninFooter } from '../../components/zenin/ZeninFooter';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || searchParams.get('redirectTo') || '';
  const errorParam = searchParams.get('error');
  const detailsParam = searchParams.get('details');

  const initialError = errorParam
    ? errorParam === 'GoogleCredentialsMissing'
      ? 'GOOGLE_CREDENTIALS_MISSING'
      : errorParam === 'OAuthFailed'
      ? detailsParam || 'Google authentication failed. Please try again or sign in with your email credentials.'
      : errorParam === 'SessionExpired'
      ? 'Your session has expired. Please sign in again.'
      : errorParam === 'AdminRequired'
      ? 'Admin privileges required. Please sign in with an Administrator account.'
      : errorParam
    : null;

  const { login, user, isAuthenticated, checkAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // If already logged in, redirect appropriately
  useEffect(() => {
    if (isAuthenticated && user) {
      if (redirectPath) {
        router.push(redirectPath);
      } else if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/account');
      }
    }
  }, [isAuthenticated, user, redirectPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Invalid email or password.');
      return;
    }

    setSuccess(`Welcome back, ${res.user?.name}!`);
    setTimeout(() => {
      if (redirectPath) {
        router.push(redirectPath);
      } else if (res.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }, 600);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-black antialiased selection:bg-[#FF4D00] selection:text-white">
      {/* 1. Zenin Announcement Bar */}
      <ZeninAnnouncementBar />

      {/* 2. Zenin Minimalist Header */}
      <ZeninHeader />

      {/* 3. Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-14 sm:py-20 bg-[#FBFBFB]">
        <div className="w-full max-w-md">
          {/* Top Kanji & Section Badge */}
          <div className="text-center mb-8">
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase text-[#777777] bg-white px-3.5 py-1 rounded-full border border-[#E5E5E5] shadow-xs">
              ログイン // AUTHENTICATION GATEWAY
            </span>
            <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight uppercase text-black mt-3">
              SIGN IN TO GOATED NATION
            </h1>
            <p className="text-xs font-mono text-[#666666] mt-1 tracking-wide">
              Access your syndicate orders, wishlist & admin clearance
            </p>
          </div>

          {/* Card Body */}
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 sm:p-8 shadow-xs">
            {/* Google OAuth Social Sign In */}
            <div className="mb-6">
              <a
                href={`/api/auth/oauth/google?role=CUSTOMER${redirectPath ? `&redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-lg border border-[#DCDCDC] hover:border-black bg-white hover:bg-[#F9F9F9] text-xs font-mono tracking-wider uppercase transition-all shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="font-semibold text-[#222222]">Continue with Google</span>
              </a>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-[#EAEAEA] w-full" />
              <span className="bg-white px-3 text-[10px] font-mono text-[#999999] uppercase tracking-widest absolute">
                OR SIGN IN WITH EMAIL
              </span>
            </div>

            {/* Google Credentials Missing Setup Guide Notice */}
            {error === 'GOOGLE_CREDENTIALS_MISSING' && (
              <div className="mb-5 p-4 rounded-lg bg-amber-50/80 border border-amber-300 text-xs font-mono space-y-2">
                <div className="flex items-center space-x-2 text-amber-900 font-bold">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Google OAuth Configuration Required</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  To sign in with Google, please add your Google Client ID and Secret to <code className="bg-amber-100 px-1 py-0.5 rounded font-bold">.env.local</code>:
                </p>
                <div className="bg-white/80 p-2.5 rounded border border-amber-200 text-[10px] space-y-1 text-black font-mono">
                  <div>GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com</div>
                  <div>GOOGLE_CLIENT_SECRET=your_google_client_secret</div>
                  <div className="text-[#666666] pt-1">
                    Authorized redirect URI: <code className="text-black font-bold">http://localhost:3000/api/auth/oauth/callback</code>
                  </div>
                </div>
              </div>
            )}

            {/* General Error Message */}
            {error && error !== 'GOOGLE_CREDENTIALS_MISSING' && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-2 text-xs font-mono text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start space-x-2 text-xs font-mono text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            {/* Email + Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#444444] mb-1.5 font-bold">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAFAFA] focus:bg-white border border-[#DCDCDC] focus:border-black rounded-lg text-xs font-mono text-black outline-none transition-all placeholder-[#AAAAAA]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#444444] font-bold">
                    Password
                  </label>
                  <span className="text-[10px] font-mono text-[#888888] hover:text-black cursor-pointer transition-colors">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FAFAFA] focus:bg-white border border-[#DCDCDC] focus:border-black rounded-lg text-xs font-mono text-black outline-none transition-all placeholder-[#AAAAAA]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-black p-1 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-lg bg-black hover:bg-[#222222] text-white text-xs font-mono uppercase tracking-widest font-bold flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-md disabled:opacity-50"
              >
                <span>{isSubmitting ? 'AUTHENTICATING...' : 'SIGN IN / ログイン'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Footer link to Register */}
            <div className="mt-6 pt-5 border-t border-[#F0F0F0] text-center">
              <p className="text-xs font-mono text-[#666666]">
                Don&apos;t have an account yet?{' '}
                <Link
                  href={`/register${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                  className="font-bold text-black underline underline-offset-4 hover:text-[#FF4D00] transition-colors"
                >
                  Create Account &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Zenin Minimalist Pitch-Black Footer */}
      <ZeninFooter />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginForm />
    </Suspense>
  );
}
