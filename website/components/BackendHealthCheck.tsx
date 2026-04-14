'use client';

import { useEffect, useRef } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

import { useViewMode } from '@/context/ViewModeContext';

export default function BackendHealthCheck() {
  const hasChecked = useRef(false);
  const { mode, setMode } = useViewMode();

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
            errorMsg = 'Backend unreachable (Network Error).';
        } else {
            errorMsg = `Request setup error: ${error.message}`;
        }
        
        // Auto-switch to OTT mode if in Classic mode and backend fails (excluding 401 which handles itself)
        if (mode === 'Classic') {
            const isAuthError = error.response && error.response.status === 401;
            if (!isAuthError) {
                console.warn('Backend failed. Switching to OTT Mode.');
                setMode('OTT');
                toast.error(`Backend disconnected. Switched to OTT Mode.\n\nError: ${errorMsg}`, {
                    duration: 6000,
                    style: { minWidth: '350px' }
                });
                return;
            }
        }
        
        // Only show toast if it's not a 401 (since 401 redirects)
        toast.error(errorMsg);
      }
    };

    checkHealth();
  }, [mode, setMode]);

  return null;
}
