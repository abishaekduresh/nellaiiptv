'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import { useTVFocus } from '@/hooks/useTVFocus';
import { useRouter } from 'next/navigation';
import ReportModal from './ReportModal';
import { AlertTriangle } from 'lucide-react';

interface Props {
  src: string;
  poster?: string;
  onReady?: (player: Player) => void;
  channelUuid?: string;
  channelName?: string;
}

function VideoPlayer({ src, poster, onReady, channelUuid, channelName }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  
  const [showReport, setShowReport] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Focus Handling
  const { focusProps, isFocused } = useTVFocus({
    className: 'relative w-full h-full outline-none transition-all duration-200',
    focusClassName: 'ring-4 ring-primary z-20'
  });

  // Custom key handler for player
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!playerRef.current) return;
    const player = playerRef.current;

    switch (e.key) {
      case 'Enter':
      case ' ': // Space
        e.preventDefault();
        e.stopPropagation();
        if (player.paused()) {
          player.play()?.catch(() => {});
        } else {
          player.pause();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        const currentVolUp = player.volume() || 0;
        player.volume(Math.min(currentVolUp + 0.1, 1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        const currentVolDown = player.volume() || 0;
        player.volume(Math.max(currentVolDown - 0.1, 0));
        break;
      case 'ArrowRight':
         e.preventDefault();
         e.stopPropagation();
         const currentTimeForward = player.currentTime() || 0;
         player.currentTime(currentTimeForward + 10);
        break;
      case 'ArrowLeft':
         e.preventDefault();
         e.stopPropagation();
         const currentTimeBack = player.currentTime() || 0;
         player.currentTime(currentTimeBack - 10);
        break;
      case 'Backspace':
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        router.back();
        break;
    }
  }, [router]);

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current!.appendChild(videoElement);

      const player = videojs(videoElement, {
        autoplay: true,
        controls: true,
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
            overrideNative: !videojs.browser.IS_ANY_SAFARI,
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            limitRenditionByPlayerDimensions: true,
          },
          nativeAudioTracks: videojs.browser.IS_ANY_SAFARI,
          nativeVideoTracks: videojs.browser.IS_ANY_SAFARI,
        }
      }, () => {
        if (onReady) {
          onReady(player);
        }
      });
      
      // Error handling
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
      player.autoplay(true);
      player.src([{ src: src, type: 'application/x-mpegURL' }]);
      if (poster) {
        player.poster(poster);
      }
      setErrorMessage(null); // Reset error on source change
    }
  }, [src, poster, onReady]);

  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <>
    <div 
      ref={videoRef}
      style={{ maxWidth: '1920px', width: '100%', height: '100%', margin: '0 auto' }}
      {...focusProps}
      onKeyDown={(e) => {
        handleKeyDown(e);
        if (focusProps.onKeyDown) focusProps.onKeyDown(e);
      }}
      className={`${focusProps.className} ${isFocused ? 'ring-4 ring-white z-20 shadow-[0_0_30px_rgba(255,255,255,0.3)]' : ''}`}
    >
        {/* Error Overlay */}
        {errorMessage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm grayscale">
          <div className="text-center px-6 max-w-md">
            <div className="inline-flex p-3 rounded-full bg-red-500/20 text-red-500 mb-4">
                 <AlertTriangle size={32} />
            </div>
            <p className="text-white text-xl font-bold mb-2">
              Playback Error
            </p>
            <p className="text-slate-400 text-sm mb-6">{errorMessage}</p>
            
            <button 
                onClick={() => setShowReport(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg hover:shadow-red-600/20"
            >
                Report Issue
            </button>
          </div>
        </div>
      )}

      {/* Manual Report Button (Top Right) */}
      {!errorMessage && (
        <button 
        onClick={(e) => {
            e.stopPropagation();
            setShowReport(true);
        }}
        className="absolute top-4 right-4 z-[60] bg-black/40 hover:bg-red-600 text-white p-2.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto"
        title="Report Stream Issue"
        >
            <AlertTriangle size={20} />
        </button>  
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
