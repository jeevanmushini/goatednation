'use client';

import { create } from 'zustand';
import { User, UserRole } from '../types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  initialized: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;

  // Actions
  checkAuth: () => Promise<User | null>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    adminKey?: string;
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  setUser: (user: User | null, token?: string | null) => void;
}

let inFlightAuthPromise: Promise<User | null> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  initialized: false,
  isAuthenticated: false,
  isAdmin: false,

  setUser: (user, token) => {
    const isAdmin = user?.role === 'ADMIN';
    const activeToken = token !== undefined ? token : get().token;
    set({
      user,
      token: activeToken,
      isAuthenticated: !!user,
      isAdmin,
      isLoading: false,
      initialized: true,
    });

    if (activeToken) {
      (globalThis as unknown as { __AUTH_TOKEN__?: string }).__AUTH_TOKEN__ = activeToken;
    } else if (!user) {
      delete (globalThis as unknown as { __AUTH_TOKEN__?: string }).__AUTH_TOKEN__;
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('gn_auth_user');
        localStorage.removeItem('gn_auth_token');
      } catch {
        // ignore
      }
    }
  },

  checkAuth: async () => {
    // Return early if session is already verified and initialized
    if (get().initialized && !get().isLoading) {
      return get().user;
    }

    if (inFlightAuthPromise) {
      return inFlightAuthPromise;
    }

    set({ isLoading: true });

    inFlightAuthPromise = (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: get().token ? { Authorization: `Bearer ${get().token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            get().setUser(data.user, data.token);
            return data.user;
          }
        }

        // If server returned 401 or unauthorized, clear local session
        get().setUser(null, null);
        return null;
      } catch (err) {
        console.warn('[useAuthStore] checkAuth error:', err);
        set({ isLoading: false, initialized: true });
        return null;
      } finally {
        inFlightAuthPromise = null;
      }
    })();

    return inFlightAuthPromise;
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        set({ isLoading: false });
        return { success: false, error: data.error || 'Failed to sign in.' };
      }

      get().setUser(data.user, data.token);
      return { success: true, user: data.user };
    } catch (err: unknown) {
      set({ isLoading: false });
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network connection error.',
      };
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        set({ isLoading: false });
        return { success: false, error: resData.error || 'Registration failed.' };
      }

      get().setUser(resData.user, resData.token);
      return { success: true, user: resData.user };
    } catch (err: unknown) {
      set({ isLoading: false });
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network connection error.',
      };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    get().setUser(null, null);
  },
}));

