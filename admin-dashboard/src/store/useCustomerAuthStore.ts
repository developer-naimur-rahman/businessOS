"use client"
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api-client';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface CustomerAuthState {
  customer: Customer | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, customer: Customer) => void;
  logout: () => void;
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      customer: null,
      token: null,
      isAuthenticated: false,
      login: (token: string, customer: Customer) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('customer_access_token', token);
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ customer, token, isAuthenticated: true });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('customer_access_token');
        }
        delete api.defaults.headers.common['Authorization'];
        set({ customer: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'customer-auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }
  )
);
