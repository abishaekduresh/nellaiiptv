import axios from 'axios';

const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost/public/api',
  headers: { 'Content-Type': 'application/json' },
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
        window.location.href = '/admin'; 
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;
