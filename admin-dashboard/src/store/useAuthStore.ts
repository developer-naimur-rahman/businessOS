"use client"
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

import { getApiBaseUrl } from '../lib/utils';

export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roleIds: string[];
  permissions: string[];
}

interface AuthState {
  token: string | null;
  user: AuthenticatedUser | null;
  isHydrated: boolean;
  setToken: (token: string) => void;
  setUser: (user: AuthenticatedUser) => void;
  setHydrated: (isHydrated: boolean) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isHydrated: false,
      setToken: (token: string) => {
        set({ token });
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          localStorage.setItem('access_token', token);
          localStorage.setItem('adminToken', token);
        }
      },
      setUser: (user: AuthenticatedUser) => set({ user }),
      setHydrated: (isHydrated: boolean) => set({ isHydrated }),
      logout: () => {
        set({ token: null, user: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('access_token');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('businessos_auth');
          window.location.href = '/admin/login';
        }
      },
      fetchProfile: async () => {
        try {
          const token = get().token || (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('access_token')) : null);
          if (!token) return;
          
          const response = await axios.get<AuthenticatedUser>(`${getApiBaseUrl()}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data) {
            set({ user: response.data });
          }
        } catch (error: any) {
          // Only trigger logout on true 401 Unauthorized, never on transient network failures
          if (error?.response?.status === 401) {
            get().logout();
          }
        }
      },
    }),
    {
      name: 'businessos_auth',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : dummyStorage)),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
          // Sync localStorage token keys if present in rehydrated state
          if (state.token && typeof window !== 'undefined') {
            localStorage.setItem('token', state.token);
            localStorage.setItem('access_token', state.token);
            localStorage.setItem('adminToken', state.token);
          }
        }
      },
    }
  )
);
