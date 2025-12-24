'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import { useTVFocus } from '@/hooks/useTVFocus';
import { useRouter } from 'next/navigation';
import ReportModal from './ReportModal';
import { AlertTriangle, List } from 'lucide-react';
import PlayerOverlay from './PlayerOverlay';
import { Channel } from '@/types';
import { useViewMode } from '@/context/ViewModeContext';

// This will replace the VideoPlayer component content.

interface Props {
  src: string;
  poster?: string;
  onReady?: (player: Player) => void;
  channelUuid?: string;
  channelName?: string;
  // Overlay / STB Features
  channels?: Channel[];
  topTrending?: Channel[]; // New
  viewersCount?: number;   // New
  currentGroup?: string;
  onChannelSelect?: (c: Channel) => void;
  onNextGroup?: () => void;
  onPrevGroup?: () => void;
  useCustomOverlay?: boolean;
}

function VideoPlayer({ 
  src, poster, onReady, channelUuid, channelName, 
  channels, topTrending, viewersCount = 0, currentGroup, onChannelSelect, onNextGroup, onPrevGroup,
  useCustomOverlay = true
}: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  
  const [showReport, setShowReport] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Custom Controls Visibility State
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Player State for Overlay
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Default to unmuted
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);

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
         if (playerRef.current && !playerRef.current.paused()) {
            setControlsVisible(false);
         }
     }, 4000);
  }, []);

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
             if (playerRef.current && !playerRef.current.paused()) setControlsVisible(false);
          }, 4000);
      }
  }, [controlsVisible, showControls]);


  // Controls Logic
  const handlePlayPause = useCallback(() => {
      const player = playerRef.current;
      if (!player) return;
      if (player.paused()) player.play();
      else player.pause();
      
      // Keep controls visible if paused
      if (!player.paused()) {
          setControlsVisible(true);
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      } else {
          showControls();
      }
  }, [showControls]);
  
  const handleToggleMute = useCallback(() => {
      const player = playerRef.current;
      if (!player) return;
      const newMuted = !player.muted();
      player.muted(newMuted);
      setIsMuted(newMuted);
      showControls();
  }, [showControls]);

  const handleVolumeChange = useCallback((newVol: number) => {
      const player = playerRef.current;
      if (!player) return;
      player.volume(Math.max(0, Math.min(1, newVol)));
      if (newVol > 0 && player.muted()) {
          player.muted(false);
          setIsMuted(false);
      }
      showControls(); 
  }, [showControls]);

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
    const player = playerRef.current;
    if (!player) return;
    if (player.isFullscreen()) {
      player.exitFullscreen();
    } else {
      player.requestFullscreen();
    }
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      // Prevent standard click if needed, but double click is separate event usually
      toggleFullscreen();
  }, [toggleFullscreen]);


  // Custom key handler for player
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    showControls(); // Any key shows controls
    if (!playerRef.current) return;
    
    // If controls are hidden (and this key showed them), default actions might still apply.
    // Overlay handles keys if controlsVisible is true usually? 
    // Actually Overlay `useEffect` handles keys when `visible` is true.
    // If we preventDefault here, Overlay might not get it if we don't dispatch?
    // Wait, Overlay uses window listener. It will get it.
    // But we need to ensure we don't double handle.
    // If Overlay handles navigation, we should let it.
    
    // If controlsVisible is true, overlay handles Arrow Keys for UI.
    // But volume/seek might still be needed.
    // Overlay logic: ArrowUp/Down moves selection IF sidebar open.
    // If sidebar CLOSED, ArrowUp/Down does nothing in Overlay. Then we handle Volume here.

    // ... existing Key Logic ...
    const player = playerRef.current;
 
    // Map keys that Overlay doesn't handle when sidbar is closed
    switch (e.key) {
      case 'Enter':
      case ' ': 
        if (document.activeElement?.tagName === 'INPUT') return; 
        e.preventDefault();
        handlePlayPause();
        break;
      case 'ArrowUp':
        e.preventDefault();
        handleNextChannel();
        break;
      case 'ArrowDown':
        e.preventDefault();
        handlePrevChannel();
        break;
      case 'ArrowRight':
         e.preventDefault();
         handleVolumeChange(volume + 0.1);
        break;
      case 'ArrowLeft':
         e.preventDefault();
         handleVolumeChange(volume - 0.1);
        break;
      case 'Backspace':
      case 'Escape':
        e.preventDefault();
        router.back();
        break;
    }
  }, [router, handlePlayPause, handleVolumeChange, volume, showControls, handleNextChannel, handlePrevChannel]);

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoElement.setAttribute('playsinline', 'true');
      videoElement.setAttribute('crossorigin', 'anonymous');
      
      if (videoRef.current) {
         videoRef.current.appendChild(videoElement);
      }

      const player = videojs(videoElement, {
        autoplay: true, // Auto-play enabled
        controls: !useCustomOverlay, 
        responsive: true,
        fluid: true,
        muted: false, 
        aspectRatio: '16:9',
        fill: true,
        poster: poster,
        sources: [{
          src: src,
          type: 'application/x-mpegURL'
        }],
        html5: {
          vhs: {
            overrideNative: false,
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            limitRenditionByPlayerDimensions: true,
          },
          nativeAudioTracks: true,
          nativeVideoTracks: true,
        }
      }, () => {
        if (onReady) {
          onReady(player);
        }
        setIsPlaying(!player.paused());
        setIsMuted(player.muted() || false); // Sync initial mute state
        setVolume(player.volume() || 1);
        showControls(); 
      });
      
      player.on('play', () => { setIsPlaying(true); showControls(); });
      player.on('pause', () => { setIsPlaying(false); setControlsVisible(true); });
      player.on('volumechange', () => {
          setVolume(player.volume() || 0);
          setIsMuted(player.muted() || false);
      });
      player.on('fullscreenchange', () => {
          setIsFullscreen(player.isFullscreen() || false);
      });
      player.on('useractivity', () => showControls());

      player.on('error', () => {
        const error = player.error();
        if (error) {
           console.error('Video Player Error:', error);
           setErrorMessage(error.message);
        }
      });

      playerRef.current = player;
    } else {
      const player = playerRef.current;
      player.poster(''); 
      player.autoplay(true); // Ensure autoplay is requested on source change
      player.src([{ src: src, type: 'application/x-mpegURL' }]);
      if (poster) player.poster(poster); else player.poster('');
      setErrorMessage(null);
      
      // Attempt play (muted if needed happens automatically if browser blocks)
      const playPromise = player.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
            // Auto-play was prevented
            console.log('Autoplay prevented. Muting and retrying.', error);
            player.muted(true);
            player.play();
        });
      }
      setIsPlaying(true);
    }
  }, [src, poster, onReady, showControls]);

  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  // Render Portal for Overlay
  const overlayPortal = (useCustomOverlay && playerRef.current && channels) ? createPortal(
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
      />,
      playerRef.current.el() as Element
  ) : null;

  return (
    <>
    <div
      ref={videoRef}
      style={{ maxWidth: '1920px', width: '100%', height: '100%', margin: '0 auto', position: 'relative' }}
      {...focusProps}
      onKeyDown={(e) => {
        handleKeyDown(e);
        if (focusProps.onKeyDown) focusProps.onKeyDown(e);
      }}
      // Mouse/Touch Handlers for Visibility
      onMouseMove={handleMouseMove}
      onClick={toggleControls}
      onDoubleClick={handleDoubleClick}
      onTouchStart={showControls} /* Simple touch wake */
      className={`${focusProps.className} ${isFocused ? 'ring-4 ring-white z-20 shadow-[0_0_30px_rgba(255,255,255,0.3)]' : ''} cursor-pointer`} 
    >
      {/* Playback Error Overlay */}
      {errorMessage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm grayscale">
          <div className="text-center px-6 max-w-md">
            <div className="inline-flex p-3 rounded-full bg-red-500/20 text-red-500 mb-4">
                 <AlertTriangle size={32} />
            </div>
            <p className="text-white text-xl font-bold mb-2">
              Playback Error
            </p>
            <p className="text-slate-400 text-sm mb-6">The media could not be loaded, either because the server or network failed or because the format is not supported.</p>

            <button
                onClick={(e) => { e.stopPropagation(); setShowReport(true); }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg hover:shadow-red-600/20"
            >
                Report Issue
            </button>
          </div>
        </div>
      )}

      {/* Manual Report Button (Top Right) - Only show if Controls Visible */}
      {!errorMessage && controlsVisible && (
        <button
        onClick={(e) => {
            e.stopPropagation();
            setShowReport(true);
        }}
        className="absolute top-4 right-4 z-[40] bg-black/40 hover:bg-red-600 text-white p-2.5 rounded-full backdrop-blur-md transition-all duration-300 pointer-events-auto animate-in fade-in"
        title="Report Stream Issue"
        >
            <AlertTriangle size={20} />
        </button>
      )}

      {/* Inject Portal */}
      {overlayPortal}
      
      {/* Persistent Watermark Portal */}
      {playerRef.current && createPortal(
        <img 
            src="/png_logo.png" 
            alt="Watermark" 
            className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 w-16 sm:w-24 md:w-32 lg:w-40 opacity-60 pointer-events-none select-none z-30 drop-shadow-md transition-all duration-300"
        />,
        playerRef.current.el() as Element
      )}
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
