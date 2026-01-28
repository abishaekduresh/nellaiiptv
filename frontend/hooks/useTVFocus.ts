'use client';

import { useState, useCallback } from 'react';

interface UseTVFocusOptions {
  // onEnter is used for both KeyDown (Enter) and Click events.
  // It now accepts an optional event argument to allow handlers to call stopPropagation() etc.
  onEnter?: (e?: any) => void;
  className?: string;
  focusClassName?: string;
}

export function useTVFocus({ onEnter, className = '', focusClassName }: UseTVFocusOptions = {}) {
  const [isFocused, setIsFocused] = useState(false);
  
  // Default focus style with enhanced visibility for TV
  const defaultFocusClass = focusClassName || 'ring-4 ring-white z-20 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.5)]';

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter?.(e);
    }
  }, [onEnter]);

  return {
    isFocused,
    focusProps: {
      'data-tv-focusable': 'true',
      tabIndex: 0,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onEnter?.(e);
      },
      className: `${className} transition-all duration-200 ${isFocused ? defaultFocusClass : ''} outline-none cursor-pointer`,
    }
  };
}
