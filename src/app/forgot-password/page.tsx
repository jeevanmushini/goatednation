'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, KeyRound, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, RotateCw } from 'lucide-react';
import { ZeninAnnouncementBar } from '../../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../../components/zenin/ZeninHeader';
import { ZeninFooter } from '../../components/zenin/ZeninFooter';

function ForgotPasswordForm() {
  const router = useRouter();

  // Step 1: Request OTP | Step 2: Verify OTP & Reset
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Input refs for 6 OTP boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer cooldown effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Focus first digit box when transitioning to Step 2
  useEffect(() => {
    if (step === 2 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  // Step 1: Submit email to request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      setIsLoading(false);
      if (!data.success) {
        setError(data.error || 'Failed to dispatch verification code.');
        return;
      }

      setStep(2);
      setResendCooldown(60);
      setSuccess(`6-digit security code dispatched to ${email}.`);
    } catch {
      setIsLoading(false);
      setError('Network communication failed. Please check your connection.');
    }
  };

  // Handle OTP digit changes & auto-advance
  const handleDigitChange = (index: number, value: string) => {
    // Handle paste of 6 digits
    if (value.length > 1) {
      const cleaned = value.replace(/\D/g, '').slice(0, 6);
      if (cleaned.length > 0) {
        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = cleaned[i] || '';
        }
        setOtpDigits(newDigits);
        const nextIndex = Math.min(cleaned.length, 5);
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    // Single digit input
    const char = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle keyboard backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (!data.success) {
        setError(data.error || 'Failed to resend verification code.');
        return;
      }

      setResendCooldown(60);
      setSuccess('A new 6-digit code has been dispatched to your email.');
    } catch {
      setIsLoading(false);
      setError('Communication failed. Please try again.');
    }
  };

  // Step 2: Submit OTP & Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    if (newPassword.length < 8 || !/[0-9]/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) {
      setError('Password must be at least 8 characters long and contain both letters and numbers.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: fullOtp,
          newPassword,
        }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (!data.success) {
        setError(data.error || 'Verification failed.');
        return;
      }

      setSuccess('Password updated successfully. Redirecting to sign in...');
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 1000);
    } catch {
      setIsLoading(false);
      setError('Network communication failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-black antialiased selection:bg-[#FF4D00] selection:text-white">
      {/* 1. Zenin Announcement Bar */}
      <ZeninAnnouncementBar />

      {/* 2. Zenin Minimalist Header */}
      <ZeninHeader />

      {/* 3. Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-14 sm:py-20 bg-[#FBFBFB]">
        <div className="w-full max-w-md">
          {/* Top Badge & Header */}
          <div className="text-center mb-8">
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase text-[#777777] bg-white px-3.5 py-1 rounded-full border border-[#E5E5E5] shadow-xs">
              セキュリティ // CREDENTIAL RECOVERY
            </span>
            <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight uppercase text-black mt-3">
              {step === 1 ? 'RESET YOUR PASSWORD' : 'ENTER VERIFICATION CODE'}
            </h1>
            <p className="text-xs font-mono text-[#666666] mt-1 tracking-wide">
              {step === 1
                ? 'Enter your syndicate email to receive a 6-digit cryptographic security code'
                : `6-digit security code sent to ${email}`}
            </p>
          </div>

          {/* Card Body */}
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 sm:p-8 shadow-xs">
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

            {step === 1 ? (
              /* ================= STEP 1: REQUEST CODE ================= */
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#444444] mb-1.5 font-bold">
                    Registered Email Address
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-lg bg-black hover:bg-[#222222] text-white text-xs font-mono uppercase tracking-widest font-bold flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-md disabled:opacity-50"
                >
                  <span>{isLoading ? 'DISPATCHING CODE...' : 'SEND VERIFICATION CODE'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* ================= STEP 2: VERIFY OTP & RESET ================= */
              <form onSubmit={handleResetPassword} className="space-y-5">
                {/* 6 Digit Numeric Boxes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-[#444444] font-bold">
                      6-Digit Security Code
                    </label>
                    <span className="text-[10px] font-mono text-[#888888]">10m Expiry</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-13 text-center text-base sm:text-lg font-mono font-bold bg-[#FAFAFA] focus:bg-white border-2 border-[#DCDCDC] focus:border-black rounded-lg text-black outline-none transition-all shadow-xs"
                      />
                    ))}
                  </div>

                  {/* Resend Cooldown Counter */}
                  <div className="mt-2.5 text-right">
                    {resendCooldown > 0 ? (
                      <span className="text-[10px] font-mono text-[#888888]">
                        Resend code in {resendCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="text-[10px] font-mono font-bold text-black hover:text-[#FF4D00] inline-flex items-center space-x-1 transition-colors"
                      >
                        <RotateCw className="w-3 h-3 mr-1" />
                        <span>Resend Code</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#444444] mb-1.5 font-bold">
                    New Password (Min. 8 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#444444] mb-1.5 font-bold">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#FAFAFA] focus:bg-white border border-[#DCDCDC] focus:border-black rounded-lg text-xs font-mono text-black outline-none transition-all placeholder-[#AAAAAA]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-black p-1 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-lg bg-black hover:bg-[#222222] text-white text-xs font-mono uppercase tracking-widest font-bold flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-md disabled:opacity-50"
                >
                  <span>{isLoading ? 'UPDATING CREDENTIALS...' : 'VERIFY & RESET PASSWORD'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Back to Login Link */}
            <div className="mt-6 pt-5 border-t border-[#F0F0F0] text-center">
              <Link
                href="/login"
                className="text-xs font-mono text-[#666666] hover:text-black transition-colors"
              >
                &larr; Return to Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Zenin Minimalist Pitch-Black Footer */}
      <ZeninFooter />
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
