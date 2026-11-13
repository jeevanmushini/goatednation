'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Shield, User, Mail, Truck, Heart, LogOut, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { ZeninAnnouncementBar } from '../../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../../components/zenin/ZeninHeader';
import { ZeninFooter } from '../../components/zenin/ZeninFooter';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/account');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <ZeninAnnouncementBar />
        <ZeninHeader />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3 font-mono">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-widest text-[#666666]">
              AUTHENTICATING CLEARANCE...
            </p>
          </div>
        </div>
        <ZeninFooter />
      </div>
    );
  }

  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-black antialiased selection:bg-[#FF4D00] selection:text-white">
      <ZeninAnnouncementBar />
      <ZeninHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-8 border-b border-[#EAEAEA] gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#888888]">
              ユーザーアカウント // MEMBER CLEARANCE
            </span>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight uppercase text-black mt-1">
              MY ACCOUNT
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2 rounded-lg bg-black hover:bg-[#222222] text-white text-xs font-mono uppercase tracking-wider font-bold flex items-center space-x-2 transition-all shadow-sm"
              >
                <Shield className="w-3.5 h-3.5 text-[#FF4D00]" />
                <span>Admin Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="px-4 py-2 rounded-lg border border-[#D0D0D0] hover:border-black hover:bg-black hover:text-white text-xs font-mono uppercase tracking-wider transition-colors flex items-center space-x-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* User Card & RBAC Badge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Profile Overview Card */}
          <div className="md:col-span-2 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-black/5 border-2 border-black/10 shrink-0">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-mono font-bold text-xl text-black">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-mono font-bold uppercase text-black">{user.name}</h2>
                  <div className="flex items-center space-x-1.5 text-xs font-mono text-[#666666] mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isAdmin
                          ? 'bg-[#FF4D00] text-white shadow-xs'
                          : 'bg-black text-white'
                      }`}
                    >
                      {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      <span>{user.role} CLEARANCE</span>
                    </span>

                    <span className="text-[10px] font-mono text-[#888888] uppercase bg-white border border-[#E0E0E0] px-2 py-0.5 rounded">
                      Via {user.provider}
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block text-right">
                <span className="text-[9px] font-mono text-[#999999] uppercase tracking-wider block">
                  Member Since
                </span>
                <span className="text-xs font-mono text-black font-medium">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Admin Privilege Banner if Admin */}
            {isAdmin && (
              <div className="mt-6 pt-6 border-t border-[#EAEAEA] flex items-center justify-between bg-orange-50/70 border border-orange-200/60 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#FF4D00] text-white flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase text-black">
                      Full Admin Syndicate Privileges Active
                    </h3>
                    <p className="text-[10px] font-mono text-[#666666] mt-0.5">
                      You can modify homepage images, products, logistics & Shiprocket settings.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin"
                  className="px-3.5 py-1.5 bg-[#FF4D00] hover:bg-[#e04400] text-white rounded text-[11px] font-mono uppercase font-bold tracking-wider transition-colors shrink-0"
                >
                  Enter Portal &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Security & Access Info Card */}
          <div className="bg-white border border-[#EAEAEA] rounded-xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#888888] uppercase tracking-widest block mb-2">
                Security Status
              </span>
              <div className="flex items-center space-x-2 text-xs font-mono text-emerald-600 font-bold mb-4">
                <CheckCircle2 className="w-4 h-4" />
                <span>JWT Signed Session Active</span>
              </div>

              <div className="space-y-2.5 text-xs font-mono text-[#555555]">
                <div className="flex justify-between pb-2 border-b border-[#F0F0F0]">
                  <span>Role Permission:</span>
                  <span className="font-bold text-black">{user.role}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#F0F0F0]">
                  <span>Authentication:</span>
                  <span className="uppercase text-black">{user.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cookie Type:</span>
                  <span className="text-black">HTTP-Only / Lax</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F0F0F0]">
              <div className="flex items-center space-x-2 text-[10px] font-mono text-[#888888]">
                <Lock className="w-3.5 h-3.5" />
                <span>Protected by Industry-Grade RBAC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Nav Shortcut Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/track"
            className="p-5 rounded-xl border border-[#EAEAEA] hover:border-black bg-white hover:bg-[#FAFAFA] transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-black/5 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors mb-3">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              Order Tracking
            </h3>
            <p className="text-[10px] font-mono text-[#777777] mt-1">
              Track Shiprocket AWB shipments in real time.
            </p>
          </Link>

          <Link
            href="/wishlist"
            className="p-5 rounded-xl border border-[#EAEAEA] hover:border-black bg-white hover:bg-[#FAFAFA] transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-black/5 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors mb-3">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              Wishlist Archive
            </h3>
            <p className="text-[10px] font-mono text-[#777777] mt-1">
              Saved anime streetwear garments and drops.
            </p>
          </Link>

          <Link
            href="/collections"
            className="p-5 rounded-xl border border-[#EAEAEA] hover:border-black bg-white hover:bg-[#FAFAFA] transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-black/5 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors mb-3">
              <ArrowRight className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              All Collections
            </h3>
            <p className="text-[10px] font-mono text-[#777777] mt-1">
              Browse newly arrived Tokyo editorial pieces.
            </p>
          </Link>
        </div>
      </main>

      <ZeninFooter />
    </div>
  );
}

