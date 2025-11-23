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

export default function AdBanner({ type = 'banner', className = '' }: Props) {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    fetchAd();
  }, [type]);

  const fetchAd = async () => {
    try {
      const response = await api.get(`/ads?type=${type}`);
      if (response.data.status && response.data.data.length > 0) {
        const ads = response.data.data;
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
    }
  };

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
          className="relative overflow-hidden rounded-lg cursor-pointer group"
          onClick={handleClick}
        >
          <img
            src={ad.media_url}
            alt={ad.title}
            className="w-full h-auto transition-transform group-hover:scale-105"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="text-white text-sm font-medium">{ad.title}</p>
            <p className="text-slate-300 text-xs">Advertisement</p>
          </div>
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
