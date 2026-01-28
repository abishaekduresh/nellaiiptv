import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/backend/public/api';

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-Client-Platform': 'web',
  },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Add API Key
  const apiKey = process.env.NEXT_PUBLIC_API_SECRET;
  if (apiKey) {
    config.headers['X-API-KEY'] = apiKey;
  }
  
  // Add Device ID for consistency
  try {
      const deviceId = localStorage.getItem('deviceId') || useAuthStore.getState().getDeviceId();
      if (deviceId) {
          config.headers['X-Device-Id'] = deviceId;
      }
  } catch (e) {
      // ignore
  }

  return config;
});

// Add response interceptor to handle 401s (token expiry)
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Clear all auth related storage to prevent loops
        localStorage.removeItem('admin_token');
        localStorage.removeItem('auth-storage'); // Zustand persistence
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Force redirect
        if (window.location.pathname.startsWith('/reseller')) {
            window.location.href = '/login?error=session_expired';
        } else {
            window.location.href = '/admin'; 
        } 
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;
