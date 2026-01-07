'use client';

import { useEffect } from 'react';
import api from '@/lib/api';

export default function FaviconUpdater() {
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const response = await api.get('/settings/public');
        if (response.data.status && response.data.data.logo_url) {
          const logoUrl = response.data.data.logo_url;
          
          // Update favicon link tags
          const links = document.querySelectorAll("link[rel~='icon']");
          links.forEach((link: any) => {
            link.href = logoUrl;
          });

          // If no link exists, create one
          if (links.length === 0) {
            const link = document.createElement('link');
            link.rel = 'icon';
            link.href = logoUrl;
            document.head.appendChild(link);
          }
        }
      } catch (err) {
        // limit retries or just ignore
      }
    };

    updateFavicon();
  }, []);

  return null;
}
