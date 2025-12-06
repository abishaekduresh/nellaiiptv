'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Channel } from '@/types';
import VideoPlayer from './VideoPlayer';
import { useTVFocus } from '@/hooks/useTVFocus';
import { Play, Eye, MapPin, Star, LogOut } from 'lucide-react';
import AdBanner from './AdBanner';
import api from '@/lib/api';
import Player from 'video.js/dist/types/player';
import { useViewMode } from '@/context/ViewModeContext';

interface ClassicHomeProps {
  channels: Channel[];
}

export default function ClassicHome({ channels }: ClassicHomeProps) {
  const { toggleMode } = useViewMode();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [viewersCount, setViewersCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  
  // Refs for tracking view logic
  const playerRef = useRef<Player | null>(null);
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasIncrementedRef = useRef(false);

  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0]);
    }
  }, [channels, selectedChannel]);

  // Reset state when channel changes
  useEffect(() => {
    if (selectedChannel) {
      setViewersCount(selectedChannel.viewers_count || 0);
      setIsOnline(true); // Default to true, update if needed via API check
      hasIncrementedRef.current = false;
      if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
      
      // Check online status
      api.get(`/channels/${selectedChannel.uuid}/stream-status`)
        .then(res => setIsOnline(res.data.status ? res.data.data.is_online : false))
        .catch(() => setIsOnline(false));
    }
  }, [selectedChannel]);

  const checkAndIncrementView = useCallback(async () => {
    if (playerRef.current && !playerRef.current.paused() && !hasIncrementedRef.current && selectedChannel) {
      try {
        await api.post(`/channels/${selectedChannel.uuid}/view`);
        hasIncrementedRef.current = true;
        setViewersCount(prev => prev + 1);
      } catch (err) {
        // Ignore error
      }
    }
  }, [selectedChannel]);

  const handlePlayerReady = (player: Player) => {
    playerRef.current = player;
    
    player.on('play', () => {
       if (!hasIncrementedRef.current && !viewTimerRef.current) {
          viewTimerRef.current = setTimeout(() => {
             checkAndIncrementView();
             viewTimerRef.current = null;
           }, 10000); // 10s threshold
       }
    });

    // Initial check if autoplaying
    if (!player.paused()) {
        viewTimerRef.current = setTimeout(() => {
            checkAndIncrementView();
            viewTimerRef.current = null;
        }, 10000);
    }
  };

  /* Focus for Exit Button */
  const { focusProps: exitFocus, isFocused: isExitFocused } = useTVFocus({
      onEnter: toggleMode,
      className: "text-slate-400 hover:text-white transition-colors"
  });

  if (!selectedChannel) return null;

  const address = [
      selectedChannel.village, 
      selectedChannel.district?.name, 
      selectedChannel.state?.name
  ].filter(Boolean).join(', ');

  const rating = selectedChannel.average_rating || 0;

  return (
    <div className="container-custom py-6 h-[calc(100vh)] overflow-hidden mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        {/* Left Side: Player */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-y-auto scrollbar-hide">
          <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-slate-800 relative z-10 shrink-0">
             <VideoPlayer 
                src={selectedChannel.hls_url} 
                poster={selectedChannel.thumbnail_url} 
                onReady={handlePlayerReady}
             />
          </div>
          
          <div className="mt-4 space-y-4">
              {/* Channel Details */}
              <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-lg">
                            CH {selectedChannel.channel_number}
                        </span>
                        {selectedChannel.name}
                        </h1>
                        
                        <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm mt-2">
                             {/* Address */}
                             {address && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-slate-500" />
                                    {address}
                                </span>
                             )}
                             
                             {/* Language */}
                             <span className="px-2 py-0.5 bg-slate-800 rounded text-xs border border-slate-700">
                                {selectedChannel.language?.name || 'Unknown'}
                             </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                         {/* Viewers */}
                         <div className="flex flex-col items-center px-2">
                            <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                                <Eye size={16} className={isOnline ? "text-primary" : "text-slate-600"} />
                                {viewersCount.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Viewers</span>
                         </div>
                         
                         <div className="w-px h-8 bg-slate-800"></div>

                         {/* Rating */}
                         <div className="flex flex-col items-center px-2">
                            <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
                                <Star size={16} fill="currentColor" />
                                {rating > 0 ? rating.toFixed(1) : '-'}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Rating</span>
                         </div>
                    </div>
                </div>
              </div>

              {/* Banner Ad */}
              <div className="w-full">
                 <AdBanner type="banner" />
              </div>
          </div>
        </div>

        {/* Right Side: Channel Grid */}
        <div className="lg:col-span-4 bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <h2 className="font-bold text-lg text-white">Channel List</h2>
             <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full">{channels.length} Channels</span>
                <button
                    id="switch-mode-btn"
                    onClick={toggleMode}
                    {...exitFocus}
                    onKeyDown={(e) => {
                        exitFocus.onKeyDown?.(e);
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            document.getElementById('channel-0')?.focus();
                        }
                    }}
                    className={`${exitFocus.className} ${isExitFocused ? 'ring-4 ring-white bg-slate-700 scale-105 z-50 shadow-xl' : 'bg-slate-800/50'} flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 transition-all`}
                    title="Switch to OTT Mode"
                >
                    <LogOut size={16} />
                    <span className="text-xs font-bold">Switch to OTT</span>
                </button>
             </div>
          </div>
          <div className="overflow-y-auto p-3 flex-1 scrollbar-hide">
            <div className="grid grid-cols-2 gap-3">
              {channels.map((channel, index) => (
                <ChannelListItem 
                  key={channel.uuid} 
                  channel={channel} 
                  index={index}
                  isActive={selectedChannel.uuid === channel.uuid}
                  onSelect={() => setSelectedChannel(channel)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelListItem({ channel, index, isActive, onSelect }: { channel: Channel; index: number; isActive: boolean; onSelect: () => void }) {
  const { focusProps, isFocused } = useTVFocus({
    onEnter: onSelect,
    className: `w-full flex items-start gap-4 p-3 rounded-lg transition-all duration-200 border group ${
      isActive 
        ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/20' 
        : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
    }`
  });

  const rating = channel.average_rating || 0;
  const address = [channel.village, channel.district?.name].filter(Boolean).join(', ');

  return (
    <button
      id={`channel-${index}`}
      onClick={onSelect}
      {...focusProps}
      onKeyDown={(e) => {
        focusProps.onKeyDown?.(e);
        // If on top row (index 0 or 1), up arrow goes to switch button
        if (index < 2 && e.key === 'ArrowUp') {
            e.preventDefault();
            document.getElementById('switch-mode-btn')?.focus();
        }
      }}
      className={`
        ${focusProps.className} flex-col items-start gap-2 h-auto
        ${isFocused ? 'ring-2 ring-primary scale-[1.02] z-10 bg-slate-800 shadow-xl' : ''}
      `}
    >
      {/* Thumbnail Card */}
      <div className="w-full aspect-[4/3] bg-black rounded-lg overflow-hidden border border-slate-700 shadow-sm group-hover:shadow-md transition-shadow relative">
        {channel.thumbnail_url ? (
          <img src={channel.thumbnail_url} alt={channel.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px]">NO IMG</div>
        )}
        <div className="absolute top-1 left-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
            CH {channel.channel_number}
        </div>
        {isActive && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <Play size={24} className="text-white drop-shadow-lg animate-pulse" fill="currentColor" />
            </div>
        )}
      </div>

      {/* Info */}
      <div className="w-full text-left min-w-0">
        <p className={`font-bold text-sm truncate mb-0.5 ${isActive ? 'text-primary' : 'text-slate-200 group-hover:text-white'}`}>
        {channel.name}
        </p>
        
        {/* Address */}
        {address && (
            <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mb-1">
                <MapPin size={8} />
                {address}
            </p>
        )}

        {/* Rating & Language Row */}
        <div className="flex items-center justify-between mt-1">
             <div className="flex items-center gap-1">
                <Star size={10} className={rating > 0 ? "text-yellow-500" : "text-slate-600"} fill={rating > 0 ? "currentColor" : "none"} />
                <span className={`text-[10px] font-medium ${rating > 0 ? 'text-yellow-500' : 'text-slate-500'}`}>
                    {rating > 0 ? rating.toFixed(1) : '-'}
                </span>
            </div>
             <span className="text-[10px] text-slate-600 font-medium px-1.5 py-0.5 border border-slate-700/50 rounded bg-black/20">
                {channel.language?.name?.slice(0, 3).toUpperCase() || 'TV'}
            </span>
        </div>
      </div>
    </button>
  );
}
