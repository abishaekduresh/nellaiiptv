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
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(channels.length > 0 ? channels[0] : null);
  const [viewersCount, setViewersCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  
  // Refs for tracking view logic
  const playerRef = useRef<Player | null>(null);
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasIncrementedRef = useRef(false);



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

  const rating = Number(selectedChannel.ratings_avg_rating || 0) || Number(selectedChannel.average_rating) || 0;

  return (
    <div className="w-full px-2 py-2 lg:px-4 lg:py-2 h-auto lg:h-[calc(100vh)] overflow-y-auto lg:overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-full">
        {/* Left Side: Player */}
        <div className="lg:col-span-6 flex flex-col h-auto lg:h-full overflow-visible lg:overflow-hidden shrink-0">
          <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-slate-800 relative z-10 shrink-0">
             <VideoPlayer 
                src={selectedChannel.hls_url} 
                poster={selectedChannel.thumbnail_url} 
                onReady={handlePlayerReady}
                channelUuid={selectedChannel.uuid}
                channelName={selectedChannel.name}
             />
          </div>
          
          <div className="mt-2 space-y-2">
              {/* Channel Details */}
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <span className="bg-primary/20 text-primary px-2 py-1 md:px-3 rounded-lg text-base md:text-lg">
                            CH {selectedChannel.channel_number}
                        </span>
                        {selectedChannel.name}
                        </h1>
                        
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-slate-400 text-sm mt-2">
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

                    <div className="flex items-center gap-4 bg-slate-950/50 p-2 md:p-3 rounded-lg border border-slate-800/50 justify-around md:justify-start">
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
              <div className="w-full min-h-auto lg:min-h-[512px]">
                 <AdBanner type="banner" />
              </div>
          </div>
        </div>

        {/* Right Side: Channel Grid */}
        <div className="lg:col-span-6 bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[500px] lg:h-full mt-4 lg:mt-0">
          <div className="p-2 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
            <h2 className="font-bold text-lg text-white">Channel List</h2>
             <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full whitespace-nowrap">{channels.length} Channels</span>
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
                    <span className="hidden md:inline text-xs font-bold">Switch to OTT</span>
                    <span className="md:hidden text-xs font-bold">OTT</span>
                </button>
             </div>
          </div>
          <div className="overflow-y-auto p-3 flex-1 scrollbar-hide">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
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
    className: "group relative block rounded-lg overflow-hidden transition-all duration-300"
  });
  
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [isOnline, setIsOnline] = useState(channel.status === 'active');

  const rating = Number(channel.ratings_avg_rating) || Number(channel.average_rating) || 0;

  // Check online status on mount
  useEffect(() => {
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
  }, [channel.uuid]);

  return (
    <button
      id={`channel-${index}`}
      onClick={onSelect}
      {...focusProps}
      onKeyDown={(e) => {
        focusProps.onKeyDown?.(e);
        // If on top row (index 0 or 1), up arrow goes to switch button
        if (index < 3 && e.key === 'ArrowUp') {
            e.preventDefault();
            document.getElementById('switch-mode-btn')?.focus();
        }
      }}
      className={`
        ${focusProps.className} w-full text-left bg-slate-800
        ${isActive ? 'ring-2 ring-primary scale-[1.02] z-10 shadow-xl' : 'hover:ring-2 hover:ring-primary'}
        ${isFocused ? 'ring-4 ring-white scale-105 z-20' : ''}
      `}
    >
      
      {/* Thumbnail Card - Aspect Video 16:9 */}
    <div className="w-full aspect-video relative bg-slate-900 text-slate-800">
      {channel.thumbnail_url ? (
        <>
            <div className={`absolute inset-0 bg-slate-800 animate-pulse ${isLoadingImage ? 'opacity-100 z-10' : 'opacity-0 -z-10'} transition-opacity`} />
            <img
            src={channel.thumbnail_url}
            alt={channel.name}
            onLoad={() => setIsLoadingImage(false)}
            onError={() => setIsLoadingImage(false)}
            className={`w-full h-full object-contain p-2 opacity-90 group-hover:opacity-100 transition-opacity ${isLoadingImage ? 'opacity-0' : 'opacity-90'}`}
            />
        </>
      ) : (
         <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-2xl">
            {channel.name.charAt(0)}
          </div>
      )}

      {/* Channel Number Badge */}
      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10">
        CH {channel.channel_number}
      </div>
      
       {/* Status Badge */}
      <div className={`absolute top-2 left-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse ${isOnline ? 'bg-green-600' : 'bg-red-600'}`}>
           {isOnline ? 'ONLINE' : 'OFFLINE'}
      </div>

      {/* Active Overlay */}
      <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity backdrop-blur-[2px] ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
             <Play fill="currentColor" size={20} className="ml-1" />
           </div>
      </div>
    </div>

      {/* Info */}
      <div className="w-full p-3 pb-0">
        <h3 className="font-medium text-white truncate text-sm mb-1" title={channel.name}>
             {channel.name}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-slate-400">
           <span>{channel.language?.name || 'Tamil'}</span>
        </div>
      </div>

      {/* Rating & Viewers - Matches ChannelCard layout */}
      <div className="w-full flex items-center justify-between mt-1 px-3 pb-3">
             <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold">
                <Star size={12} fill="currentColor" />
                <span>{rating > 0 ? rating.toFixed(1) : '0.0'}</span>
            </div>
             <div className="flex items-center text-xs text-slate-400">
                <Eye size={12} className="mr-1" />
                <span>{(channel.viewers_count || 0).toLocaleString()}</span>
             </div>
      </div>
    </button>
  );
}
