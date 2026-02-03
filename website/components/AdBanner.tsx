'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Ad {
  uuid: string;
  title: string;
  type: 'banner' | 'inline' | 'video';
  url?: string;
  media_url: string;
}

interface Props {
  type?: 'banner' | 'inline' | 'video';
  className?: string;
}

import { useViewMode } from '@/context/ViewModeContext';

export default function AdBanner({ type = 'banner', className = '' }: Props) {
  const { mode } = useViewMode();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAd();
  }, [type]);

  const fetchAd = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ads?type=${type}`);
      if (response.data.status && response.data.data.ads.length > 0) {
        const ads = response.data.data.ads;
        // Randomly select an ad
        const randomAd = ads[Math.floor(Math.random() * ads.length)];
        setAd(randomAd);
        
        // Record impression
        if (randomAd.uuid) {
          api.post(`/ads/${randomAd.uuid}/impression`).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Error fetching ad:', err);
    } finally {
        setLoading(false);
    }
  };

  if (loading) {
     return (
        <div className={`ad-container ${className} w-full`}>
            {type === 'banner' ? (
                <div className={`w-full bg-slate-900 animate-pulse ${mode === 'OTT' ? 'h-32 sm:h-40 md:h-48 rounded-none' : 'aspect-[16/5] rounded-lg'}`}>
                    <div className="w-full h-full flex items-center justify-center text-slate-800">
                           <span className="sr-only">Loading Ad...</span>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 animate-pulse flex items-center gap-4">
                     <div className="w-20 h-20 bg-slate-800 rounded"></div>
                     <div className="flex-1 space-y-2">
                         <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                         <div className="h-3 bg-slate-800 rounded w-1/4"></div>
                     </div>
                </div>
            )}
        </div>
     );
  }

  if (!ad) return null;

  const handleClick = () => {
    if (ad.url) {
      window.open(ad.url, '_blank');
    }
  };

  return (
    <div className={`ad-container ${className}`}>
      {type === 'banner' && (
        <div
          className={`relative overflow-hidden cursor-pointer group ${
            mode === 'OTT' ? 'w-full h-auto rounded-none' : 'w-full h-full rounded-lg'
          }`}
          onClick={handleClick}
        >
          {/* Main banner */}
          <img
            src={ad.media_url}
            alt={ad.title}
            className={`relative w-full h-full ${mode === 'OTT' ? 'object-cover' : 'object-cover lg:object-contain'}`} 
          />

          {mode !== 'OTT' && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 px-2">
                <p className="text-slate-300 text-[10px]"># Ad</p>
            </div>
          )}
        </div>
      )}
      
      {type === 'inline' && (
        <div 
          className="bg-slate-900 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
          onClick={handleClick}
        >
          <div className="flex items-center gap-4">
            <img src={ad.media_url} alt={ad.title} className="w-20 h-20 rounded object-cover" />
            <div className="flex-1">
              <p className="text-white font-medium">{ad.title}</p>
              <p className="text-slate-400 text-sm">Sponsored</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
