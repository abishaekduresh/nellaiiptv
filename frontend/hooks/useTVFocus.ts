'use client';

import { useState, useCallback } from 'react';

interface UseTVFocusOptions {
  onEnter?: () => void;
  className?: string;
  focusClassName?: string;
}

export function useTVFocus({ onEnter, className = '', focusClassName = 'ring-4 ring-white scale-105 z-10' }: UseTVFocusOptions = {}) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter?.();
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
      className: `${className} transition-all duration-200 ${isFocused ? focusClassName : ''} outline-none cursor-pointer`,
    }
  };
}
