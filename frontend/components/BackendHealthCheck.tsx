'use client';

import { useEffect, useRef } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function BackendHealthCheck() {
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkHealth = async () => {
      try {
        const response = await api.get('/health');
        if (response.data && response.data.status) {
          // toast.success(response.data.message || 'Backend connected successfully');
        } else {
          toast.error('Backend connection issue: Invalid response');
        }
      } catch (error: any) {
        console.error('Backend health check failed:', error);
        
        let errorMsg = 'Could not connect to backend';
        
        if (error.response) {
            // Server responded with a status code other than 2xx
            if (error.response.status === 401) {
                // errorMsg = 'Backend Unauthorized (Check API Key)';
                // Suppress 401 toast as api.ts handles redirect, but log it
                console.warn('Backend: Unauthorized');
                return; 
            } else if (error.response.status === 404) {
                errorMsg = `Backend endpoint not found: ${error.config.baseURL}/health`;
            } else {
                errorMsg = `Backend error: ${error.response.status} - ${error.response.data?.message || 'Unknown'}`;
            }
        } else if (error.request) {
            // Request made but no response
            errorMsg = 'Backend unreachable (Network Error). Check if WAMP is running.';
        } else {
            errorMsg = `Request setup error: ${error.message}`;
        }
        
        // Only show toast if it's not a 401 (since 401 redirects)
        toast.error(errorMsg);
      }
    };

    checkHealth();
  }, []);

  return null;
}
