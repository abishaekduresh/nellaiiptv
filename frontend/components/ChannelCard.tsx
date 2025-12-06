'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTVFocus } from '@/hooks/useTVFocus';
import { Play } from 'lucide-react';
import { Channel } from '@/types';
import api from '@/lib/api';

interface ChannelCardProps {
  channel: Channel;
}

export default function ChannelCard({ channel }: ChannelCardProps) {
  const router = useRouter(); 
  
  const { focusProps, isFocused } = useTVFocus({
    onEnter: () => router.push(`/channel/${channel.uuid}`),
    className: "group relative block bg-slate-800 rounded-lg overflow-hidden transition-all duration-300",
    focusClassName: "ring-4 ring-white scale-105 z-20"
  });

  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!channel.uuid) return;

    const checkOnlineStatus = async () => {
      try {
        const response = await api.get(`/channels/${channel.uuid}/stream-status`);
        if (response.data.status && response.data.data) {
          setIsOnline(response.data.data.is_online);
        }
      } catch (err) {
        setIsOnline(false);
      }
    };

    checkOnlineStatus();
    // Check every 2 minutes
    const interval = setInterval(checkOnlineStatus, 120000);

    return () => clearInterval(interval);
  }, [channel.uuid]);

  return (
    <div 
      // We wrap the Link in a div to handle attributes if Link complains, 
      // OR we just use Link. Let's try direct Link application but with explicit props.
      // Actually, wrapping in a div that handles focus is safer for layout + Link behavior.
      // But we want the Link to be the interactive element for SEO.
      // Let's go with Link and assume props spread works fine on Next.js 14 Link.
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
        {channel.thumbnail_url ? (
          <img 
            src={channel.thumbnail_url} 
            alt={channel.name}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
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
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-white truncate text-sm mb-1" title={channel.name}>
          {channel.name}
        </h3>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{channel.language?.name || 'Tamil'}</span>
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span>
            {channel.viewers_count || 0}
          </span>
        </div>
      </div>
    </Link>
    </div>
  );
}
