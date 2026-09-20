import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api-client';

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface CustomerAuthState {
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
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ customer, token, isAuthenticated: true });
      },
      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        set({ customer: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'customer-auth-storage',
    }
  )
);
