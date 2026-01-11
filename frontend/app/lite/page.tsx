'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { Crown } from 'lucide-react';
import api from '@/lib/api';

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
  const [isPremiumRestricted, setIsPremiumRestricted] = useState(false);

  // 0. Immediate Check for Global Clappr (Fixes SPA Navigation infinite load)
  useEffect(() => {
      if (typeof window !== 'undefined' && window.Clappr) {
          setIsClapprLoaded(true);
      }
  }, []);

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
                  if (res.data.data.hls_url === 'PAID_RESTRICTED') {
                      setIsPremiumRestricted(true);
                  } else {
                      setStreamUrl(res.data.data.hls_url);
                  }
              } else {
                  setError("Channel Not Found");
              }
          } catch (err) {
              setError("Failed to load channel");
          }
      }
      fetchData();
  }, [channelUuid, srcParam]);

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
            // 🚀 START AT SAFE QUALITY (KEY FIX - User requested 1)
            startLevel: 1, // 480p / 720p depending on ladder
            // 🎯 Allow quality upgrade
            abrBandWidthFactor: 0.85,
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

  // Handle Premium Restriction UI
  if (isPremiumRestricted) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6 animate-fade-in">
              <div className="relative mb-6">
                  {/* Glowing Effect */}
                  <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full"></div>
                  <div className="relative w-20 h-20 rounded-full border-2 border-yellow-500/30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                      <Crown className="w-10 h-10 text-yellow-500" />
                  </div>
              </div>
              
              <h1 className="text-2xl font-bold mb-2">Premium Content</h1>
              <p className="text-slate-400 text-center max-w-md mb-8">
                  This channel is available exclusively for Premium subscribers. Please upgrade your plan to watch.
              </p>

              <div className="flex flex-col gap-4 w-full max-w-xs">
                  <button 
                      onClick={() => router.push('/profile')}
                      className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                      Upgrade Now
                  </button>
                  <button 
                      onClick={() => router.back()}
                      className="text-slate-500 hover:text-white text-sm transition-colors"
                  >
                      Go Back
                  </button>
              </div>
          </div>
      );
  }

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
        <div id="lite-player" ref={playerContainerRef} className="w-full h-full"></div>

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

           /* 📐 Force Video to Stretch (Fill Screen) */
           #lite-player video {
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
