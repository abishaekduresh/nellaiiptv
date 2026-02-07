'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface ClapprPlayerProps {
  streamUrl: string;
  channelName: string;
  posterUrl?: string;
  channelUuid: string;
}

declare global {
  interface Window {
    Clappr: any;
    PlaybackRatePlugin: any;
    ClapprStats: any;
  }
}

export default function ClapprPlayer({ streamUrl, channelName, posterUrl, channelUuid }: ClapprPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bufferSecondsRef = useRef(0);

  const [isClapprLoaded, setIsClapprLoaded] = useState(false);

  useEffect(() => {

    if (!isClapprLoaded) {
      return;
    }

    if (typeof window === 'undefined' || !window.Clappr) {
      return;
    }
    
    const plugins = [];
    if (window.PlaybackRatePlugin) plugins.push(window.PlaybackRatePlugin);
    if (window.ClapprStats) plugins.push(window.ClapprStats);

    const playerConfig: any = {
      source: streamUrl,
      parentId: '#player-container',
      autoPlay: true,
      mute: false,
      width: '100%',
      height: '100%',
      poster: posterUrl || '',
      mediacontrol: {
        seekbar: '#F0213F',
        buttons: '#d9d9d9'
      },
      plugins: plugins,
      clapprStats: {
        runEach: 5000,
        uriToMeasureLatency: 'https://www.google.com/favicon.ico'
      }
    };

    if (window.PlaybackRatePlugin) {
        playerConfig.playbackRateConfig = {
            defaultValue: '1.0',
            options: [
              { value: '0.5', label: '0.5x' },
              { value: '1.0', label: 'Normal' },
              { value: '1.5', label: '1.5x' },
              { value: '2.0', label: '2x' }
            ]
        };
    }

    playerRef.current = new window.Clappr.Player(playerConfig);

    // Auto reconnect logic
    const reconnectInterval = setInterval(() => {
      const player = playerRef.current;
      if (player && typeof player.isBuffering === 'function' && typeof player.isPlaying === 'function') {
        if (player.isBuffering() && player.isPlaying()) {
          bufferSecondsRef.current++;
        } else {
          bufferSecondsRef.current = 0;
        }
      }

      if (bufferSecondsRef.current >= 5) {
        playerRef.current?.stop();
        playerRef.current?.play();
        bufferSecondsRef.current = 0;
      }
    }, 1000);

    // Fullscreen resize handler
    const handleResize = () => {
      if (playerRef.current) {
        playerRef.current.resize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Click to play
    const handleClick = () => {
      playerRef.current?.play();
    };

    document.addEventListener('click', handleClick);

    // Cleanup
    return () => {
      clearInterval(reconnectInterval);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleClick);
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [streamUrl, posterUrl, isClapprLoaded]);

  useEffect(() => {
    // Dynamically import disable-devtool to ensure it runs on the client side
    import('disable-devtool').then((module) => {
        module.default({
            ondevtoolopen: (type) => {
                const info = 'devtool opened!';
                console.warn(info);
                // window.location.href = '/'; 
            }
        });
    });
  }, []);

  return (
    <>
      {/* Load Clappr and plugins */}
      <Script
        src="https://cdn.jsdelivr.net/npm/clappr@latest/dist/clappr.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[ClapprPlayer] Clappr script loaded');
          setIsClapprLoaded(true);
        }}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/hls.js@latest"
        strategy="beforeInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/clappr-playback-rate-plugin@latest/dist/clappr-playback-rate-plugin.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/clappr-stats@latest/dist/clappr-stats.min.js"
        strategy="beforeInteractive"
      />

      <div 
        id="player-container" 
        ref={containerRef}
        style={{
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          background: 'black'
        }}
      />
    </>
  );
}
