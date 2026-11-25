'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Search,
  Lock,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Mail,
  ArrowUpRight,
  Shield,
  KeyRound,
  X,
} from 'lucide-react';
import { AdminUserListItem, AdminTeamMetrics } from '../../../lib/auth/userDb';

export default function AdminTeamPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [metrics, setMetrics] = useState<AdminTeamMetrics>({
    totalUsers: 0,
    totalAdmins: 0,
    totalCustomers: 0,
    googleOauthUsers: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'CUSTOMER'>('ALL');
  const [directEmailInput, setDirectEmailInput] = useState('');

  // Modal Confirmation Guard State
  const [pendingAction, setPendingAction] = useState<{
    user: AdminUserListItem | { email: string; name: string };
    targetRole: 'ADMIN' | 'CUSTOMER';
  } | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchTeamData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);

      const res = await fetch(`/api/admin/team?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        if (data.metrics) setMetrics(data.metrics);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load team roster:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeamData();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTeamData]);

  const handleRoleChange = async (email: string, targetRole: 'ADMIN' | 'CUSTOMER') => {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/team/role', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, targetRole }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setActionError(data.error || 'Failed to update clearance level.');
          return;
        }

        setActionSuccess(data.message || `Clearance successfully updated for ${email}.`);
        setPendingAction(null);
        setDirectEmailInput('');
        await fetchTeamData();
      } catch (err) {
        console.error('Role update error:', err);
        setActionError('Network error while updating clearance.');
      }
    });
  };

  const handleDirectPromote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directEmailInput.trim()) return;

    setPendingAction({
      user: {
        email: directEmailInput.trim(),
        name: 'New Administrator',
      },
      targetRole: 'ADMIN',
    });
  };

  return (
    <div className="space-y-8 pb-16 font-mono text-black selection:bg-[#FF4D00] selection:text-white">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAEAEA] pb-6">
        <div>
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#777777] bg-[#F5F5F5] px-3 py-1 rounded-full border border-[#E0E0E0] inline-block mb-2">
            チーム管理 // SYNDICATE STAFF & CLEARANCE PROTOCOL
          </span>
          <h1 className="text-2xl font-bold tracking-tight uppercase flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-[#FF4D00]" />
            <span>TEAM & STAFF ACCESS MANAGEMENT</span>
          </h1>
          <p className="text-xs text-[#666666] mt-1">
            Manage role-based access control, promote staff, and revoke administrator privileges in real time.
          </p>
        </div>

        <button
          onClick={() => fetchTeamData()}
          disabled={isLoading}
          className="self-start md:self-auto flex items-center space-x-2 px-3 py-2 bg-white border border-[#DCDCDC] hover:border-black rounded-lg text-xs uppercase tracking-wider text-[#444444] hover:text-black transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* Global Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start justify-between text-xs text-red-800">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-bold">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Top Metric Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Admins */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#888888] font-bold">
              Active Administrators
            </span>
            <div className="p-2 rounded-lg bg-black text-white">
              <ShieldCheck className="w-4 h-4 text-[#FF4D00]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight">{metrics.totalAdmins}</span>
            <span className="text-[10px] text-[#777777]">Full Console Access</span>
          </div>
        </div>

        {/* Metric 2: Syndicate Collectors */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#888888] font-bold">
              Syndicate Collectors
            </span>
            <div className="p-2 rounded-lg bg-[#F5F5F5] text-black">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight">{metrics.totalCustomers}</span>
            <span className="text-[10px] text-[#777777]">Standard Shoppers</span>
          </div>
        </div>

        {/* Metric 3: Social OAuth Users */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#888888] font-bold">
              Social Google Accounts
            </span>
            <div className="p-2 rounded-lg bg-[#F5F5F5] text-black">
              <KeyRound className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight">{metrics.googleOauthUsers}</span>
            <span className="text-[10px] text-[#777777]">OAuth Authenticated</span>
          </div>
        </div>

        {/* Metric 4: Primary Super-Admin */}
        <div className="bg-white border border-orange-200 bg-orange-50/30 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#FF4D00] font-bold flex items-center space-x-1">
              <Lock className="w-3 h-3 text-[#FF4D00]" />
              <span>Immutable Super-Admin</span>
            </span>
            <span className="text-[9px] font-bold bg-[#FF4D00] text-white px-2 py-0.5 rounded">
              ROOT
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-bold truncate text-black">admin@goatednation.com</div>
            <div className="text-[9px] text-[#888888] mt-0.5">System Anchor (Cannot be demoted)</div>
          </div>
        </div>
      </div>

      {/* 3. Fast Action & Filter Bar */}
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Real-time search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff or collectors by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-[#FAFAFA] focus:bg-white border border-[#DCDCDC] focus:border-black rounded-lg text-xs outline-none transition-all placeholder-[#AAAAAA]"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center space-x-2">
            {(['ALL', 'ADMIN', 'CUSTOMER'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  roleFilter === r
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-[#F5F5F5] text-[#666666] hover:bg-[#EAEAEA] hover:text-black'
                }`}
              >
                {r === 'ALL' ? `All (${totalCount})` : r}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Email Direct Promotion Form */}
        <form
          onSubmit={handleDirectPromote}
          className="pt-4 border-t border-[#F0F0F0] flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="flex-1 relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              type="email"
              required
              value={directEmailInput}
              onChange={(e) => setDirectEmailInput(e.target.value)}
              placeholder="Enter exact email address of colleague to promote to Administrator..."
              className="w-full pl-10 pr-4 py-2 bg-[#FAFAFA] focus:bg-white border border-[#DCDCDC] focus:border-black rounded-lg text-xs outline-none transition-all placeholder-[#AAAAAA]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-[#FF4D00] hover:bg-[#E04400] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center justify-center space-x-2"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>GRANT ADMIN CLEARANCE</span>
          </button>
        </form>
      </div>

      {/* 4. Roster Table */}
      <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#EAEAEA] flex items-center justify-between bg-[#FAFAFA]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#444444]">
            SYNDICATE USER & CLEARANCE ROSTER ({users.length} displayed)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EAEAEA] bg-[#FDFDFD] text-[10px] text-[#888888] uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">User / Member</th>
                <th className="py-3 px-4 font-bold">Provider</th>
                <th className="py-3 px-4 font-bold">Clearance Level</th>
                <th className="py-3 px-4 font-bold">Joined Date</th>
                <th className="py-3 px-4 font-bold text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#888888]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#666666]" />
                      <span>Loading syndicate roster...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#888888]">
                    No accounts found matching your query.
                  </td>
                </tr>
              ) : (
                users.map((member) => (
                  <tr key={member.id} className="hover:bg-[#FBFBFB] transition-colors">
                    {/* Member Name + Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#EEEEEE] border border-[#D5D5D5] flex items-center justify-center font-bold text-xs uppercase shrink-0 overflow-hidden text-black">
                          {member.avatar ? (
                            <Image
                              src={member.avatar}
                              alt={member.name}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            member.name.substring(0, 2)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-black flex items-center space-x-1.5">
                            <span>{member.name}</span>
                            {member.isPrimaryAdmin && (
                              <span className="text-[9px] bg-black text-white px-1.5 py-0.2 rounded font-mono font-normal">
                                OWNER
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#666666]">{member.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Provider */}
                    <td className="py-3.5 px-4">
                      {member.provider === 'google' ? (
                        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <span>Google OAuth</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                          <span>Credentials</span>
                        </span>
                      )}
                    </td>

                    {/* Role Clearance Pill */}
                    <td className="py-3.5 px-4">
                      {member.role === 'ADMIN' ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          <span>ADMINISTRATOR</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 text-[#666666] border border-neutral-200">
                          <span>CUSTOMER</span>
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 text-[#777777] text-[11px]">
                      {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {member.isPrimaryAdmin ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed">
                          <Lock className="w-3 h-3" />
                          <span>IMMUTABLE OWNER</span>
                        </span>
                      ) : member.role === 'CUSTOMER' ? (
                        <button
                          onClick={() =>
                            setPendingAction({
                              user: member,
                              targetRole: 'ADMIN',
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-black hover:bg-[#FF4D00] text-white text-[10px] font-bold uppercase tracking-wider transition-colors inline-flex items-center space-x-1 shadow-xs"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>PROMOTE TO ADMIN</span>
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setPendingAction({
                              user: member,
                              targetRole: 'CUSTOMER',
                            })
                          }
                          className="px-3 py-1.5 rounded-lg border border-red-300 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors inline-flex items-center space-x-1 shadow-xs"
                        >
                          <UserX className="w-3 h-3" />
                          <span>REVOKE CLEARANCE</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal Confirmation Guard */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-[#D5D5D5] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div className="flex items-center space-x-2 text-black font-bold uppercase text-xs">
                {pendingAction.targetRole === 'ADMIN' ? (
                  <ShieldCheck className="w-5 h-5 text-[#FF4D00]" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                )}
                <span>CONFIRM CLEARANCE CHANGE</span>
              </div>
              <button
                onClick={() => setPendingAction(null)}
                className="text-[#888888] hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              {pendingAction.targetRole === 'ADMIN' ? (
                <>
                  <p className="text-black">
                    Are you sure you want to promote{' '}
                    <strong className="text-[#FF4D00]">
                      {pendingAction.user.name} ({pendingAction.user.email})
                    </strong>{' '}
                    to <span className="underline font-bold">Administrator</span>?
                  </p>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
                    <p className="font-bold flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Security & Clearance Advisory</span>
                    </p>
                    <p>
                      This user will gain full unrestricted access to store customer addresses, orders,
                      financial logs, product inventories, and support consoles.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-black">
                    Are you sure you want to revoke Administrator clearance for{' '}
                    <strong className="text-red-600">
                      {pendingAction.user.name} ({pendingAction.user.email})
                    </strong>
                    ?
                  </p>
                  <p className="text-[#666666] text-[11px]">
                    Their account will instantly be downgraded to standard Customer status. They will
                    lose all access to the admin workbench upon their next request.
                  </p>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-end space-x-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 rounded-lg border border-[#DCDCDC] hover:border-black text-xs uppercase tracking-wider font-bold transition-all text-[#666666] hover:text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  handleRoleChange(pendingAction.user.email, pendingAction.targetRole)
                }
                className={`px-5 py-2 rounded-lg text-white text-xs uppercase tracking-wider font-bold transition-all shadow-xs flex items-center space-x-1.5 ${
                  pendingAction.targetRole === 'ADMIN'
                    ? 'bg-[#FF4D00] hover:bg-[#E04400]'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {pendingAction.targetRole === 'ADMIN'
                    ? 'Confirm Admin Promotion'
                    : 'Confirm Revocation'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
