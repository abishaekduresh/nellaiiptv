'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { Channel } from '@/types';

interface ChannelCardProps {
  channel: Channel;
}

export default function ChannelCard({ channel }: ChannelCardProps) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!channel.hls_url) return;

    const checkOnlineStatus = async () => {
      try {
        const response = await fetch(channel.hls_url, { method: 'HEAD' });
        setIsOnline(response.ok);
      } catch (err) {
        setIsOnline(false);
      }
    };

    checkOnlineStatus();
    // Check every 2 minutes
    const interval = setInterval(checkOnlineStatus, 120000);

    return () => clearInterval(interval);
  }, [channel.hls_url]);

  return (
    <Link 
      href={`/channel/${channel.uuid}`}
      className="group relative block bg-slate-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all duration-300"
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
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10">
          CH {channel.channel_number}
        </div>
        
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
  );
}
