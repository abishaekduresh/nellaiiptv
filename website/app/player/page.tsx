'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  RefreshCw, AlertTriangle, ChevronDown, RotateCcw, Link2, Scaling, X
} from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';

type StreamType = 'auto' | 'hls' | 'dash' | 'mp4';
type DetectedType = 'hls' | 'dash' | 'mp4';
type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

declare global {
  interface Window { dashjs: any; }
}

const TYPE_BADGE: Record<DetectedType, { label: string; cls: string }> = {
  hls:  { label: 'HLS',  cls: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
  dash: { label: 'DASH', cls: 'bg-purple-500/20 text-purple-400 border border-purple-500/40' },
  mp4:  { label: 'MP4',  cls: 'bg-green-500/20 text-green-400 border border-green-500/40' },
};

const EXAMPLE_STREAMS = [
  { label: 'HLS — Big Buck Bunny', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'hls' as StreamType },
  { label: 'DASH — Big Buck Bunny', url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd', type: 'dash' as StreamType },
  { label: 'MP4 — Road in a city', url: 'https://samplelib.com/mp4/sample-5s.mp4', type: 'mp4' as StreamType },
];

function detectType(url: string): DetectedType {
  const lower = url.toLowerCase().split('?')[0];
  if (lower.includes('.m3u8') || lower.includes('/hls/')) return 'hls';
  if (lower.includes('.mpd') || lower.includes('/dash/')) return 'dash';
  if (/\.(mp4|webm|ogg|mov|ts|mkv|avi)/.test(lower)) return 'mp4';
  return 'hls';
}

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function resolveUrl(url: string): string {
  if (typeof window === 'undefined') return url;
  if (window.location.protocol === 'https:' && url.startsWith('http://'))
    return url.replace(/^http:\/\//, 'https://');
  return url;
}

export default function PlayerPage() {
  const [inputUrl, setInputUrl] = useState('');
  const [selectedType, setSelectedType] = useState<StreamType>('auto');
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<DetectedType | null>(null);
  const [isDashReady, setIsDashReady] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const { logo_url, app_logo_png_url } = useBranding();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const dashRef = useRef<any>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDashRef = useRef<{ url: string; type: DetectedType } | null>(null);

  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [qualities, setQualities] = useState<{ index: number; label: string }[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isStretched, setIsStretched] = useState(false);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3500);
  }, []);

  const destroyPlayers = useCallback(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (dashRef.current) { try { dashRef.current.reset(); } catch {} dashRef.current = null; }
    const video = videoRef.current;
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
    setQualities([]);
    setCurrentQuality(-1);
    setIsLive(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, []);

  const loadStream = useCallback((url: string, type: DetectedType) => {
    const video = videoRef.current;
    if (!video) return;

    destroyPlayers();
    setStatus('loading');
    setError(null);

    const src = resolveUrl(url);

    if (type === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls({ debug: false, enableWorker: true, startLevel: -1 });
        hlsRef.current = hls;
        hls.attachMedia(video);
        hls.loadSource(src);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const mapped = hls.levels.map((l, i) => ({
            index: i,
            label: l.height ? `${l.height}p` : `${Math.round(l.bitrate / 1000)}k`,
          }));
          setQualities([{ index: -1, label: 'Auto' }, ...mapped.reverse()]);
          setIsLive(!isFinite(video.duration));
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.FRAG_BUFFERED, () => setStatus('playing'));

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              setError(`HLS error: ${data.details}`);
              setStatus('error');
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.play().catch(() => {});
      } else {
        setError('HLS is not supported in this browser.');
        setStatus('error');
      }

    } else if (type === 'dash') {
      if (!isDashReady || typeof window.dashjs === 'undefined') {
        pendingDashRef.current = { url, type };
        setStatus('loading');
        return;
      }
      try {
        const dash = window.dashjs.MediaPlayer().create();
        dashRef.current = dash;
        dash.updateSettings({ debug: { logLevel: 0 } });
        dash.initialize(video, src, true);

        dash.on(window.dashjs.MediaPlayer.events.PLAYBACK_METADATA_LOADED, () => {
          setIsLive(dash.isDynamic?.() ?? false);
          setStatus('playing');
        });

        dash.on(window.dashjs.MediaPlayer.events.ERROR, (e: any) => {
          setError(`DASH error: ${e?.error?.message ?? 'Playback failed'}`);
          setStatus('error');
        });
      } catch (err: any) {
        setError(`DASH init failed: ${err?.message}`);
        setStatus('error');
      }

    } else {
      video.src = src;
      video.play().catch(err => {
        setError(`Playback failed: ${err.message}`);
        setStatus('error');
      });
    }
  }, [destroyPlayers, isDashReady]);

  const handleLoad = useCallback((url?: string, type?: StreamType) => {
    const u = (url ?? inputUrl).trim();
    if (!u) return;
    const t = (type ?? selectedType) === 'auto' ? detectType(u) : ((type ?? selectedType) as DetectedType);
    setDetectedType(t);
    setActiveUrl(u);
    if (!url) setInputUrl(u);
    setShowExamples(false);
    loadStream(u, t);
  }, [inputUrl, selectedType, loadStream]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay        = () => { setIsPlaying(true); setStatus('playing'); };
    const onPause       = () => { setIsPlaying(false); setStatus('paused'); };
    const onWaiting     = () => setStatus('loading');
    const onPlaying     = () => setStatus('playing');
    const onTimeUpdate  = () => setCurrentTime(video.currentTime);
    const onDuration    = () => { setDuration(video.duration); setIsLive(!isFinite(video.duration)); };
    const onVolumeChg   = () => { setVolume(video.volume); setIsMuted(video.muted); };
    const onError       = () => { if (video.error) { setError(`Media error: ${video.error.message || 'Playback failed'}`); setStatus('error'); } };
    const onFSChange    = () => setIsFullscreen(!!document.fullscreenElement);

    video.addEventListener('play',            onPlay);
    video.addEventListener('pause',           onPause);
    video.addEventListener('waiting',         onWaiting);
    video.addEventListener('playing',         onPlaying);
    video.addEventListener('timeupdate',      onTimeUpdate);
    video.addEventListener('durationchange',  onDuration);
    video.addEventListener('volumechange',    onVolumeChg);
    video.addEventListener('error',           onError);
    document.addEventListener('fullscreenchange', onFSChange);

    return () => {
      video.removeEventListener('play',            onPlay);
      video.removeEventListener('pause',           onPause);
      video.removeEventListener('waiting',         onWaiting);
      video.removeEventListener('playing',         onPlaying);
      video.removeEventListener('timeupdate',      onTimeUpdate);
      video.removeEventListener('durationchange',  onDuration);
      video.removeEventListener('volumechange',    onVolumeChg);
      video.removeEventListener('error',           onError);
      document.removeEventListener('fullscreenchange', onFSChange);
    };
  }, []);

  useEffect(() => () => { destroyPlayers(); }, []);

  useEffect(() => {
    if (isDashReady && pendingDashRef.current) {
      const { url, type } = pendingDashRef.current;
      pendingDashRef.current = null;
      loadStream(url, type);
    }
  }, [isDashReady, loadStream]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
    showControls();
  }, [showControls]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    showControls();
  }, [showControls]);

  const handleVolumeChange = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    if (val > 0 && v.muted) v.muted = false;
    showControls();
  }, [showControls]);

  const handleSeek = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v || isLive) return;
    v.currentTime = val;
    showControls();
  }, [isLive, showControls]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  }, []);

  const handleQualityChange = useCallback((index: number) => {
    if (hlsRef.current) { hlsRef.current.currentLevel = index; setCurrentQuality(index); }
    setShowQualityMenu(false);
    showControls();
  }, [showControls]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'SELECT') return;
    switch (e.key) {
      case ' ': e.preventDefault(); togglePlay(); break;
      case 'm': case 'M': toggleMute(); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 's': case 'S': setIsStretched(p => !p); showControls(); break;
      case 'ArrowRight': if (!isLive && videoRef.current) { videoRef.current.currentTime += 10; showControls(); } break;
      case 'ArrowLeft':  if (!isLive && videoRef.current) { videoRef.current.currentTime -= 10; showControls(); } break;
      case 'ArrowUp':   e.preventDefault(); handleVolumeChange(Math.min(1, volume + 0.1)); break;
      case 'ArrowDown': e.preventDefault(); handleVolumeChange(Math.max(0, volume - 0.1)); break;
    }
  }, [togglePlay, toggleMute, toggleFullscreen, handleVolumeChange, isLive, volume, showControls]);

  const clearStream = useCallback(() => {
    destroyPlayers();
    setInputUrl('');
    setActiveUrl(null);
    setDetectedType(null);
    setStatus('idle');
    setError(null);
    pendingDashRef.current = null;
  }, [destroyPlayers]);

  const hasStream = !!activeUrl;
  const progressPct = duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;
  const currentQualityLabel = qualities.find(q => q.index === currentQuality)?.label ?? 'Auto';

  return (
    <>
      <style>{`
        html, body { margin: 0; background: #0f172a; }
        .range-slider { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 4px; cursor: pointer; outline: none; }
        .range-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 13px; height: 13px; border-radius: 50%; background: #06b6d4; cursor: pointer; box-shadow: 0 0 0 2px rgba(6,182,212,0.3); }
        .range-slider::-moz-range-thumb { width: 13px; height: 13px; border-radius: 50%; background: #06b6d4; cursor: pointer; border: none; }
        .video-stretch { object-fit: fill !important; }
        @media (orientation: portrait) { .video-stretch { object-fit: contain !important; } }
      `}</style>

      <Script
        src="https://cdn.dashjs.org/latest/dash.all.min.js"
        strategy="afterInteractive"
        onLoad={() => setIsDashReady(true)}
      />

      <div
        className="bg-slate-950 text-white"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* ── URL Bar ── */}
        <div className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-3 py-2.5">
          <div className="flex items-center gap-2">
            {/* Branding */}
            <div className="hidden sm:block shrink-0">
              <div className="flex items-center gap-2">
                {logo_url && (
                  <img
                    src={logo_url}
                    alt="Nellai IPTV"
                    className="h-8 w-8 rounded-lg object-cover"
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                )}
                <span className="font-bold text-base leading-none">
                  <span className="text-white">Nellai </span>
                  <span className="text-cyan-400">IPTV</span>
                </span>
              </div>
            </div>
            <div className="w-px h-5 bg-slate-700 hidden sm:block" />

            {/* Input */}
            <div className="flex-1 relative min-w-0">
              <input
                type="text"
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLoad()}
                onFocus={() => setShowExamples(true)}
                onBlur={() => setTimeout(() => setShowExamples(false), 200)}
                placeholder="Paste HLS (.m3u8), DASH (.mpd), or video URL and press Enter..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              {inputUrl && (
                <button
                  onClick={clearStream}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5 rounded transition-colors"
                  title="Clear"
                  tabIndex={-1}
                >
                  <X size={14} />
                </button>
              )}

              {/* Example dropdown */}
              {showExamples && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-3 py-2 text-xs text-slate-500 font-medium border-b border-slate-800">Example streams</div>
                  {EXAMPLE_STREAMS.map(ex => (
                    <button
                      key={ex.url}
                      onMouseDown={() => { setInputUrl(ex.url); setSelectedType(ex.type); handleLoad(ex.url, ex.type); }}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-800 transition-colors flex items-center justify-between gap-2"
                    >
                      <span className="text-slate-300 truncate">{ex.label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-bold shrink-0 ${TYPE_BADGE[ex.type as DetectedType]?.cls}`}>
                        {TYPE_BADGE[ex.type as DetectedType]?.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Type selector */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as StreamType)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer shrink-0"
            >
              <option value="auto">Auto</option>
              <option value="hls">HLS</option>
              <option value="dash">DASH</option>
              <option value="mp4">MP4</option>
            </select>

            {/* Load */}
            <button
              onClick={() => handleLoad()}
              disabled={!inputUrl.trim()}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap shrink-0"
            >
              Load
            </button>
          </div>
        </div>

        {/* ── Player ── */}
        <div
          ref={containerRef}
          className="relative bg-black overflow-hidden"
          style={{ height: 'calc(100vh - 56px)' }}
          onMouseMove={showControls}
        >
          {/* Video element */}
          <video
            ref={videoRef}
            className={`w-full h-full${isStretched ? ' video-stretch' : ''}`}
            style={{ display: 'block', objectFit: 'contain' }}
            playsInline
          />

          {/* Click-to-play overlay */}
          {hasStream && (
            <div
              className="absolute inset-0 z-10 cursor-pointer"
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
            />
          )}

          {/* ── Idle state ── */}
          {!hasStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-20">
              <div className="w-24 h-24 rounded-full bg-slate-800/80 ring-1 ring-slate-700 flex items-center justify-center mb-5">
                <Play size={40} className="text-slate-600 ml-2" />
              </div>
              <p className="text-slate-300 text-xl font-semibold mb-1">Universal Media Player</p>
              <p className="text-slate-500 text-sm mb-6">Paste a stream URL above and click Load, or pick an example</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {(['HLS (.m3u8)', 'DASH (.mpd)', 'MP4 / WebM', 'HTTP / HTTPS'] as const).map(t => (
                  <span key={t} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-500 font-medium">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── Loading spinner ── */}
          {status === 'loading' && hasStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30 pointer-events-none">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-[3px] border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-white text-sm animate-pulse">Loading stream…</p>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-30">
              <div className="text-center max-w-sm px-6">
                <div className="w-16 h-16 rounded-full bg-red-500/15 ring-1 ring-red-500/40 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={30} className="text-red-400" />
                </div>
                <p className="text-white font-bold text-lg mb-1">Playback Failed</p>
                <p className="text-slate-400 text-sm mb-5 leading-relaxed">{error}</p>
                <button
                  onClick={() => activeUrl && detectedType && loadStream(activeUrl, detectedType)}
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
                >
                  <RefreshCw size={15} /> Retry
                </button>
              </div>
            </div>
          )}

          {/* ── Controls overlay ── */}
          {hasStream && (
            <div
              className="absolute inset-0 flex flex-col justify-end z-20 transition-opacity duration-300 pointer-events-none"
              style={{ opacity: controlsVisible ? 1 : 0 }}
            >
              {/* Gradient scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              {/* Top badges */}
              <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                {detectedType && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${TYPE_BADGE[detectedType].cls}`}>
                    {TYPE_BADGE[detectedType].label}
                  </span>
                )}
                {isLive && (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-red-600 rounded text-xs font-bold">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>

              {/* Bottom controls */}
              <div className="relative px-4 pb-3 pt-8 flex flex-col gap-2 pointer-events-auto">
                {/* Seek bar (VOD only) */}
                {!isLive && duration > 0 && isFinite(duration) && (
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="tabular-nums w-10 text-right shrink-0">{formatTime(currentTime)}</span>
                    <input
                      type="range"
                      className="range-slider flex-1 bg-slate-600"
                      style={{ accentColor: '#06b6d4' }}
                      min={0}
                      max={duration}
                      step={0.5}
                      value={currentTime}
                      onChange={e => handleSeek(parseFloat(e.target.value))}
                    />
                    <span className="tabular-nums w-10 shrink-0">{formatTime(duration)}</span>
                  </div>
                )}

                {/* Buttons row */}
                <div className="flex items-center gap-3">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-cyan-400 transition-colors"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>

                  {/* Reload */}
                  <button
                    onClick={() => activeUrl && detectedType && loadStream(activeUrl, detectedType)}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Reload stream"
                  >
                    <RotateCcw size={18} />
                  </button>

                  {/* Volume */}
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-cyan-400 transition-colors"
                    title="Mute (M)"
                  >
                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input
                    type="range"
                    className="range-slider w-20 bg-slate-600 hidden sm:block"
                    style={{ accentColor: '#06b6d4' }}
                    min={0} max={1} step={0.02}
                    value={isMuted ? 0 : volume}
                    onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                  />

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Keyboard hints */}
                  <span className="text-slate-600 text-xs hidden lg:block select-none">
                    Space · M · F · S · ←10s→
                  </span>

                  {/* Stretch toggle */}
                  <button
                    onClick={() => { setIsStretched(p => !p); showControls(); }}
                    title={isStretched ? 'Stretch: ON — click to contain (S)' : 'Stretch: OFF — click to stretch (S)'}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      isStretched
                        ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-400'
                        : 'bg-black/40 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Scaling size={14} />
                    <span className="hidden sm:inline">Stretch</span>
                  </button>

                  {/* Quality (HLS) */}
                  {qualities.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowQualityMenu(p => !p)}
                        className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                      >
                        {currentQualityLabel}
                        <ChevronDown size={11} />
                      </button>
                      {showQualityMenu && (
                        <div className="absolute bottom-10 right-0 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-40 min-w-[110px]">
                          {qualities.map(q => (
                            <button
                              key={q.index}
                              onClick={() => handleQualityChange(q.index)}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-800 transition-colors ${q.index === currentQuality ? 'text-cyan-400 font-semibold' : 'text-slate-300'}`}
                            >
                              {q.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-cyan-400 transition-colors"
                    title="Fullscreen (F)"
                  >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Watermark — visible only during playback */}
          {app_logo_png_url && isPlaying && (
            <img
              src={app_logo_png_url}
              alt="Watermark"
              className="absolute bottom-14 w-24 sm:w-32 md:w-40 opacity-35 pointer-events-none select-none z-20 drop-shadow-lg"
              style={{ left: '21px' }}
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          )}
        </div>

        {/* ── SEO Content ── */}
        <div className="bg-slate-950 px-4 py-14 md:py-20">
          <div className="max-w-5xl mx-auto">

            {/* Hero text */}
            <div className="text-center mb-14">
              <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                Free Online Video Player —{' '}
                <span className="text-cyan-400">HLS, DASH &amp; MP4</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                Play any HLS stream, DASH manifest, or MP4 file directly in your browser.
                No installation, no sign-up — paste a URL and hit Load.
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
              {[
                { icon: '📡', title: 'HLS (.m3u8)', desc: 'Powered by HLS.js. Supports live streams, DVR windows, and multi-bitrate adaptive playlists.' },
                { icon: '🎬', title: 'MPEG-DASH (.mpd)', desc: 'Powered by DASH.js. Plays VOD and live DASH manifests with adaptive bitrate switching.' },
                { icon: '🎥', title: 'MP4 / WebM / Native', desc: 'Direct HTML5 playback for MP4, WebM, OGG, MOV, and other browser-native formats.' },
                { icon: '📶', title: 'Adaptive Quality', desc: 'HLS quality levels listed automatically. Switch between 1080p, 720p, 480p, or let Auto decide.' },
                { icon: '🔴', title: 'Live Stream Support', desc: 'Detects live streams automatically, shows a LIVE badge, and disables the seek bar.' },
                { icon: '🔒', title: 'HTTPS Auto-Upgrade', desc: 'HTTP stream URLs are silently upgraded to HTTPS when the page is served over a secure connection.' },
              ].map(f => (
                <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
                  <div className="text-2xl mb-3">{f.icon}</div>
                  <h2 className="text-white font-semibold text-base mb-1">{f.title}</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Keyboard shortcuts */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-14">
              <h2 className="text-white font-bold text-lg mb-4">Keyboard Shortcuts</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[
                  { key: 'Space', action: 'Play / Pause' },
                  { key: 'F', action: 'Toggle fullscreen' },
                  { key: 'M', action: 'Toggle mute' },
                  { key: 'S', action: 'Toggle stretch' },
                  { key: '← →', action: 'Seek ±10 seconds' },
                  { key: '↑ ↓', action: 'Volume ±10%' },
                ].map(s => (
                  <div key={s.key} className="flex items-center gap-3">
                    <kbd className="bg-slate-800 border border-slate-700 text-cyan-400 font-mono text-xs px-2 py-1 rounded shrink-0">{s.key}</kbd>
                    <span className="text-slate-400 text-sm">{s.action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="mb-10">
              <h2 className="text-white font-bold text-2xl mb-6 text-center">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {[
                  {
                    q: 'What is an HLS player?',
                    a: 'HLS (HTTP Live Streaming) is a streaming protocol developed by Apple. An HLS player fetches .m3u8 playlist files and plays the video segments they reference. This player uses HLS.js to support HLS in all modern browsers, not just Safari.',
                  },
                  {
                    q: 'How do I play an M3U8 stream online?',
                    a: 'Paste your .m3u8 URL into the input above and click Load (or press Enter). The player auto-detects HLS streams by URL pattern and starts playback immediately. For password-protected or token-based streams, make sure the full URL including query parameters is pasted.',
                  },
                  {
                    q: 'What is MPEG-DASH and how is it different from HLS?',
                    a: 'MPEG-DASH (Dynamic Adaptive Streaming over HTTP) uses .mpd manifest files and is an open standard, whereas HLS was created by Apple. Both support adaptive bitrate streaming. This player handles DASH via DASH.js, giving you quality selection and live stream support.',
                  },
                  {
                    q: 'Can I use this as an IPTV player?',
                    a: 'Yes. IPTV streams are typically delivered as HLS (.m3u8) or RTSP. Paste any HLS IPTV stream URL here to test or watch it. For full M3U playlist support and channel lists, check out the main Nellai IPTV channels page.',
                  },
                  {
                    q: 'Why does my stream fail with a CORS error?',
                    a: 'CORS (Cross-Origin Resource Sharing) errors happen when the stream server does not allow requests from other origins. This is a server-side restriction and cannot be bypassed by the player. Contact the stream provider or use a CORS proxy for testing.',
                  },
                  {
                    q: 'Does this player work on mobile?',
                    a: 'Yes. The player is fully responsive. On portrait/mobile screens the video is letterboxed (contain) to preserve the aspect ratio. In landscape it fills the screen. The Stretch toggle forces fill mode in landscape for SD-to-HD content.',
                  },
                ].map(item => (
                  <details
                    key={item.q}
                    className="bg-slate-900 border border-slate-800 rounded-xl group"
                  >
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-white font-medium text-sm list-none select-none hover:bg-slate-800/50 rounded-xl transition-colors">
                      {item.q}
                      <span className="text-slate-500 text-lg ml-4 shrink-0 group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p className="px-5 pb-4 text-slate-400 text-sm leading-relaxed">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>

            {/* Footer credit */}
            <p className="text-center text-slate-600 text-xs">
              Powered by{' '}
              <a href="https://github.com/video-dev/hls.js" className="text-slate-500 hover:text-slate-400 underline" target="_blank" rel="noopener noreferrer">HLS.js</a>
              {' '}and{' '}
              <a href="https://github.com/Dash-Industry-Forum/dash.js" className="text-slate-500 hover:text-slate-400 underline" target="_blank" rel="noopener noreferrer">DASH.js</a>
              {' '}· A free tool by{' '}
              <a href="https://nellaiiptv.com" className="text-cyan-700 hover:text-cyan-500 underline">Nellai IPTV</a>
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
