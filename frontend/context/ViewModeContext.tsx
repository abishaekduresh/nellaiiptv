'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ViewMode } from '@/types';

// type ViewMode removed

interface ViewModeContextType {
  mode: ViewMode;
  toggleMode: () => void;
  setMode: (mode: ViewMode) => void;
  isInitialized: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
        const savedMode = sessionStorage.getItem('viewMode') as ViewMode;
        const expiry = sessionStorage.getItem('viewModeExpiry');

         // Check expiry if in Classic Mode
        if (savedMode === 'Classic') {
            const now = Date.now();
            if (expiry && now > parseInt(expiry)) {
                // Expired: Revert to OTT
                sessionStorage.setItem('viewMode', 'OTT');
                sessionStorage.removeItem('viewModeExpiry');
                return 'OTT';
            }
        }
        
        if (savedMode === 'OTT' || savedMode === 'Classic') {
             return savedMode;
        }
    }
    return 'OTT';
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();



  useEffect(() => {
     const initMode = async () => {
         // Side effects for analytics
         if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('set', 'user_properties', { view_mode: mode });
         }
         
         // Fetch Defaults if not set in session
         const savedMode = sessionStorage.getItem('viewMode');
         
         // Always fetch latest settings from API to enforce server-side config
         try {
             const res = await api.get('/settings/public');
             if (res.data.status) {
                 const defaultSetting = res.data.data.frontend_default_mode;
                 const targetMode: ViewMode = defaultSetting === 'classic' ? 'Classic' : 'OTT';
                 
                 // Enforce API setting (Override session if different)
                 if (targetMode !== mode) {
                     setModeState(targetMode);
                     sessionStorage.setItem('viewMode', targetMode); 
                 }
             }
         } catch (e) {
             console.error("Failed to fetch default mode", e);
             // Fallback to session or default 'OTT' if API fails
         }

         setIsInitialized(true);
     };

     initMode();
  }, []);

  const setMode = (newMode: ViewMode) => {
    setModeState(newMode);
    sessionStorage.setItem('viewMode', newMode);

    // Set or Clear Expiry
    if (newMode === 'Classic') {
        // Set expiry to 24 hours from now
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
        sessionStorage.setItem('viewModeExpiry', expiryTime.toString());
    } else {
        sessionStorage.removeItem('viewModeExpiry');
    }

    // Track mode change
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'switch_view_mode', {
            event_category: 'Interface',
            event_label: newMode,
            mode: newMode
        });
        (window as any).gtag('set', 'user_properties', { view_mode: newMode });
    }
  };

  const toggleMode = () => {
    const newMode = mode === 'OTT' ? 'Classic' : 'OTT';
    setMode(newMode);
    if (newMode === 'Classic') {
        router.push('/');
    }
  };

  return (
    <ViewModeContext.Provider value={{ mode, toggleMode, setMode, isInitialized }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
