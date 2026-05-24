'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  RefreshCw, AlertTriangle, ChevronDown, RotateCcw, Link2
} from 'lucide-react';

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
  { label: 'HLS — Elephants Dream', url: 'https://playertest.longtailvideo.com/adaptive/elephants_dream_playlist.m3u8', type: 'hls' as StreamType },
  { label: 'DASH — Big Buck Bunny', url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd', type: 'dash' as StreamType },
  { label: 'MP4 — Tears of Steel', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', type: 'mp4' as StreamType },
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const dashRef = useRef<any>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        setError('DASH.js is still loading — please wait a moment and try again.');
        setStatus('error');
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
      case 'ArrowRight': if (!isLive && videoRef.current) { videoRef.current.currentTime += 10; showControls(); } break;
      case 'ArrowLeft':  if (!isLive && videoRef.current) { videoRef.current.currentTime -= 10; showControls(); } break;
      case 'ArrowUp':   e.preventDefault(); handleVolumeChange(Math.min(1, volume + 0.1)); break;
      case 'ArrowDown': e.preventDefault(); handleVolumeChange(Math.max(0, volume - 0.1)); break;
    }
  }, [togglePlay, toggleMute, toggleFullscreen, handleVolumeChange, isLive, volume, showControls]);

  const hasStream = !!activeUrl;
  const progressPct = duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;
  const currentQualityLabel = qualities.find(q => q.index === currentQuality)?.label ?? 'Auto';

  return (
    <>
      <style>{`
        html, body { margin: 0; background: #0f172a; overflow: hidden; height: 100%; }
        .range-slider { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 4px; cursor: pointer; outline: none; }
        .range-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 13px; height: 13px; border-radius: 50%; background: #06b6d4; cursor: pointer; box-shadow: 0 0 0 2px rgba(6,182,212,0.3); }
        .range-slider::-moz-range-thumb { width: 13px; height: 13px; border-radius: 50%; background: #06b6d4; cursor: pointer; border: none; }
      `}</style>

      <Script
        src="https://cdn.dashjs.org/latest/dash.all.min.js"
        strategy="lazyOnload"
        onLoad={() => setIsDashReady(true)}
      />

      <div
        className="flex flex-col bg-slate-950 text-white"
        style={{ height: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* ── URL Bar ── */}
        <div className="flex-shrink-0 bg-slate-900 border-b border-slate-800 px-3 py-2.5">
          <div className="flex items-center gap-2">
            {/* Logo */}
            <span className="text-cyan-400 font-bold text-base whitespace-nowrap hidden sm:block">▶ Player</span>
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
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />

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
          className="flex-1 relative bg-black overflow-hidden"
          style={{ minHeight: 0 }}
          onMouseMove={showControls}
        >
          {/* Video element */}
          <video
            ref={videoRef}
            className="w-full h-full"
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
                    Space · M · F · ←10s→
                  </span>

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
        </div>
      </div>
    </>
  );
}
