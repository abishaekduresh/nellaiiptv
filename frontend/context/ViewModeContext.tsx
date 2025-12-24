'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ViewMode = 'OTT' | 'Classic';

interface ViewModeContextType {
  mode: ViewMode;
  toggleMode: () => void;
  setMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>('OTT');
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load preference from localStorage on mount
    const savedMode = localStorage.getItem('viewMode') as ViewMode;
    if (savedMode && (savedMode === 'OTT' || savedMode === 'Classic')) {
      setModeState(savedMode);
      
      // Track initial mode
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('set', 'user_properties', { view_mode: savedMode });
      }
    }
    setIsInitialized(true);
  }, []);

  const setMode = (newMode: ViewMode) => {
    setModeState(newMode);
    localStorage.setItem('viewMode', newMode);

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

  if (!isInitialized) {
     /* Optional: Return loading state */
  }

  return (
    <ViewModeContext.Provider value={{ mode, toggleMode, setMode }}>
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
