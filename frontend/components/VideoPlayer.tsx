'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import Hls from 'hls.js';
import { useTVFocus } from '@/hooks/useTVFocus';
import { useRouter } from 'next/navigation';
import ReportModal from './ReportModal';
import { AlertTriangle } from 'lucide-react';
import PlayerOverlay from './PlayerOverlay';
import { Channel } from '@/types';
import { useViewMode } from '@/context/ViewModeContext';

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

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [showReport, setShowReport] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
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


  // Controls Logic
  const handlePlayPause = useCallback(() => {
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
          vid.play().catch(e => console.error("Play failed", e));
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
    // Skip HLS logic if youtube
    if (isYoutube) {
        setIsLoading(false);
        return;
    }

    let hls: Hls | null = null;
    const video = videoRef.current;
    
    // Reset State on source change
    setErrorMessage(null);
    setIsLoading(true);

    if (!video) return;

    // Check if HLS.js is supported
    if (Hls.isSupported()) {
        hls = new Hls({
             debug: false,
             enableWorker: true,
             lowLatencyMode: true,
             backBufferLength: 90
        });
        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);
        
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
                return { index, label };
            });
            
            // Add Auto option at the beginning
            setQualities([{ index: -1, label: 'Auto' }, ...mappedLevels.reverse()]); // Reverse to show highest first? usually standard.
            
            video.play().catch(e => console.log("HLS Auto-play failed", e));
            setIsPlaying(true);
        });

        hls.on(Hls.Events.FRAG_BUFFERED, () => {
             setIsLoading(false);
        });

        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
               setIsLoading(false); // Stop loading on fatal error
               switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log("fatal network error encountered, try to recover");
                    hls?.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log("fatal media error encountered, try to recover");
                    hls?.recoverMediaError();
                    break;
                  default:
                    // cannot recover
                    hls?.destroy();
                    setErrorMessage("Stream failed (HLS Error)");
                    break;
              }
            }
        });
    } 
    // Native HLS (Safari, iOS, some Android)
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
            video.play().catch(e => console.log("Native HLS Play failed", e));
            setIsPlaying(true);
        });
        video.addEventListener('canplay', () => setIsLoading(false));
        video.addEventListener('error', () => {
             setIsLoading(false);
             setErrorMessage("Stream failed (Native Error)");
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
  }, [src, isYoutube]);

  // Loading Timeout Logic
  useEffect(() => {
    // Skip timeout if youtube
    if (isYoutube) return;

    let timeout: NodeJS.Timeout;
    if (isLoading && !errorMessage) {
        timeout = setTimeout(() => {
            setErrorMessage("Connection Timeout");
            setIsLoading(false);
        }, 15000); // 15s Timeout
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

  const overlayPortal = (useCustomOverlay && channels && mountTarget) ? createPortal(
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
      onTouchStart={showControls} 
      className={`${focusProps.className} ${isFocused ? 'ring-4 ring-white z-20 shadow-[0_0_30px_rgba(255,255,255,0.3)]' : ''} cursor-pointer bg-black`} 
    >
      {/* RENDER LOGIC SWITCH */}
      {isYoutube ? (
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
      {isLoading && !errorMessage && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
              <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-white font-medium animate-pulse">Loading...</p>
              </div>
          </div>
      )}

      {/* Playback Error Overlay */}
      {errorMessage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
          <div className="text-center px-6 max-w-md">
            <div className="inline-flex p-3 rounded-full bg-red-500/20 text-red-500 mb-4">
                 <AlertTriangle size={32} />
            </div>
            <p className="text-white text-xl font-bold mb-2">
              Playback Error
            </p>
            <p className="text-slate-400 text-sm mb-6">{errorMessage}</p>

            <button
                onClick={(e) => { e.stopPropagation(); setShowReport(true); }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg hover:shadow-red-600/20"
            >
                Report Issue
            </button>
          </div>
        </div>
      )}

      {/* Manual Report Button */}
      {!errorMessage && (controlsVisible || !isPlaying || isLoading) && (
        <TVReportButton 
            onClick={(e) => {
                e.stopPropagation();
                setShowReport(true);
            }}
            className="absolute top-4 right-4 z-[60] bg-black/40 hover:bg-red-600 text-white p-2.5 rounded-full backdrop-blur-md transition-all duration-300 pointer-events-auto"
        />
      )}

      {/* Inject Portal */}
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
