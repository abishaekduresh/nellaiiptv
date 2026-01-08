import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/public/api';


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Platform': 'web',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Access store directly to avoid race conditions with localStorage persistence
    const state = useAuthStore.getState();
    const token = state.token || state.tempToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add API Key
    const apiKey = process.env.NEXT_PUBLIC_API_SECRET;
    if (apiKey) {
      config.headers['X-API-KEY'] = apiKey;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we are NOT already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
         useAuthStore.getState().logout(true);
         window.location.href = '/login?error=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
