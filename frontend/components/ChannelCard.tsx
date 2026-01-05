'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTVFocus } from '@/hooks/useTVFocus';
import { Play, Eye, Star, Heart } from 'lucide-react';
import { Channel } from '@/types';
import api from '@/lib/api';
import { formatViewers } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';


interface ChannelCardProps {
  channel: Channel;
}

export default function ChannelCard({ channel }: ChannelCardProps) {
  const router = useRouter(); 
  const { isFavorite, toggleFavorite, isProcessing } = useFavorites();
  const liked = isFavorite(channel.uuid);
  
  const { focusProps, isFocused } = useTVFocus({
    onEnter: () => router.push(`/channel/${channel.uuid}`),
    className: "group relative block bg-slate-800 rounded-lg overflow-hidden transition-all duration-300",
    focusClassName: "ring-4 ring-white scale-105 z-20"
  });

  const [isLoadingImage, setIsLoadingImage] = useState(true);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return; // Prevent multiple clicks
    toggleFavorite(channel.uuid, channel.name);
  };

  const handleClick = (e: React.MouseEvent) => {
      // Don't block navigation, but fire-and-forget the view increment
      setTimeout(() => {
          api.post(`/channels/${channel.uuid}/view`).catch(err => console.error(err));
      }, 3000);
  };

  return (
    <div 
      className="relative group block bg-slate-800 rounded-lg overflow-hidden transition-all duration-300"
      onClick={handleClick}
    > 
     {/* Link covers the entire card area for navigation */}
     <Link 
      href={`/channel/${channel.uuid}`}
      className={`absolute inset-0 z-10 ${isFocused ? 'ring-4 ring-white scale-105' : 'hover:ring-2 hover:ring-primary'}`}
      tabIndex={focusProps.tabIndex}
      onFocus={focusProps.onFocus}
      onBlur={focusProps.onBlur}
      onKeyDown={focusProps.onKeyDown}
      {...{ "data-tv-focusable": focusProps['data-tv-focusable'] }}
    >
      <span className="sr-only">Watch {channel.name}</span>
    </Link>

      {/* Visual Content (Not interactive, but visible) */}
      <div className="aspect-video relative bg-slate-900 pointer-events-none">
        {isLoadingImage && channel.thumbnail_url && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse z-0" />
        )}
        
        {channel.thumbnail_url ? (
          <img 
            src={channel.thumbnail_url} 
            alt={channel.name}
            loading="lazy"
            onLoad={() => setIsLoadingImage(false)}
            onError={() => setIsLoadingImage(false)}
            className={`w-full h-full object-contain p-2 opacity-90 transition-opacity ${isLoadingImage ? 'opacity-0' : 'opacity-90'}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-2xl">
            {channel.name.charAt(0)}
          </div>
        )}
        
        {/* Channel Number Badge */}
        {/* Channel Number Badge */}
        {channel.channel_number > 0 && (
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 z-0">
          CH {channel.channel_number}
        </div>
        )}
        
        {/* Overlay Play Button - Visual Only */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
            <Play fill="currentColor" size={20} className="ml-1" />
          </div>
        </div>
        

      </div>

      {/* Info Content */}
      <div className="p-3 pointer-events-none">
        <h3 className="font-medium text-white truncate text-sm mb-1" title={channel.name}>
          {channel.name}
        </h3>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{channel.language?.name || 'Tamil'}</span>
      </div>
      </div>
      
      {/* Rating & Viewers */}
      <div className="flex items-center justify-between mt-1 px-3 pb-3 pointer-events-none">
         <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold">
            <Star size={12} fill="currentColor" />
            <span>{(Number(channel.ratings_avg_rating) || Number(channel.average_rating) || 0).toFixed(1)}</span>
         </div>
         <span className="flex items-center text-xs text-slate-400">
            <Eye size={12} className="mr-1" />
            {channel.daily_views !== undefined 
                ? <>{formatViewers(channel.daily_views || 0)}<span className="hidden sm:inline"> </span></>
                : formatViewers(channel.viewers_count || 0)}
         </span>
      </div>

      {/* Favorite Button (Interactive, Z-Index 20 to sit above Link) */}
      <button 
          onClick={handleFavoriteClick}
          className={`absolute top-2 right-2 z-20 p-1.5 rounded-full backdrop-blur-sm transition-all hover:scale-110 ${liked ? 'bg-white/10 text-red-500' : 'bg-black/40 text-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100'}`}
      >
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
