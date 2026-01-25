'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useViewMode } from '@/context/ViewModeContext';

export default function ClassicModeGuard({ children }: { children: React.ReactNode }) {
  const { mode } = useViewMode();
  const router = useRouter();
  const pathname = usePathname();

  // Allowed paths that should not trigger a redirect in Classic Mode
  const allowedPaths = ['/login', '/register', '/forgot-password', '/admin', '/profile', '/about'];
  const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));

  useEffect(() => {
    // If in Classic mode, not on home page, and not on an allowed path, redirect to home
    if (mode === 'Classic' && pathname !== '/' && !isAllowedPath) {
      router.push('/');
    }
  }, [mode, pathname, router, isAllowedPath]);

  // If in Classic mode, not on home page, and not on an allowed path, don't render children
  if (mode === 'Classic' && pathname !== '/' && !isAllowedPath) {
    return null;
  }

  return <>{children}</>;
}
