'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

const POLLING_INTERVAL = 10000; // 10 seconds

export default function SessionMonitor() {
    const { token } = useAuthStore();

    useEffect(() => {
        if (!token) return;

        const checkSession = async () => {
            try {
                // We just need any protected endpoint. 
                // Using /customers/sessions is relevant as it validates the session list too.
                // We use a small limit or just header check if possible, but GET is fine.
                await api.get('/customers/sessions');
            } catch (error) {
                // 401 errors are handled by the API interceptor in api.ts
                // which will trigger logout and redirect.
                // We ignore other errors (network issues etc) to avoid annoying toasts.
            }
        };

        const intervalId = setInterval(checkSession, POLLING_INTERVAL);

        // Run immediately on mount/token change to be sure? 
        // No, let's wait for interval to avoid double-fetch on page load if other components fetch.
        
        return () => clearInterval(intervalId);
    }, [token]);

    return null;
}
