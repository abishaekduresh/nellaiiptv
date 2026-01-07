'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';

export default function FaviconUpdater() {
  const pathname = usePathname();
  const faviconUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const updateFavicon = (url: string) => {
      const links = document.querySelectorAll("link[rel*='icon']");
      links.forEach((link: any) => {
        link.href = url;
      });

      if (links.length === 0) {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = url;
        document.head.appendChild(link);
      }
    };

    const fetchIcon = async () => {
      // Return cached if available
      if (faviconUrlRef.current) {
        updateFavicon(faviconUrlRef.current);
        return;
      }

      try {
        const response = await api.get('/settings/public');
        if (response.data.status && response.data.data.logo_url) {
          const logoUrl = response.data.data.logo_url;
          faviconUrlRef.current = logoUrl;
          updateFavicon(logoUrl);
        }
      } catch (err) {
        // ignore
      }
    };

    // Initial fetch/update
    fetchIcon();

    // Observer to re-apply if Next.js overwrites head
    const observer = new MutationObserver(() => {
        if (faviconUrlRef.current) {
            updateFavicon(faviconUrlRef.current);
        }
    });

    observer.observe(document.head, { childList: true, subtree: true });

    return () => {
        observer.disconnect();
    };
  }, [pathname]); // Re-run mostly to re-ensure hook is active, logic handles caching

  return null;
}
