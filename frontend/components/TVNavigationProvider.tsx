'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface TVNavigationContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const TVNavigationContext = createContext<TVNavigationContextType>({
  enabled: true,
  setEnabled: () => {},
});

export const useTVNavigation = () => useContext(TVNavigationContext);

interface TVNavigationProviderProps {
  children: React.ReactNode;
}

export default function TVNavigationProvider({ children }: TVNavigationProviderProps) {
  const [enabled, setEnabled] = useState(true);
  const router = useRouter();

  // Helper to get center of an element
  const getCenter = (rect: DOMRect) => ({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  });

  // Calculate distance between two centers
  const getDistance = (point1: { x: number; y: number }, point2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (!navKeys.includes(e.key)) return;

    e.preventDefault();

    const currentFocus = document.activeElement as HTMLElement;
    const allFocusables = Array.from(document.querySelectorAll('[data-tv-focusable="true"]')) as HTMLElement[];

    if (!currentFocus || !currentFocus.hasAttribute('data-tv-focusable')) {
      // If nothing relevant is focused, focus the first visible focusable element
      if (allFocusables.length > 0) {
        allFocusables[0].focus();
      }
      return;
    }

    const currentRect = currentFocus.getBoundingClientRect();
    const currentCenter = getCenter(currentRect);

    let bestCandidate: HTMLElement | null = null;
    let minDistance = Infinity;

    allFocusables.forEach((candidate) => {
      if (candidate === currentFocus) return;

      const candidateRect = candidate.getBoundingClientRect();
      const candidateCenter = getCenter(candidateRect);

      // Filter based on direction
      let isValidDirection = false;
      const angleThreshold = 45; // Degrees

      const dx = candidateCenter.x - currentCenter.x;
      const dy = candidateCenter.y - currentCenter.y;
      
      // Basic directional checks (can be improved with strict angle checking)
      switch (e.key) {
        case 'ArrowRight':
          isValidDirection = dx > 0 && Math.abs(dy) < Math.abs(dx); // Roughly horizontal
          break;
        case 'ArrowLeft':
          isValidDirection = dx < 0 && Math.abs(dy) < Math.abs(dx);
          break;
        case 'ArrowDown':
          isValidDirection = dy > 0 && Math.abs(dx) < Math.abs(dy); // Roughly vertical
          break;
        case 'ArrowUp':
          isValidDirection = dy < 0 && Math.abs(dx) < Math.abs(dy);
          break;
      }

      if (isValidDirection) {
        const distance = getDistance(currentCenter, candidateCenter);
        if (distance < minDistance) {
          minDistance = distance;
          bestCandidate = candidate;
        }
      }
    });

    if (bestCandidate) {
      (bestCandidate as HTMLElement).focus();
      (bestCandidate as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [enabled]);

  // Back button handling
  const handleBack = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Backspace' || e.key === 'Escape') {
        // e.preventDefault(); // Don't prevent default always, might interfere with inputs
        // Basic "Back" navigation
        // router.back(); 
        // Note: Careful with auto-back, maybe only if no modal is open?
    }
  }, [router]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    // window.addEventListener('keydown', handleBack); // Optional

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // window.removeEventListener('keydown', handleBack);
    };
  }, [handleKeyDown, handleBack]);

  return (
    <TVNavigationContext.Provider value={{ enabled, setEnabled }}>
      {children}
    </TVNavigationContext.Provider>
  );
}
