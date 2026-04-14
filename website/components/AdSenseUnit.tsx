'use client';

import { useEffect, useRef } from 'react';

interface AdSenseUnitProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  layout?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function AdSenseUnit({ 
  slot, 
  format = 'auto', 
  layout,
  className = '',
  style = { display: 'block' }
}: AdSenseUnitProps) {
  const adInit = useRef(false);
  const adSenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;

  useEffect(() => {
    if (!adSenseId) return;
    
    // Prevent double initialization in React strict mode
    if (adInit.current) return;
    adInit.current = true;

    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [adSenseId]);

  if (!adSenseId) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className={`bg-gray-200 border border-gray-300 p-4 text-center text-gray-500 ${className}`} style={style}>
          <p className="text-sm font-semibold">AdSense Placeholder</p>
          <p className="text-xs">Missing NEXT_PUBLIC_GOOGLE_ADSENSE_ID</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={adSenseId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        {...(layout ? { 'data-ad-layout': layout } : {})}
      />
    </div>
  );
}
