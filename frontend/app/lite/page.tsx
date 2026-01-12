'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import api from '@/lib/api';
import { Channel } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Type definition for Clappr attached to window
declare global {
  interface Window {
    Clappr: any;
  }
}

function Player() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const channelUuid = searchParams.get('channel');
  const srcParam = searchParams.get('src'); // Fallback
  
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isClapprLoaded, setIsClapprLoaded] = useState(false);

  // TV Navigation State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannelIndex, setCurrentChannelIndex] = useState(-1);
  const [showUi, setShowUi] = useState(false); // Toggle UI on interaction

  // 1. Fetch Secure Stream URL & Logo
  useEffect(() => {
      async function fetchData() {
          // Fetch Stream
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
      fetchData();
  }, [channelUuid, srcParam]);

  // 1.5 Fetch All Channels for Navigation (Background)
  useEffect(() => {
    async function fetchAllChannels() {
        try {
            const res = await api.get('/channels?limit=-1');
            if (res.data.status) {
                let allCh = res.data.data.data || res.data.data || [];
                // Sort by channel number
                allCh.sort((a: Channel, b: Channel) => (a.channel_number || 9999) - (b.channel_number || 9999));
                setChannels(allCh);
            }
        } catch (e) {
            console.error("Failed to load channel list for navigation", e);
        }
    }
    fetchAllChannels();
  }, []);

  // Update Current Index when channels or current uuid changes
  useEffect(() => {
    if (channels.length > 0 && channelUuid) {
        const idx = channels.findIndex(c => c.uuid === channelUuid);
        if (idx !== -1) setCurrentChannelIndex(idx);
    }
  }, [channels, channelUuid]);

  // Navigation Logic
  const changeChannel = (direction: 'next' | 'prev') => {
      if (channels.length === 0) return;
      
      let newIndex = direction === 'next' ? currentChannelIndex + 1 : currentChannelIndex - 1;
      
      // Loop navigation
      if (newIndex >= channels.length) newIndex = 0;
      if (newIndex < 0) newIndex = channels.length - 1;

      const nextChannel = channels[newIndex];
      if (nextChannel) {
          // Update URL to trigger main fetch
          router.replace(`/lite?channel=${nextChannel.uuid}`);
      }
  };

  // Keyboard Listeners
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          // Show UI on any key press
          setShowUi(true);
          
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'ChannelUp') {
              e.preventDefault(); // Prevent page scroll
              changeChannel('next');
          } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ChannelDown') {
              e.preventDefault();
              changeChannel('prev');
          }
      };

      // Auto-hide UI after 3 seconds of inactivity
      let uiTimer: NodeJS.Timeout;
      if (showUi) {
          uiTimer = setTimeout(() => setShowUi(false), 3000);
      }

      window.addEventListener('keydown', handleKeyDown);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          clearTimeout(uiTimer);
      };
  }, [channels, currentChannelIndex, showUi]);

  // 2. Player Logic (User Provided Config)
  useEffect(() => {
    if (!streamUrl || !isClapprLoaded || !playerContainerRef.current) return;

    /* =========================
       DEVICE PROFILE
    ========================= */
    const getDeviceProfile = () => {
        if (typeof navigator === 'undefined') return { isTV: false, isMobile: false, cores: 2, memory: 1 };
        
        const ua = navigator.userAgent.toLowerCase();
        const nav = navigator as any; // Type assertion for non-standard props
        const cores = nav.hardwareConcurrency || 2;
        const memory = nav.deviceMemory || 1;

        const isTV =
            ua.includes("android tv") ||
            ua.includes("smarttv") ||
            ua.includes("tizen") ||
            ua.includes("webos") ||
            ua.includes("tv");

        const isMobile = /android|iphone|ipad|ipod/.test(ua);

        return { isTV, isMobile, cores, memory };
    };

    /* =========================
       HLS CONFIG (QUALITY FIXED)
    ========================= */
    const buildHlsConfig = (profile: any) => {
        const base = {
            lowLatencyMode: false,
            // ❌ Workers cause issues on old TVs (User requested false)
            enableWorker: false,
            // ❌ Prevent TV from forcing low res
            capLevelToPlayerSize: false,
            // ❌ Avoid aggressive prefetch
            startFragPrefetch: false,
            progressive: true,
            testBandwidth: true,
            // ABR stability
            abrEwmaFastLive: 5,
            abrEwmaSlowLive: 12,
            // 🚀 START AT AUTO (Auto Quality Adaptation)
            startLevel: -1, 
            // 🎯 Allow quality upgrade (Slightly less conservative)
            abrBandWidthFactor: 0.9,
            abrBandWidthUpFactor: 0.7,
            // Prevent constant downscale
            abrMaxWithRealBitrate: true
        };

        /* 📺 ANDROID TV (OLD MODELS SAFE) */
        if (profile.isTV) {
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

    // Clean up previous instance
    if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
    }

    const profile = getDeviceProfile();
    const hlsConfig = buildHlsConfig(profile);

    console.log("Device:", profile);
    console.log("HLS Config:", hlsConfig);

    // 3. Init with tiny delay to ensure DOM is ready and prevent Racing
    const initTimer = setTimeout(() => {
        if (!document.getElementById('lite-player')) {
             console.error("FATAL: #lite-player element not found in DOM");
             setError("Player element missing");
             return;
        }

        try {
            const player = new window.Clappr.Player({
                source: streamUrl,
                parentId: "#lite-player", 
                width: "100%",
                height: "100vh",
                autoPlay: true,
                mute: false, 
                preload: "auto",
                playback: {
                    hlsjsConfig: hlsConfig
                },
                // Custom CSS handles most, but this is Clappr default override
                mediacontrol: { seekbar: "#fff", buttons: "#fff" } 
            });
            playerInstanceRef.current = player;
        } catch (e: any) {
            console.error("Clappr Init Error Details:", e);
            setError(`Player Initialization Failed: ${e.message || e}`);
        }
    }, 100);

    return () => clearTimeout(initTimer);
  }, [streamUrl, isClapprLoaded]);

  if (!channelUuid && !srcParam) return <div className="flex items-center justify-center h-screen text-2xl text-white">No Channel Selected</div>;
  if (!streamUrl && !error) return <div className="flex items-center justify-center h-screen text-2xl text-white">Loading Stream...</div>;

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
        {/* Load Clappr from CDN */}
        <Script 
            src="https://cdn.jsdelivr.net/npm/clappr@latest/dist/clappr.min.js" 
            strategy="afterInteractive"
            onLoad={() => setIsClapprLoaded(true)}
            onError={() => setError("Failed to load player core")}
        />

        {error && (
            <div className="absolute top-4 left-4 bg-red-600 text-white p-2 rounded z-20">
                {error}
            </div>
        )}
        
        {/* Helper message for debugging if needed */}
        {!isClapprLoaded && !error && (
             <div className="absolute inset-0 flex items-center justify-center text-white">
                 Loading Player Engine...
             </div>
        )}

        {/* Player Container */}
        <div 
            id="lite-player" 
            ref={playerContainerRef} 
            className="w-full h-full"
            onMouseMove={() => {
                setShowUi(true);
                // Debounced hide logic could go here but keep it simple
            }}
            onClick={() => setShowUi(true)}
        ></div>

        {/* Navigation UI Overlay */}
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${showUi ? 'opacity-100' : 'opacity-0'}`}>
            {/* Prev Button */}
            <button 
                onClick={(e) => { e.stopPropagation(); changeChannel('prev'); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-4 rounded-full pointer-events-auto transition hover:scale-110 z-30"
                aria-label="Previous Channel"
            >
                <ChevronLeft size={32} />
            </button>

            {/* Next Button */}
            <button 
                onClick={(e) => { e.stopPropagation(); changeChannel('next'); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-4 rounded-full pointer-events-auto transition hover:scale-110 z-30"
                aria-label="Next Channel"
            >
                <ChevronRight size={32} />
            </button>
            
            {/* Channel Info Overlay (Optional but helpful) */}
            {channels[currentChannelIndex] && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-6 py-2 rounded-full text-white font-medium z-30">
                    <span className="text-gray-400 mr-2">#{channels[currentChannelIndex].channel_number || '00'}</span>
                    {channels[currentChannelIndex].name}
                </div>
            )}
        </div>

        <style jsx global>{`
           /* 🛡️ Hide unwanted controllers (Seekbar, Volume) */
           .media-control-left-panel, 
           .media-control-right-panel, 
           .bar-container, 
           .bar-background, 
           .bar-fill-1, 
           .bar-fill-2,
           .media-control-background {
               display: none !important;
           }

           /* 🦄 Remove background hover effect */
           .media-control-layer {
               background: none !important;
           }

           /* 🎯 Keep only Play/Pause Center */
           .media-control-center {
               display: flex !important;
           }

           /* ↔️ Force Video Stretch (User Request) */
           video {
               object-fit: fill !important;
               width: 100% !important;
               height: 100% !important;
           }
        `}</style>
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
