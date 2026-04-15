'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface ClapprPlayerProps {
  streamUrl: string;
  channelName: string;
  posterUrl?: string;
  channelUuid: string;
  watermarkUrl?: string;
}

declare global {
  interface Window {
    Clappr: any;
    PlaybackRatePlugin: any;
    ClapprStats: any;
    HlsjsPlayback: any;
  }
}

export default function ClapprPlayer({ streamUrl, channelName, posterUrl, channelUuid, watermarkUrl }: ClapprPlayerProps) {
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

    // Helper: Upgrade http:// stream URLs to https:// when page is served over HTTPS
    const resolveStreamUrl = (url: string): string => {
        if (typeof window === 'undefined') return url;
        if (window.location.protocol === 'https:' && url.startsWith('http://')) {
            return url.replace(/^http:\/\//, 'https://');
        }
        return url;
    };
    
    const plugins = [];
    if (window.PlaybackRatePlugin) plugins.push(window.PlaybackRatePlugin);
    if (window.ClapprStats) plugins.push(window.ClapprStats);
    if (window.HlsjsPlayback) plugins.push(window.HlsjsPlayback);

    const playerConfig: any = {
      source: resolveStreamUrl(streamUrl),
      mimeType: 'application/x-mpegURL',
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
      watermark: watermarkUrl || '',
      position: 'bottom-left',
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

    // 🖥️ SD → HD STRETCH: Force the internal <video> element to fill the entire
    // player container regardless of source resolution (object-fit: fill stretches
    // SD content to full HD without black bars).
    const applyStretchStyle = () => {
      const container = document.getElementById('player-container');
      if (!container) return;
      // Target every video element Clappr renders inside the container
      container.querySelectorAll('video').forEach((vid: HTMLVideoElement) => {
        vid.style.width      = '100%';
        vid.style.height     = '100%';
        vid.style.objectFit  = 'fill'; // "fill" = stretch; change to "cover" for crop-to-fit
        vid.style.display    = 'block';
      });
    };

    // Apply immediately and again shortly after (Clappr may render async)
    applyStretchStyle();
    const stretchTimer = setTimeout(applyStretchStyle, 500);
    const stretchTimer2 = setTimeout(applyStretchStyle, 1500);

    // Also inject a persistent <style> rule so Clappr can't override it
    const styleId = 'clappr-stretch-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        #player-container video {
          width: 100% !important;
          height: 100% !important;
          object-fit: fill !important;
        }
        #player-container .player-poster {
          background-size: cover !important;
        }
        #player-container .player-watermark {
          opacity: 0.4 !important;
          width: 80px !important;
          margin: 20px !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    // MutationObserver: re-apply stretch if Clappr ever recreates the video element
    const observer = new MutationObserver(() => applyStretchStyle());
    const container = document.getElementById('player-container');
    if (container) {
      observer.observe(container, { childList: true, subtree: true });
    }

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
      clearTimeout(stretchTimer);
      clearTimeout(stretchTimer2);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleClick);
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      // Remove injected stretch style on unmount
      document.getElementById('clappr-stretch-style')?.remove();
    };
  }, [streamUrl, posterUrl, isClapprLoaded, watermarkUrl]);

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
        src="https://cdn.jsdelivr.net/npm/@clappr/hlsjs-playback@latest/dist/hlsjs-playback.min.js"
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
