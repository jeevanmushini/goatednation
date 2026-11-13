'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Lock, Mail, User as UserIcon, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, Key } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types/auth';
import { ZeninAnnouncementBar } from '../../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../../components/zenin/ZeninHeader';
import { ZeninFooter } from '../../components/zenin/ZeninFooter';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';

  const { register, user, isAuthenticated, checkAuth } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [adminKey, setAdminKey] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    const res = await register({
      name,
      email,
      password,
      role,
      adminKey: role === 'ADMIN' ? adminKey : undefined,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Failed to create account.');
      return;
    }

    setSuccess(`Account created successfully! Welcome to GOATED NATION, ${res.user?.name}.`);
    setTimeout(() => {
      if (redirectPath) {
        router.push(redirectPath);
      } else if (res.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }, 700);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-black antialiased selection:bg-[#FF4D00] selection:text-white">
      {/* 1. Zenin Announcement Bar */}
      <ZeninAnnouncementBar />

      {/* 2. Zenin Minimalist Header */}
      <ZeninHeader />

      {/* 3. Main Register Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-14 sm:py-20 bg-[#FBFBFB]">
        <div className="w-full max-w-md">
          {/* Top Kanji & Section Badge */}
          <div className="text-center mb-8">
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase text-[#777777] bg-white px-3.5 py-1 rounded-full border border-[#E5E5E5] shadow-xs">
              新規登録 // JOIN THE SYNDICATE
            </span>
            <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight uppercase text-black mt-3">
              CREATE YOUR ACCOUNT
            </h1>
            <p className="text-xs font-mono text-[#666666] mt-1 tracking-wide">
              Unlock exclusive drops, order tracking & syndicate membership
            </p>
          </div>

          {/* Card Body */}
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 sm:p-8 shadow-xs">
            {/* Google OAuth Quick Sign-Up */}
            <div className="mb-6">
              <a
                href={`/api/auth/oauth/google?role=${role}${redirectPath ? `&redirect=${encodeURIComponent(redirectPath)}` : ''}`}
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
                <span className="font-semibold text-[#222222]">Sign up with Google</span>
              </a>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-[#EAEAEA] w-full" />
              <span className="bg-white px-3 text-[10px] font-mono text-[#999999] uppercase tracking-widest absolute">
                OR REGISTER WITH EMAIL
              </span>
            </div>

            {/* Error Message */}
            {error && (
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#444444] mb-1.5 font-bold">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ken Kaneki"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAFAFA] focus:bg-white border border-[#DCDCDC] focus:border-black rounded-lg text-xs font-mono text-black outline-none transition-all placeholder-[#AAAAAA]"
                  />
                </div>
              </div>

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

              {/* Role Selection Switcher */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#444444] mb-1.5 font-bold">
                  Account Type (RBAC)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('CUSTOMER')}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono tracking-wider uppercase transition-all flex items-center justify-center space-x-1.5 ${
                      role === 'CUSTOMER'
                        ? 'border-black bg-black text-white font-bold shadow-xs'
                        : 'border-[#E0E0E0] bg-[#FAFAFA] text-[#666666] hover:border-black'
                    }`}
                  >
                    <span>Customer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono tracking-wider uppercase transition-all flex items-center justify-center space-x-1.5 ${
                      role === 'ADMIN'
                        ? 'border-[#FF4D00] bg-[#FF4D00] text-white font-bold shadow-xs'
                        : 'border-[#E0E0E0] bg-[#FAFAFA] text-[#666666] hover:border-[#FF4D00]'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Administrator</span>
                  </button>
                </div>
              </div>

              {/* Admin Key (Only shown if Admin role selected) */}
              {role === 'ADMIN' && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-1.5 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#FF4D00] font-bold flex items-center space-x-1">
                      <Key className="w-3 h-3" />
                      <span>Admin Syndicate Clearance Key</span>
                    </label>
                    <span className="text-[9px] font-mono text-[#888888]">Key: GOATED_ADMIN_2026</span>
                  </div>
                  <input
                    type="password"
                    required
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter GOATED_ADMIN_2026"
                    className="w-full px-3 py-2 bg-white border border-orange-300 focus:border-[#FF4D00] rounded text-xs font-mono outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#444444] mb-1.5 font-bold">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
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

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#444444] mb-1.5 font-bold">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAFAFA] focus:bg-white border border-[#DCDCDC] focus:border-black rounded-lg text-xs font-mono text-black outline-none transition-all placeholder-[#AAAAAA]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3 px-4 rounded-lg bg-black hover:bg-[#222222] text-white text-xs font-mono uppercase tracking-widest font-bold flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-md disabled:opacity-50"
              >
                <span>{isSubmitting ? 'CREATING ACCOUNT...' : 'REGISTER / 新規登録'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Footer link to Login */}
            <div className="mt-6 pt-5 border-t border-[#F0F0F0] text-center">
              <p className="text-xs font-mono text-[#666666]">
                Already have an account?{' '}
                <Link
                  href={`/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                  className="font-bold text-black underline underline-offset-4 hover:text-[#FF4D00] transition-colors"
                >
                  Sign In &rarr;
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <RegisterForm />
    </Suspense>
  );
}

