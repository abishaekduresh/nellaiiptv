import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/backend/public/api';


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

    // Include unique Device ID in all requests for session/slot tracking
    config.headers['X-Device-Id'] = state.getDeviceId();
    
    // Set default platform for web clients (can be overridden by specific apps)
    if (!config.headers['X-Client-Platform']) {
        config.headers['X-Client-Platform'] = 'web';
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
    // Handle Network Errors or Server/Database Errors
    if (!error.response || error.response?.status >= 500) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/system-error')) {
          const msg = encodeURIComponent(error.response?.data?.message || error.message || 'System offline or network error');
          window.location.href = `/system-error?message=${msg}`;
          // Return a pending promise so the rest of the app stops executing while we redirect
          return new Promise(() => {});
      }
    } else if (error.response?.status === 401) {
      // Only redirect if we are NOT already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
         useAuthStore.getState().logout(true);
         window.location.href = '/login?error=session_expired';
      }
    } else if (error.response?.status === 403 && error.response?.data?.error === 'device_limit_reached') {
        // Handle global device limit enforcement
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/devices')) {
             // If we have a temp token, store it
            const tempToken = error.response.data.temp_token;
            if (tempToken) {
                useAuthStore.getState().setTempToken(tempToken);
            }
            window.location.href = '/devices';
        }
    } else if (error.response?.status === 403 && error.response?.data?.error === 'subscription_required') {
        // Handle global subscription requirement
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/plans')) {
             window.location.href = '/plans?error=subscription_required';
        }
    }
    return Promise.reject(error);
  }
);

export default api;
