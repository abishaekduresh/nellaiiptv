'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { ExternalLink, Volume2, VolumeX, SkipForward } from 'lucide-react';
import api from '@/lib/api';

export interface VisualAd {
  uuid: string;
  title: string;
  description: string | null;
  ad_url: string;
  click_url: string | null;
  thumbnail_url: string | null;
  is_skippable: boolean;
  skip_after_seconds: number;
  duration_seconds: number;
  max_impressions_per_session: number;
  display_frequency: number;
}

interface Props {
  ad: VisualAd;
  onComplete: () => void;
}

const SESSION_KEY     = 'niptv_ad_impressions'; // { [uuid]: count }
const FREQ_COUNT_KEY  = 'niptv_channel_switches';

/** Returns how many times this ad has been shown this session */
export function getSessionImpressions(uuid: string): number {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw)[uuid] ?? 0) : 0;
  } catch { return 0; }
}

function incSessionImpressions(uuid: string) {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[uuid] = (map[uuid] ?? 0) + 1;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(map));
  } catch {}
}

/** Returns true when we should attempt to show an ad on this channel switch */
export function shouldAttemptAd(displayFrequency: number): boolean {
  try {
    const count = parseInt(sessionStorage.getItem(FREQ_COUNT_KEY) ?? '0', 10) + 1;
    sessionStorage.setItem(FREQ_COUNT_KEY, String(count));
    return count % displayFrequency === 0;
  } catch { return true; }
}

export default function VideoAdOverlay({ ad, onComplete }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const hlsRef      = useRef<Hls | null>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const [muted,       setMuted]       = useState(true);
  const [skipSecs,    setSkipSecs]    = useState(ad.is_skippable ? ad.skip_after_seconds : -1);
  const [canSkip,     setCanSkip]     = useState(false);
  const [timeLeft,    setTimeLeft]    = useState(ad.duration_seconds);
  const [hasTracked,  setHasTracked]  = useState(false);

  const finish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    hlsRef.current?.destroy();
    hlsRef.current = null;
    onComplete();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    if (!canSkip) return;
    api.post(`/visual-ads/${ad.uuid}/skip`).catch(() => {});
    finish();
  }, [canSkip, ad.uuid, finish]);

  const handleClick = useCallback(() => {
    if (!ad.click_url) return;
    api.post(`/visual-ads/${ad.uuid}/click`).catch(() => {});
    window.open(ad.click_url, '_blank', 'noopener,noreferrer');
  }, [ad.click_url, ad.uuid]);

  // Boot the player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isHls = ad.ad_url.includes('.m3u8') || ad.ad_url.includes('m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false });
      hlsRef.current = hls;
      hls.loadSource(ad.ad_url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_e, d) => { if (d.fatal) finish(); });
    } else {
      video.src = ad.ad_url;
      video.play().catch(() => {});
    }

    // Track impression once
    incSessionImpressions(ad.uuid);
    api.post(`/visual-ads/${ad.uuid}/impression`).catch(() => {});
    setHasTracked(true);

    // Countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { finish(); return 0; }
        return prev - 1;
      });
      setSkipSecs(prev => {
        if (prev <= 0) return 0;
        const next = prev - 1;
        if (next === 0) setCanSkip(true);
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 z-40 bg-black flex flex-col">
      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        muted={muted}
        playsInline
        onEnded={finish}
        poster={ad.thumbnail_url ?? undefined}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded">AD</span>
          <span className="text-white/70 text-xs font-mono">{timeLeft}s remaining</span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between gap-3">
        {/* Left: ad info + click-through */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold leading-tight truncate">{ad.title}</p>
          {ad.description && (
            <p className="text-white/60 text-xs leading-tight truncate mt-0.5">{ad.description}</p>
          )}
          {ad.click_url && (
            <button
              onClick={handleClick}
              className="mt-1.5 flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              <ExternalLink size={11} /> Visit Advertiser
            </button>
          )}
        </div>

        {/* Right: mute + skip */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMuted(v => !v)}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {ad.is_skippable && (
            canSkip ? (
              <button
                onClick={handleSkip}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-black rounded-lg hover:bg-amber-400 transition-colors"
              >
                <SkipForward size={13} /> Skip Ad
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-white/10 text-white/60 text-xs font-semibold rounded-lg border border-white/10">
                Skip in {skipSecs}s
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
