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
          toast.success(response.data.message || 'Backend connected successfully');
        } else {
          toast.error('Backend connection issue: Invalid response');
        }
      } catch (error) {
        console.error('Backend health check failed:', error);
        toast.error('Could not connect to backend');
      }
    };

    checkHealth();
  }, []);

  return null;
}
