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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  initialized: false,
  isAuthenticated: false,
  isAdmin: false,

  setUser: (user, token) => {
    const isAdmin = user?.role === 'ADMIN';
    set({
      user,
      token: token !== undefined ? token : get().token,
      isAuthenticated: !!user,
      isAdmin,
      isLoading: false,
      initialized: true,
    });

    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('gn_auth_user', JSON.stringify(user));
        if (token) localStorage.setItem('gn_auth_token', token);
      } else {
        localStorage.removeItem('gn_auth_user');
        localStorage.removeItem('gn_auth_token');
      }
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });

    // Optimistic read from localStorage
    if (typeof window !== 'undefined' && !get().initialized) {
      try {
        const storedUser = localStorage.getItem('gn_auth_user');
        const storedToken = localStorage.getItem('gn_auth_token');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          set({
            user: parsed,
            token: storedToken,
            isAuthenticated: true,
            isAdmin: parsed.role === 'ADMIN',
          });
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: get().token ? { Authorization: `Bearer ${get().token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          get().setUser(data.user);
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
    }
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

