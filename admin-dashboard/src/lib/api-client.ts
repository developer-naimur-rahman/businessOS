import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Next.js rewrites can be used later, but for now we'll assume the API is on the same host or use env
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3333/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Read from Zustand store first, with fallback to localStorage
    const token = 
      useAuthStore.getState().token || 
      (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('adminToken')) : null);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const user = useAuthStore.getState().user;
    if (user?.organizationId && config.headers && !config.headers['x-organization-id']) {
      config.headers['x-organization-id'] = user.organizationId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthUrl = 
        url.includes('/auth/login') || 
        url.includes('/auth/admin-pin-login') || 
        url.includes('/auth/pin-login') || 
        url.includes('/public/');

      // Avoid infinite loop if calling login or public endpoints
      if (!isAuthUrl) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);
