'use client';

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

interface Props {
  src: string;
  poster?: string;
  onReady?: (player: Player) => void;
}

function VideoPlayer({ src, poster, onReady }: Props) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current!.appendChild(videoElement);

      const player = videojs(videoElement, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        muted: false, // Attempt to autoplay with sound
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

  return (
    <div data-vjs-player style={{ maxWidth: '1920px', width: '100%', margin: '0 auto' }}>
      <div ref={videoRef} />
    </div>
  );
}

export default React.memo(VideoPlayer);
