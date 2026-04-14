'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

export function useNetworkStatus() {
  const offlineToastId = useRef<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      // Dismiss the offline toast if it exists
      if (offlineToastId.current) {
        toast.dismiss(offlineToastId.current);
        offlineToastId.current = null;
      }
      
      // Show connection restored message
      toast.success('Internet connection restored!', {
        duration: 3000,
        icon: '🌐',
      });
    };

    const handleOffline = () => {
      // Store the toast ID so we can dismiss it later
      offlineToastId.current = toast.error('No internet connection', {
        duration: Infinity, // Keep showing until connection is restored
        icon: '📡',
      });
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (offlineToastId.current) {
        toast.dismiss(offlineToastId.current);
      }
    };
  }, []);
}
