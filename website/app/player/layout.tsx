import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Online HLS, DASH & MP4 Player | Nellai IPTV',
  description:
    'Play any HLS (.m3u8), DASH (.mpd), MP4, or live stream directly in your browser — no install needed. Auto-detects stream type, supports ABR quality levels, live streams, and fullscreen.',
  keywords: [
    'HLS player online', 'M3U8 player online', 'DASH player online', 'MPD player online',
    'IPTV player online', 'free online video player', 'HLS stream tester', 'live stream player',
    'online media player', 'HLS.js player', 'DASH.js player', 'MP4 player online',
    'free stream tester', 'online IPTV player', 'Nellai IPTV player',
  ],
  openGraph: {
    title: 'Free Online HLS, DASH & MP4 Player | Nellai IPTV',
    description:
      'Play HLS, DASH, and MP4 streams instantly in your browser. Free, no sign-up required.',
    url: 'https://nellaiiptv.com/player',
    siteName: 'Nellai IPTV',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Online HLS, DASH & MP4 Player | Nellai IPTV',
    description: 'Play HLS (.m3u8), DASH (.mpd), and MP4 streams directly in your browser.',
  },
  alternates: {
    canonical: 'https://nellaiiptv.com/player',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Nellai IPTV Universal Media Player',
  url: 'https://nellaiiptv.com/player',
  description:
    'A free browser-based media player that supports HLS (.m3u8), MPEG-DASH (.mpd), MP4, WebM, and live IPTV streams. No installation required.',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires a modern browser with HTML5 video support',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'HLS (.m3u8) playback via HLS.js',
    'MPEG-DASH (.mpd) playback via DASH.js',
    'MP4 / WebM / native video support',
    'Live stream detection with LIVE badge',
    'Adaptive bitrate quality selector',
    'Fullscreen and Picture-in-Picture',
    'Volume and mute controls',
    'Seek bar for VOD content',
    'Keyboard shortcuts',
    'HTTP to HTTPS auto-upgrade',
  ],
  creator: {
    '@type': 'Organization',
    name: 'Nellai IPTV',
    url: 'https://nellaiiptv.com',
  },
};

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
