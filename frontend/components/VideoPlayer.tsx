'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import Hls from 'hls.js';
import { useTVFocus } from '@/hooks/useTVFocus';
import { useRouter } from 'next/navigation';
import ReportModal from './ReportModal';
import { AlertTriangle, RefreshCw, Lock, Crown } from 'lucide-react';
import PlayerOverlay from './PlayerOverlay';
import { Channel } from '@/types';
import { useViewMode } from '@/context/ViewModeContext';
import { useWatchHistory } from '@/hooks/useWatchHistory';

interface Props {
  src: string;
  poster?: string;
  // Output Events
  onVideoPlay?: () => void;
  onVideoPause?: () => void;
  // onReady removed as it was specific to video.js player instance
  channelUuid?: string;
  channelName?: string;
  // Overlay / STB Features
  channels?: Channel[];
  topTrending?: Channel[]; 
  viewersCount?: number;   
  currentGroup?: string;
  onChannelSelect?: (c: Channel) => void;
  onNextGroup?: () => void;
  onPrevGroup?: () => void;
  useCustomOverlay?: boolean;
  
  // Advanced Grouping
  allGroupedChannels?: { [key: string]: Channel[] };
  groupKeys?: string[];
  currentGroupType?: 'all' | 'language' | 'category';
  onGroupTypeChange?: (type: 'all' | 'language' | 'category') => void;
  onGroupSelect?: (group: string) => void;
}

// Helper to extract video ID and create embed URL
const getYoutubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&enablejsapi=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0` : url;
};

// Internal TV-Focusable Report Button
function TVReportButton({ onClick, className }: { onClick: (e: any) => void; className: string }) {
    const { focusProps, isFocused } = useTVFocus({
        onEnter: () => onClick({} as any), // Mock event or just call it
        className: className,
        focusClassName: 'ring-2 ring-red-500 scale-110 bg-red-600'
    });

    return (
        <button 
            onClick={onClick} 
            {...focusProps} 
            className={`${className} ${isFocused ? 'ring-2 ring-red-500 scale-110 bg-red-600' : ''}`}
            title="Report Stream Issue"
        >
            <AlertTriangle size={20} />
        </button>
    );
}

function VideoPlayer({ 
  src, poster, channelUuid, channelName, 
  channels, topTrending, viewersCount = 0, currentGroup, onChannelSelect, onNextGroup, onPrevGroup,
  useCustomOverlay = true,
  allGroupedChannels, groupKeys, currentGroupType, onGroupTypeChange, onGroupSelect
}: Props) {
  const router = useRouter();
  
  // Detect Media Type
  const isYoutube = src && (src.includes('youtube.com') || src.includes('youtu.be'));
  const isPaidRestricted = src === 'PAID_RESTRICTED';
  const isPlatformRestricted = src && src.startsWith('RESTRICTED:');
  const platformRestrictionMessage = isPlatformRestricted ? src.replace('RESTRICTED:', '').trim() : '';

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [showReport, setShowReport] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = useCallback(() => {
      setErrorMessage(null);
      setIsLoading(true);
      setRetryKey(prev => prev + 1);
  }, []);
  
  // YouTube Command Helper
  const sendYoutubeCommand = useCallback((func: string, args: any[] = []) => {
      const iframe = containerRef.current?.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(JSON.stringify({
              'event': 'command',
              'func': func,
              'args': args
          }), '*');
      }
  }, []);

  // History Hook
  const { addToHistory } = useWatchHistory();
  const historyTrackedRef = useRef(false);

  // Picture in Picture State
  const [isPiP, setIsPiP] = useState(false);
  const [showAirPlay, setShowAirPlay] = useState(false);

  useEffect(() => {
    // Reset tracked state on channel change
    historyTrackedRef.current = false;
  }, [channelUuid]);
  
  // Create AirPlay availability listener
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).WebKitPlaybackTargetAvailabilityEvent) {
        const video = videoRef.current;
        if (video) {
            video.addEventListener('webkitplaybacktargetavailabilitychanged', (event: any) => {
                if (event.availability === 'available') {
                    setShowAirPlay(true);
                }
            });
        }
    }
  }, []);

  // Controls Visibility State
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Player State
  const [isPlaying, setIsPlaying] = useState(true); // Default to playing for auto-play
  const [isMuted, setIsMuted] = useState(false); 
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Preloader State (Youtube handles its own mostly)
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);

  // Quality State
  interface VideoQuality {
      index: number;
      label: string;
  }
  const [qualities, setQualities] = useState<VideoQuality[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto

  const handleQualityChange = useCallback((index: number) => {
      if (hlsRef.current) {
          hlsRef.current.currentLevel = index;
          setCurrentQuality(index);
      }
  }, []);

  // Sync current channel for overlay display
  useEffect(() => {
     if (channels && channelUuid) {
         const found = channels.find(c => c.uuid === channelUuid);
         if (found) setCurrentChannel(found);
         else if (topTrending) {
             const foundTrending = topTrending.find(c => c.uuid === channelUuid);
             if (foundTrending) setCurrentChannel(foundTrending);
         }
     }
  }, [channels, topTrending, channelUuid]);

  // Focus Handling
  const { focusProps, isFocused } = useTVFocus({
    className: 'relative w-full h-full outline-none transition-all duration-200',
    focusClassName: 'ring-4 ring-primary z-20'
  });

  // User Activity / Interaction Handler
  const showControls = useCallback(() => {
     setControlsVisible(true);
     if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
     controlsTimeoutRef.current = setTimeout(() => {
         // Only hide if playing
         const vid = videoRef.current;
         if (isPlaying) {
             setControlsVisible(false);
         }
     }, 4000);
  }, [isYoutube]);

  const toggleControls = useCallback(() => {
      setControlsVisible(prev => {
          if (!prev) {
              showControls(); // Show and start timer
              return true;
          }
           // If hiding, clear timer
           if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
           return false;
      });
  }, [showControls]);

  // Handle Mouse Move 
  const handleMouseMove = useCallback(() => {
      // Ignore mouse move on touch devices to prevent conflict with click toggle
      if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return;

      if (!controlsVisible) showControls();
      else {
          // Reset timer
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
          controlsTimeoutRef.current = setTimeout(() => {
             const vid = videoRef.current;
             if ((isYoutube || (vid && !vid.paused))) setControlsVisible(false);
          }, 4000);
      }
  }, [controlsVisible, showControls, isYoutube]);


  // Track history when playing starts
  useEffect(() => {
    if (isPlaying && channelUuid && channelName && !historyTrackedRef.current && !isPaidRestricted && !isPlatformRestricted) {
        addToHistory({
            uuid: channelUuid,
            name: channelName,
            thumbnail_url: poster || '',
            channel_number: currentChannel?.channel_number || 0,
            id: 0, stream_url: src, village: '', state_id: 0, language_id: 0, district_id: 0, viewers_count: 0, expiry_at: '', status: 'active', created_at: ''
        });
        historyTrackedRef.current = true;
    }
  }, [isPlaying, channelUuid, channelName, poster, currentChannel, src, addToHistory]);

  // Controls Logic
  const handlePlayPause = useCallback(() => {
      if (isPaidRestricted) return;

      if (isYoutube) {
          const action = isPlaying ? 'pauseVideo' : 'playVideo';
          sendYoutubeCommand(action);
          setIsPlaying(!isPlaying);
          showControls();
          return;
      }

      const vid = videoRef.current;
      if (!vid) return;
      
      if (vid.paused) {
          vid.play().catch(() => {});
      } else {
          vid.pause();
      }
      
      // Update controls visibility
      if (!vid.paused) {
          setControlsVisible(true);
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      } else {
          showControls();
      }
  }, [showControls, isYoutube, isPlaying, sendYoutubeCommand]);



  // PiP Handler
  const togglePiP = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (err) {
      console.error("PiP failed", err);
    }
  }, []);

  // AirPlay Handler
  const triggerAirPlay = useCallback(() => {
     if (videoRef.current && (videoRef.current as any).webkitShowPlaybackTargetPicker) {
         (videoRef.current as any).webkitShowPlaybackTargetPicker();
     }
  }, []);
  
  const handleToggleMute = useCallback(() => {
      if (isYoutube) {
          const action = isMuted ? 'unMute' : 'mute';
          sendYoutubeCommand(action);
          setIsMuted(!isMuted);
          showControls();
          return;
      }

      const vid = videoRef.current;
      if (!vid) return;
      vid.muted = !vid.muted;
      setIsMuted(vid.muted);
      showControls();
  }, [showControls, isYoutube, isMuted, sendYoutubeCommand]);

  const handleVolumeChange = useCallback((newVol: number) => {
      const vol = Math.max(0, Math.min(1, newVol));
      setVolume(vol);

      if (isYoutube) {
          sendYoutubeCommand('setVolume', [vol * 100]);
          if (vol > 0 && isMuted) {
             sendYoutubeCommand('unMute');
             setIsMuted(false);
          }
          showControls();
          return;
      }

      const vid = videoRef.current;
      if (!vid) return;
      
      vid.volume = vol;
      
      if (vol > 0 && vid.muted) {
          vid.muted = false;
          setIsMuted(false);
      }
      showControls();
  }, [showControls, isYoutube, isMuted, sendYoutubeCommand]);

  const handleNextChannel = useCallback(() => {
      showControls();
      if (!channels || !onChannelSelect || !currentChannel) return;
      const idx = channels.findIndex(c => c.uuid === currentChannel.uuid);
      if (idx !== -1) {
          const nextIdx = (idx + 1) % channels.length;
          onChannelSelect(channels[nextIdx]);
      } else if (channels.length > 0) {
          onChannelSelect(channels[0]);
      }
  }, [channels, currentChannel, onChannelSelect, showControls]);

  const handlePrevChannel = useCallback(() => {
      showControls();
      if (!channels || !onChannelSelect || !currentChannel) return;
      const idx = channels.findIndex(c => c.uuid === currentChannel.uuid);
      if (idx !== -1) {
          const prevIdx = (idx - 1 + channels.length) % channels.length;
          onChannelSelect(channels[prevIdx]);
      } else if (channels.length > 0) {
          onChannelSelect(channels[channels.length - 1]);
      }
  }, [channels, currentChannel, onChannelSelect, showControls]);

  const toggleFullscreen = useCallback(() => {
      const el = containerRef.current;
      if (!el) return;
      
      if (!document.fullscreenElement) {
          el.requestFullscreen().catch(err => console.log(err));
      } else {
          document.exitFullscreen();
      }
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      toggleFullscreen();
  }, [toggleFullscreen]);


  // Custom key handler for player
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    showControls(); 
    
    switch (e.key) {
      case 'Enter':
      case ' ': 
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'BUTTON') return; 
        e.preventDefault();
        handlePlayPause();
        break;
      case 'ArrowUp':
        if (document.activeElement?.tagName === 'BUTTON') return;
        e.preventDefault();
        handleNextChannel();
        break;
      case 'ArrowDown':
        if (document.activeElement?.tagName === 'BUTTON') return;
        e.preventDefault();
        handlePrevChannel();
        break;
      case 'ArrowRight':
         if (document.activeElement?.tagName === 'BUTTON') return;
         e.preventDefault();
         handleVolumeChange(volume + 0.1);
        break;
      case 'ArrowLeft':
         if (document.activeElement?.tagName === 'BUTTON') return;
         e.preventDefault();
         handleVolumeChange(volume - 0.1);
        break;
      case 'Backspace':
      case 'Escape':
        e.preventDefault();
        router.back();
        break;
    }
  }, [router, handlePlayPause, handleVolumeChange, volume, showControls, handleNextChannel, handlePrevChannel, isYoutube]);

  // -- Hls.js Logic --
  useEffect(() => {
    // Skip HLS logic if youtube OR restricted
    if (isYoutube || isPaidRestricted || isPlatformRestricted) {
        setIsLoading(false);
        return;
    }

    let hls: Hls | null = null;
    const video = videoRef.current;
    
    // Reset State on source change
    setErrorMessage(null);
    setIsLoading(true);

    if (!video) return;

// Device Profile & HLS Optimization
    // Device Profile
    // Device Profile
    const getDeviceProfile = () => {
        if (typeof navigator === 'undefined') return { isTV: false, isMobile: false, tier: 'low' };
        
        const ua = navigator.userAgent.toLowerCase();
        const nav = navigator as any; 
        const cores = nav.hardwareConcurrency || 2;
        const memory = nav.deviceMemory || 1;

        const isTV =
            ua.includes("android tv") ||
            ua.includes("smarttv") ||
            ua.includes("tizen") ||
            ua.includes("webos") ||
            ua.includes("tv");

        const isMobile = /android|iphone|ipad|ipod/.test(ua);

        // Tier Logic
        let tier = 'low';
        if (cores >= 4 && memory >= 2) tier = 'high';
        if (isTV && (cores < 4 || memory < 2)) tier = 'low'; // Force low for weak TVs

        return { isTV, isMobile, tier, cores, memory };
    };

    const buildHlsConfig = (profile: any) => {
        const base = {
            lowLatencyMode: false,
            // ✅ Enable Worker for React Apps (Offloads parsing from Main Thread)
            enableWorker: true,
            // ❌ Prevent TV from forcing low res
            capLevelToPlayerSize: false,
            // ❌ Avoid aggressive prefetch
            startFragPrefetch: false,
            progressive: true,
            testBandwidth: true,
            // ABR stability
            abrEwmaFastLive: 5,
            abrEwmaSlowLive: 12,
            // 🚀 START AT SAFE QUALITY (KEY FIX)
            startLevel: 1, // 480p / 720p depending on ladder
            // 🎯 Allow quality upgrade
            abrBandWidthFactor: 0.85,
            abrBandWidthUpFactor: 0.7,
            // Prevent constant downscale
            abrMaxWithRealBitrate: true
        };

        /* 📺 ANDROID TV (OLD MODELS SAFE) */
        if (profile.isTV) {
            // 🛑 LOW TIER TV (Old Android / Tizen / WebOS)
            if (profile.tier === 'low') {
                return {
                    ...base,
                    startLevel: 0, // Absolute lowest quality start
                    maxBufferLength: 15, // Reduced buffer overhead
                    maxMaxBufferLength: 30,
                    backBufferLength: 5, 
                    maxBufferSize: 15 * 1000 * 1000, // 15MB limit
                    
                    // Very Conservative ABR
                    abrBandWidthFactor: 0.5, 
                    abrBandWidthUpFactor: 0.3,
                    
                    maxStarvationDelay: 4,
                    maxLoadingDelay: 2
                };  
            }

            // 🚀 HIGH TIER TV (Shield / Fire TV 4K)
            return {
                ...base,
                maxBufferLength: 20,
                maxMaxBufferLength: 40,
                backBufferLength: 8,
                // Low RAM protection
                maxBufferSize: 20 * 1000 * 1000,
                maxStarvationDelay: 6,
                maxLoadingDelay: 4
            };
        }

        /* 📱 MOBILE */
        if (profile.isMobile) {
            return {
                ...base,
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                backBufferLength: 15,
                maxBufferSize: 30 * 1000 * 1000
            };
        }

        /* 💻 PC */
        return {
            ...base,
            maxBufferLength: 60,
            maxMaxBufferLength: 120,
            backBufferLength: 30,
            maxBufferSize: 60 * 1000 * 1000
        };
    };

    // Priority: HLS.js (Optimized) > Native (Fallback for iOS/Safari)
    if (Hls.isSupported()) {
        const profile = getDeviceProfile();
        
        // 🚀 LITE MODE REDIRECT (For Low-End TVs)
        // If the user is on a slow TV, we redirect them to the Zero-Overhead Lite Player
        // This bypasses the entire React Render Loop for maximum performance.
        if (profile.isTV && profile.tier === 'low' && channelUuid) {
            window.location.href = `/lite?channel=${channelUuid}`;
            return; // Stop execution
        }

        const hlsConfig = buildHlsConfig(profile);

        hls = new Hls({
             debug: false,
             ...hlsConfig
        });
        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);
        
        // 🔥 CRITICAL ADDITION
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        video.style.imageRendering = "auto";
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            const levels = hls?.levels || [];
            
            const mappedLevels = levels.map((level, index) => {
                let label = '';
                if (level.height) {
                    label = `${level.height}p`;
                } else if (level.bitrate) {
                    const kbps = Math.round(level.bitrate / 1000);
                    label = `${kbps} Kbps`;
                } else {
                    label = `Stream ${index + 1}`;
                }
                return { index, label, height: level.height };
            });
            
            setQualities([{ index: -1, label: 'Auto' }, ...mappedLevels.reverse()]); 
            
            video.play().catch(() => {});
            setIsPlaying(true);
        });

        hls.on(Hls.Events.FRAG_BUFFERED, () => {
             setIsLoading(false);
        });

        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
               setIsLoading(false);
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    hls?.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    hls?.recoverMediaError();
                    break;
                  default:
                    hls?.destroy();
                    setErrorMessage("Stream failed (HLS Error)");
                    break;
              }
            }
        });
    } 
    // Fallback: Native HLS (iOS / Safari / Very Old TVs without MSE)
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
            video.play().catch(() => {});
            setIsPlaying(true);
        });
        video.addEventListener('canplay', () => setIsLoading(false));
        video.addEventListener('error', () => {
             setIsLoading(false);
             setErrorMessage("Native Stream failed");
        });
    } else {
        setIsLoading(false);
        setErrorMessage("HLS not supported on this browser.");
    } 


    return () => {
        if (hls) {
            hls.destroy();
        }
        hlsRef.current = null;
    };
  }, [src, isYoutube, retryKey, isPaidRestricted]);

  // Auto Retry Logic
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (errorMessage) {
          setRetryCountdown(10);
          interval = setInterval(() => {
              setRetryCountdown(prev => {
                  if (prev === null || prev <= 1) {
                      handleRetry();
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
      } else {
          setRetryCountdown(null);
      }
      return () => clearInterval(interval);
  }, [errorMessage, handleRetry]);

  // Loading Timeout Logic
  useEffect(() => {
    // Skip timeout if youtube OR restricted
    if (isYoutube || isPaidRestricted || isPlatformRestricted) return;

    let timeout: NodeJS.Timeout;
    if (isLoading && !errorMessage) {
        timeout = setTimeout(() => {
            setErrorMessage("Connection Timeout");
            setIsLoading(false);
            if (videoRef.current) videoRef.current.pause();
            if (hlsRef.current) hlsRef.current.stopLoad();
        }, 20000); // 20s Timeout
    }
    return () => clearTimeout(timeout);
  }, [isLoading, errorMessage, isYoutube]);

  // Handle native video events for state sync
  useEffect(() => {
      // Skip if youtube
      if (isYoutube) return;

      const vid = videoRef.current;
      if (!vid) return;

      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onVolChange = () => {
          setVolume(vid.volume);
          setIsMuted(vid.muted);
      };
      const onFSChange = () => {
          setIsFullscreen(document.fullscreenElement === containerRef.current);
      }
      
      const onWaiting = () => setIsLoading(true);
      const onPlaying = () => setIsLoading(false);
      
      // Initialize state from video element defaults
      setVolume(vid.volume);
      setIsMuted(vid.muted);

      vid.addEventListener('play', onPlay);
      vid.addEventListener('pause', onPause);
      vid.addEventListener('volumechange', onVolChange);
      vid.addEventListener('waiting', onWaiting);
      vid.addEventListener('playing', onPlaying);
      document.addEventListener('fullscreenchange', onFSChange);

      return () => {
          vid.removeEventListener('play', onPlay);
          vid.removeEventListener('pause', onPause);
          vid.removeEventListener('volumechange', onVolChange);
          vid.removeEventListener('waiting', onWaiting);
          vid.removeEventListener('playing', onPlaying);
          document.removeEventListener('fullscreenchange', onFSChange);
      }
  }, [isYoutube]); // Run once on mount to attach listeners

  // Portal Target
  const mountTarget = overlayRef.current || containerRef.current;

  const overlayPortal = (useCustomOverlay && channels && mountTarget && !isPaidRestricted && !isPlatformRestricted) ? createPortal(
    <PlayerOverlay
      visible={controlsVisible}
      channels={channels}
      topTrending={topTrending}
      currentGroup={currentGroup || ''}
      currentChannel={currentChannel}
      viewersCount={viewersCount}
      
      isPlaying={isPlaying}
      isMuted={isMuted}
      volume={volume}
      onPlayPause={handlePlayPause}
      onToggleMute={handleToggleMute}
      onVolumeChange={handleVolumeChange}
      onNextChannel={handleNextChannel}
      onPrevChannel={handlePrevChannel}
      isFullscreen={isFullscreen}
      onToggleFullscreen={toggleFullscreen}
      
      onSelect={(c) => {
          if (onChannelSelect) onChannelSelect(c);
      }}
      onNextGroup={onNextGroup || (() => {})}
      onPrevGroup={onPrevGroup || (() => {})}
      onClose={() => setControlsVisible(false)}

      // Grouping
      groupedChannels={allGroupedChannels}
      groupKeys={groupKeys}
      currentGroupType={currentGroupType}
      onGroupTypeChange={onGroupTypeChange}
      onGroupSelect={onGroupSelect}
      
      // Quality Props
      qualities={qualities}
      currentQuality={currentQuality}
      onQualityChange={handleQualityChange}
      
      // New Features
      onTogglePiP={!isYoutube ? togglePiP : undefined}
      isPiP={isPiP}
      onAirPlay={showAirPlay ? triggerAirPlay : undefined}
      

    />,
    mountTarget as Element
  ) : null;

  return (
    <>
    <div
      ref={containerRef}
      style={{ maxWidth: '1920px', width: '100%', height: '100%', margin: '0 auto', position: 'relative', overflow: 'hidden' }}
      {...focusProps}
      onKeyDown={(e) => {
        handleKeyDown(e);
        if (focusProps.onKeyDown) focusProps.onKeyDown(e);
      }}
      // Mouse/Touch Handlers for Visibility
      onMouseMove={handleMouseMove}
      onClick={toggleControls}
      onDoubleClick={handleDoubleClick}
      className={`${focusProps.className} ${isFocused ? 'ring-4 ring-white z-20 shadow-[0_0_30px_rgba(255,255,255,0.3)]' : ''} cursor-pointer bg-black`} 
    >
      {/* RENDER LOGIC SWITCH */}
      {isPlatformRestricted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-900/90 text-center z-10">
              <div className="bg-red-500/20 p-6 rounded-full mb-4 animate-pulse">
                  <Lock size={48} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Unavailable on Device</h2>
              <p className="text-slate-400 max-w-md mx-auto mb-6">
                  {platformRestrictionMessage || 'This channel does not support the current platform.'}
              </p>
              <button 
                {...focusProps} // Re-use focus props for back button
                onClick={() => router.push('/')}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                  Back to Home
              </button>
          </div>
      ) : isPaidRestricted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-900/90 text-center z-10">
              <div className="bg-yellow-500/20 p-6 rounded-full mb-4 animate-pulse">
                  <Lock size={48} className="text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{channelName} - Premium Content</h2>
              <p className="text-slate-300 max-w-md">
                  This channel is available exclusively for premium subscribers. Please subscribe to access this content.
              </p>
          </div>
      ) : isYoutube ? (
          <div className="relative w-full h-full">
              <iframe 
                src={getYoutubeEmbedUrl(src)} 
                className="absolute inset-0 w-full h-full border-none"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                loading="eager"
                title={channelName}
                style={{ pointerEvents: 'none' }} // Ensure clicks go to shim
              />
              {/* Interaction Overlay Shim for YouTube */}
              <div 
                  className="absolute inset-0 z-10 w-full h-full bg-transparent cursor-pointer"
                  onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause();
                  }}
                  onDoubleClick={(e) => {
                      // Pass double click up or handle it
                      // Double click naturally bubbles if not stopped here, but we might want to ensure it works
                      // But let's let standard bubbling handle dblclick if we don't stop it.
                      // Note: We are stopping Click propagation, not dblclick.
                  }}
              />
          </div>
      ) : (
          /* Video Element (Direct HLS) */
          <video
              ref={videoRef}
              className="w-full h-full object-fill"
              playsInline
              crossOrigin="anonymous"
              autoPlay
          />
      )}

      {/* Overlay Mount Point - Always Render */}
      <div ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none z-30" />

      {/* Loading Spinner */}
      {isLoading && !errorMessage && !isPaidRestricted && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
              <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-white font-medium animate-pulse">Loading...</p>
              </div>
          </div>
      )}

      {/* Playback Error Overlay */}
      {errorMessage && !isPaidRestricted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
          <div className="text-center px-6 max-w-md">
            <div className="inline-flex p-3 rounded-full bg-red-500/20 text-red-500 mb-4">
                 <AlertTriangle size={32} />
            </div>
            <p className="text-white text-xl font-bold mb-2">
              Playback Error
            </p>
            <p className="text-slate-400 text-sm mb-6">{errorMessage}</p>

            <div className="flex items-center gap-3">
                <button
                    onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                    className="flex-1 bg-white hover:bg-slate-200 text-black px-6 py-2.5 rounded-lg font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                    <RefreshCw size={18} className={retryCountdown ? 'animate-spin' : ''} />
                    {retryCountdown ? `${retryCountdown}` : 'Retry'}
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setShowReport(true); }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-lg hover:shadow-red-600/20"
                >
                    Report
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Report Button */}
      {!errorMessage && (controlsVisible || !isPlaying || isLoading) && !isPaidRestricted && (
        <TVReportButton 
            onClick={(e) => {
                e.stopPropagation();
                setShowReport(true);
            }}
            className="absolute top-4 right-4 z-[60] bg-black/40 hover:bg-red-600 text-white p-2.5 rounded-full backdrop-blur-md transition-all duration-300 pointer-events-auto"
        />
      )}

      {/* Inject Portal */}
      {/* Premium Restriction Overlay */}
      {isPaidRestricted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center px-6 max-w-md">
            <div className="inline-flex p-4 rounded-full bg-yellow-500/20 text-yellow-500 mb-6 ring-1 ring-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                 <Crown size={48} fill="currentColor" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-3">
              Premium Content
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              This channel is available exclusively for Premium subscribers. Please upgrade your plan to watch.
            </p>

            <button
                onClick={() => router.push('/profile')}
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-yellow-500/20 transform hover:-translate-y-0.5"
            >
                Upgrade Now
            </button>
            <button 
                onClick={() => router.back()}
                className="mt-4 text-slate-500 hover:text-white font-medium text-sm transition-colors"
            >
                Go Back
            </button>
          </div>
        </div>
      )}

      {overlayPortal}
      
      {/* Watermark */}
      <img 
          src="/png_logo.png" 
          alt="Watermark" 
          className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 w-16 sm:w-24 md:w-32 lg:w-40 opacity-60 pointer-events-none select-none z-20 drop-shadow-md transition-all duration-300"
      />
    </div>

    <ReportModal
      isOpen={showReport}
      onClose={() => setShowReport(false)}
      channelUuid={channelUuid}
      channelName={channelName}
    />
    </>
  );
}

export default React.memo(VideoPlayer);
