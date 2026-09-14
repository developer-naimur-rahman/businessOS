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
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
      // Avoid infinite loop if calling login or if already logging out
      if (!error.config.url?.includes('/auth/login')) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);
