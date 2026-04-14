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
    if (error.response?.status === 401) {
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
