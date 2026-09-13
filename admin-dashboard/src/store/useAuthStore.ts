import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Directly use the API_URL to avoid circular dependency with api-client
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

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
  setToken: (token: string) => void;
  setUser: (user: AuthenticatedUser) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => {
        set({ token: null, user: null });
        window.location.href = '/login';
      },
      fetchProfile: async () => {
        try {
          const token = get().token;
          if (!token) return;
          
          const response = await axios.get<AuthenticatedUser>(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          set({ user: response.data });
        } catch (error) {
          console.error('Failed to fetch profile', error);
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }), // Only persist the token
    }
  )
);
