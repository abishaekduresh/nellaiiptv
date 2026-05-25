'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

// AdSense must only load on pages with real publisher content.
// Functional app screens (channels, login, register, player, admin, etc.)
// violate the "ads on screens without publisher-content" policy.
const ADSENSE_ALLOWED_PATHS = [
  '/',
  '/about',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/contact',
  '/feedback',
];

export default function GoogleAdSense() {
  const adSenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;
  const pathname = usePathname();

  if (!adSenseId) return null;

  const isContentPage = ADSENSE_ALLOWED_PATHS.includes(pathname ?? '');
  if (!isContentPage) return null;

  return (
    <Script
      id="google-adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
