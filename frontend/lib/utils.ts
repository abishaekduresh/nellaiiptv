import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Resolves an image URL to ensure it uses the correct backend host.
 * If the URL is absolute but points to localhost (and we are in prod), it replaces the host.
 * If it's a relative path, it prepends availability.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  
  // If we have a full URL that isn't localhost, trust it (e.g. external images)
  if (url.startsWith('http') && !url.includes('localhost')) {
      return url;
  }

  // Get the configured API URL from environment
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  try {
      // Extract origin and base path from API URL
      // e.g. https://api.site.com/public/api -> https://api.site.com/public
      const apiObj = new URL(apiUrl);
      const basePath = apiObj.pathname.replace(/\/api\/?$/, ''); // Remove trailing /api
      const origin = apiObj.origin;
      
      const baseUrl = `${origin}${basePath}`;

      // If existing URL is localhost, replace the base
      if (url.includes('localhost')) {
          // Attempt to strip localhost part
          // This is a naive replacement for WAMP/Localhost paths
          const path = url.replace(/^https?:\/\/localhost(:[0-9]+)?(\/[^\/]+)?\/backend\/public/, '');
          return `${baseUrl}${path}`;
      }
      
      // If it's a root-relative path (starts with /), prepend base
      if (url.startsWith('/')) {
         return `${baseUrl}${url}`;
      }

      // If it's raw filename, append to uploads (if applicable, but safer to return as is if unsure)
      return url;
      
  } catch (e) {
      console.warn('Failed to resolve image URL:', e);
      return url;
  }
}
