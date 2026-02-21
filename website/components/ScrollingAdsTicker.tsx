'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

interface ScrollingAd {
  uuid: string;
  text_content: string;
  scroll_speed: number;   // pixels/sec
  repeat_count: number;   // loops before advancing to next ad
  status: string;
}

/**
 * Parses inline Markdown and returns an array of React span elements.
 * Supports: **bold**, *italic*, ~~strikethrough~~, `code`
 */
function parseMarkdown(text: string): React.ReactNode[] {
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|`(.+?)`|([^*~`]+)/g;
  const nodes: React.ReactNode[] = [];
  let match;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match[1]) {
      nodes.push(<strong key={i++} className="font-bold">{match[1]}</strong>);
    } else if (match[2]) {
      nodes.push(<em key={i++} className="italic">{match[2]}</em>);
    } else if (match[3]) {
      nodes.push(<span key={i++} className="line-through opacity-70">{match[3]}</span>);
    } else if (match[4]) {
      nodes.push(<code key={i++} className="font-mono text-sky-300 bg-white/10 px-1 rounded">{match[4]}</code>);
    } else if (match[5]) {
      nodes.push(<span key={i++}>{match[5]}</span>);
    }
  }
  return nodes.length > 0 ? nodes : [<span key={0}>{text}</span>];
}

/**
 * A single scrolling marquee for one ad.
 * Uses CSS animation for smooth, gap-free looping within [repeatCount] passes
 * then calls onComplete to advance to the next ad.
 */
function AdMarquee({ ad, onComplete }: { ad: ScrollingAd; onComplete: () => void }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const loopsRef = useRef(0);
  const maxLoops = ad.repeat_count > 0 ? ad.repeat_count : 1;
  const speed = ad.scroll_speed > 0 ? ad.scroll_speed : 60;
  const animNameRef = useRef(`marquee-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const text = textRef.current;
    const container = containerRef.current;
    if (!text || !container) return;

    const textWidth = text.scrollWidth;
    const containerWidth = container.clientWidth;
    const travelDist = containerWidth + textWidth;
    const durationSec = travelDist / speed;
    const animName = animNameRef.current;

    // Inject a keyframe rule using the exact container width
    // so text starts immediately at the right edge with no gap
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes ${animName} {
        0%   { transform: translateX(${containerWidth}px); }
        100% { transform: translateX(-${textWidth}px); }
      }
    `;
    document.head.appendChild(styleEl);
    loopsRef.current = 0;

    setStyle({
      animation: `${animName} ${durationSec}s linear infinite`,
      opacity: 1,
    });

    return () => { document.head.removeChild(styleEl); };
  }, [ad.uuid, speed]);

  const handleAnimationIteration = () => {
    loopsRef.current++;
    if (loopsRef.current >= maxLoops) {
      onComplete();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <span
        ref={textRef}
        className="inline-block whitespace-nowrap text-white text-base font-medium"
        style={style}
        onAnimationIteration={handleAnimationIteration}
      >
        {parseMarkdown(ad.text_content)}
      </span>
    </div>
  );
}

/**
 * Fetches active scrolling ads from the API and displays them one-by-one
 * in a slim ticker bar below the video player.
 */
export default function ScrollingAdsTicker() {
  const [ads, setAds] = useState<ScrollingAd[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    api.get('/scrolling-ads')
      .then(res => {
        const data = res.data?.data || [];
        if (Array.isArray(data) && data.length > 0) {
          setAds(data);
          setCurrentIndex(0);
        }
      })
      .catch(() => {/* silently fail */});
  }, []);

  const handleComplete = () => {
    setCurrentIndex(prev => (prev + 1) % ads.length);
  };

  if (ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <div className="w-full bg-slate-900 border-y border-slate-700/50 py-1.5 px-3 overflow-hidden shrink-0">
      <style>{`
        @keyframes scroll-marquee {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
      <AdMarquee
        key={`${currentAd.uuid}-${currentIndex}`}
        ad={currentAd}
        onComplete={handleComplete}
      />
    </div>
  );
}
