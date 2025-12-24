'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTVFocus } from '@/hooks/useTVFocus';
import { Play, Eye, Star, Heart } from 'lucide-react';
import { Channel } from '@/types';
import api from '@/lib/api';
import { useFavorites } from '@/hooks/useFavorites';
import { useStreamStatusStore } from '@/stores/streamStatusStore';

interface ChannelCardProps {
  channel: Channel;
}

export default function ChannelCard({ channel }: ChannelCardProps) {
  const router = useRouter(); 
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(channel.uuid);
  
  const { focusProps, isFocused } = useTVFocus({
    onEnter: () => router.push(`/channel/${channel.uuid}`),
    className: "group relative block bg-slate-800 rounded-lg overflow-hidden transition-all duration-300",
    focusClassName: "ring-4 ring-white scale-105 z-20"
  });

  const { statuses, checkStatus } = useStreamStatusStore();
  const isOnline = statuses[channel.uuid] ?? false; 
  const [isLoadingImage, setIsLoadingImage] = useState(true);

  // ... rest of effect ...
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(channel.uuid);
  };

  useEffect(() => {
    if (!channel.uuid) return;
    checkStatus(channel.uuid);
    
    const interval = setInterval(() => checkStatus(channel.uuid), 120000);
    return () => clearInterval(interval);
  }, [channel.uuid, checkStatus]);

  const handleClick = (e: React.MouseEvent) => {
      // Don't block navigation, but fire-and-forget the view increment
      setTimeout(() => {
          api.post(`/channels/${channel.uuid}/view`).catch(err => console.error(err));
      }, 3000);
  };

  return (
    <div 
      onClick={handleClick}
    > 
     <Link 
      href={`/channel/${channel.uuid}`}
      className={`group relative block bg-slate-800 rounded-lg overflow-hidden transition-all duration-300 ${isFocused ? 'ring-4 ring-white scale-105 z-20' : 'hover:ring-2 hover:ring-primary'}`}
      // Spread focus props directly onto Link.
      // useTVFocus returns props compatible with HTML elements.
      tabIndex={focusProps.tabIndex}
      onFocus={focusProps.onFocus}
      onBlur={focusProps.onBlur}
      onKeyDown={focusProps.onKeyDown}
      // data-tv-focusable needs to be cast or allowed
      {...{ "data-tv-focusable": focusProps['data-tv-focusable'] }}
    >
      {/* Thumbnail */}
      <div className="aspect-video relative bg-slate-900">
        {isLoadingImage && channel.thumbnail_url && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse z-10" />
        )}
        
        {channel.thumbnail_url ? (
          <img 
            src={channel.thumbnail_url} 
            alt={channel.name}
            onLoad={() => setIsLoadingImage(false)}
            onError={() => setIsLoadingImage(false)}
            className={`w-full h-full object-contain p-2 opacity-90 group-hover:opacity-100 transition-opacity ${isLoadingImage ? 'opacity-0' : 'opacity-90'}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-2xl">
            {channel.name.charAt(0)}
          </div>
        )}
        
        {/* Channel Number Badge */}
        {channel.channel_number && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10">
          CH {channel.channel_number}
        </div>
        )}
        
        {/* Overlay Play Button */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
            <Play fill="currentColor" size={20} className="ml-1" />
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`absolute top-2 left-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse ${isOnline ? 'bg-green-600' : 'bg-red-600'}`}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </div>

        {/* Favorite Button (Visible on hover or if liked) */}
        <button 
            onClick={handleFavoriteClick}
            className={`absolute top-2 right-2 z-20 p-1.5 rounded-full backdrop-blur-sm transition-all hover:scale-110 ${liked ? 'bg-white/10 text-red-500' : 'bg-black/40 text-white opacity-0 group-hover:opacity-100'}`}
        >
            <Heart size={16} fill={liked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-white truncate text-sm mb-1" title={channel.name}>
          {channel.name}
        </h3>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{channel.language?.name || 'Tamil'}</span>
      </div>
      </div>
      
      {/* Rating & Viewers */}
      <div className="flex items-center justify-between mt-1 px-3 pb-3">
         <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold">
            <Star size={12} fill="currentColor" />
            <span>{(Number(channel.ratings_avg_rating) || Number(channel.average_rating) || 0).toFixed(1)}</span>
         </div>
         <span className="flex items-center text-xs text-slate-400" title={channel.daily_views !== undefined ? "Views" : "Total Views"}>
            <Eye size={12} className="mr-1" />
            {channel.daily_views !== undefined 
                ? <>{(channel.daily_views || 0).toLocaleString()}<span className="hidden sm:inline"> </span></>
                : (channel.viewers_count || 0).toLocaleString()}
         </span>
      </div>
    </Link>
    </div>
  );
}
