'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import { useTVFocus } from '@/hooks/useTVFocus';
import { useRouter } from 'next/navigation';

interface Props {
  src: string;
  poster?: string;
  onReady?: (player: Player) => void;
}

function VideoPlayer({ src, poster, onReady }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

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
          player.play();
        } else {
          player.pause();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        player.volume(Math.min(player.volume() + 0.1, 1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        player.volume(Math.max(player.volume() - 0.1, 0));
        break;
      case 'ArrowRight':
         e.preventDefault();
         e.stopPropagation();
         player.currentTime(player.currentTime() + 10);
        break;
      case 'ArrowLeft':
         e.preventDefault();
         e.stopPropagation();
         player.currentTime(player.currentTime() - 10);
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
            overrideNative: true
          },
          nativeAudioTracks: false,
          nativeVideoTracks: false
        }
      }, () => {
        if (onReady) {
          onReady(player);
        }
        // Auto focus element when ready
        // videoRef.current?.focus(); 
      });

      playerRef.current = player;
    } else {
      const player = playerRef.current;
      player.autoplay(true);
      player.src([{ src: src, type: 'application/x-mpegURL' }]);
      if (poster) {
        player.poster(poster);
      }
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

  // Sync focus state to player container if needed, or overlay focusing ring
  return (
    <div 
      ref={videoRef}
      style={{ maxWidth: '1920px', width: '100%', height: '100%', margin: '0 auto' }}
      {...focusProps}
      // Overwrite the onKeyDown from focusProps to include our player-specific Logic
      // We must call the original one if we want generic behavior, 
      // but here we likely want to intercept specific keys.
      onKeyDown={(e) => {
        handleKeyDown(e);
        if (focusProps.onKeyDown) focusProps.onKeyDown(e);
      }}
      // Ensure we can be focused
      className={`${focusProps.className} ${isFocused ? 'ring-4 ring-white z-20 shadow-[0_0_30px_rgba(255,255,255,0.3)]' : ''}`}
    />
  );
}

export default React.memo(VideoPlayer);
