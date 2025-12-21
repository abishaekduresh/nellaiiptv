'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useViewMode } from '@/context/ViewModeContext';

export default function ClassicModeGuard({ children }: { children: React.ReactNode }) {
  const { mode } = useViewMode();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If in Classic mode and not on home page, redirect to home
    if (mode === 'Classic' && pathname !== '/') {
      router.push('/');
    }
  }, [mode, pathname, router]);

  // If in Classic mode and not on home page, don't render children
  if (mode === 'Classic' && pathname !== '/') {
    return null;
  }

  return <>{children}</>;
}
