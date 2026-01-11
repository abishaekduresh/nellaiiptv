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
 * Sanitizes Image URLs to fix localhost/127.0.0.1 issues on different devices.
 * If a URL points to local uploads but has an absolute local IP, it strips the domain.
 */
export function getSafeImageUrl(url: string | null | undefined): string | undefined {
    if (!url) return undefined;

    // Check if it's an upload URL from backend
    if (url.includes('/uploads/')) {
        // If it refers to localhost or 127.0.0.1, it's likely broken on other devices
        // So we strip the domain and make it relative, allowing the frontend proxy to handle it.
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
            const match = url.match(/\/uploads\/.*$/);
            if (match) return match[0];
        }
    }
    
    return url;
}
