'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Hls from 'hls.js';

import api from '@/lib/api';

function Player() {
  const searchParams = useSearchParams();
  const channelUuid = searchParams.get('channel');
  const srcParam = searchParams.get('src'); // Fallback for direct links if needed
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  // Fetch Stream URL if UUID is provided
  useEffect(() => {
      async function fetchStream() {
          if (srcParam) {
              setStreamUrl(srcParam);
              return;
          }
          if (!channelUuid) return;

          try {
              const res = await api.get(`/channels/${channelUuid}`);
              if (res.data.status && res.data.data.hls_url) {
                  setStreamUrl(res.data.data.hls_url);
              } else {
                  setError("Channel Not Found");
              }
          } catch (err) {
              setError("Failed to load channel");
          }
      }
      fetchStream();
  }, [channelUuid, srcParam]);

  // HLS Player Initialization
  useEffect(() => {
    if (!streamUrl) return;

    const video = videoRef.current;
    if (!video) return;

    // Detect if TV (though we assume usage on TV mostly)
    // Low-End TV Safe Config
    const config = {
      // Worker enabled to offload main thread
      enableWorker: true,
      
      // Conservative start
      startLevel: 0, 

      // Memory Savers
      maxBufferLength: 15, // 15s
      maxMaxBufferLength: 30, // 30s
      maxBufferSize: 15 * 1000 * 1000, // 15MB
      
      // ABR Stability for weak CPUs
      abrBandWidthFactor: 0.5,
      abrBandWidthUpFactor: 0.3,
      
      // No fancy stuff
      capLevelToPlayerSize: false,
      startFragPrefetch: false,
      progressive: true,
      lowLatencyMode: false,
    };

    let hls: Hls;

    if (Hls.isSupported()) {
         hls = new Hls({
             debug: false,
             ...config
         });
         
         hls.loadSource(streamUrl);
         hls.attachMedia(video);
         
         hls.on(Hls.Events.ERROR, (event, data) => {
             if (data.fatal) {
                 switch (data.type) {
                     case Hls.ErrorTypes.NETWORK_ERROR:
                         hls.startLoad();
                         break;
                     case Hls.ErrorTypes.MEDIA_ERROR:
                         hls.recoverMediaError();
                         break;
                     default:
                         setError("Playback Error: " + data.details);
                         hls.destroy();
                         break;
                 }
             }
         });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
    } else {
        setError("HLS not supported");
    }

    return () => {
        if (hls) hls.destroy();
    };
  }, [streamUrl]);

  if (!channelUuid && !srcParam) return <div className="flex items-center justify-center h-screen text-2xl text-white">No Channel Selected</div>;
  if (!streamUrl && !error) return <div className="flex items-center justify-center h-screen text-2xl text-white">Loading Stream...</div>;

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden">
        {error && (
            <div className="absolute top-4 left-4 bg-red-600 text-white p-2 rounded z-20">
                {error}
            </div>
        )}
        {/* Native Controls for TV Remote Compatibility */}
        <video 
            ref={videoRef}
            controls 
            className="w-full h-full object-contain"
            autoPlay
            playsInline
            style={{ imageRendering: 'optimizeSpeed' } as unknown as React.CSSProperties} // Hint for performance
        />
    </div>
  );
}

export default function LitePlayerPage() {
    return (
        <Suspense fallback={<div className="bg-black h-screen text-white flex items-center justify-center">Loading Lite Player...</div>}>
            <Player />
        </Suspense>
    )
}
