'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Channel } from '@/types';
import VideoPlayer from './VideoPlayer';
import { useTVFocus } from '@/hooks/useTVFocus';
import { Play, Eye, MapPin, Star, LogOut, ChevronDown, Heart, Crown } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import AdBanner from './AdBanner';
import api from '@/lib/api';
import Player from 'video.js/dist/types/player';
import { useViewMode } from '@/context/ViewModeContext';

interface ClassicHomeProps {
  channels: Channel[];
  topTrending?: Channel[];
}

export default function ClassicHome({ channels, topTrending = [] }: ClassicHomeProps) {
  const { toggleMode } = useViewMode();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(channels.length > 0 ? channels[0] : null);
  const [selectedSource, setSelectedSource] = useState<string>('main');
  const [viewersCount, setViewersCount] = useState(0);
  const [logoUrl, setLogoUrl] = useState('/icon.jpg'); // Default fallback

  // Filtering State
  const [showTopTrending, setShowTopTrending] = useState(true);

  useEffect(() => {
      const fetchSettings = async () => {
          try {
              const response = await api.get('/settings/public');
              if (response.data.status) {
                  // Logo Logic
                  if (response.data.data.logo_url) {
                      let url = response.data.data.logo_url;
                      if (url.includes('/uploads/')) {
                          if (url.includes('localhost') || url.includes('127.0.0.1')) {
                              const match = url.match(/\/uploads\/.*$/);
                              if (match) url = match[0];
                          }
                      }
                      setLogoUrl(url);
                  }
                  
                  // Top Trending Logic (Classic = tv)
                  const platforms = response.data.data.top_trending_platforms || ['web', 'android', 'ios', 'tv'];
                  // Ensure it is array (Controller returns array)
                  const platformsArray = Array.isArray(platforms) ? platforms : (typeof platforms === 'string' ? platforms.split(',') : []);
                  setShowTopTrending(platformsArray.includes('tv'));
              }
          } catch (err) {
              // fallback
          }
      };
      fetchSettings();
  }, []);
  
  // Filtering State
  const [groupBy, setGroupBy] = useState<'all' | 'language' | 'category'>('all');
  const [activeGroup, setActiveGroup] = useState<string>('All');

  // Refs for tracking view logic
  const playerRef = useRef<Player | null>(null);
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasIncrementedRef = useRef(false);

  // Grouping Logic
  const getGroupedData = useCallback(() => {
     if (groupBy === 'all') return { 'All Channels': channels };

     const grouped: { [key: string]: Channel[] } = {};
     channels.forEach(channel => {
        let key = 'Others';
        if (groupBy === 'language') {
            key = channel.language?.name || 'Others';
        } else if (groupBy === 'category') {
             if ((channel as any).category?.name) {
                 key = (channel as any).category.name;
             } else {
                 key = 'Others';
             }
        }
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(channel);
     });
     return grouped;
  }, [channels, groupBy]);

  // Reset state when channel changes
  useEffect(() => {
    if (selectedChannel) {
      setViewersCount(selectedChannel.viewers_count || 0);
      hasIncrementedRef.current = false;
      document.title = `${selectedChannel.name} - Nellai IPTV`;
      if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
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

  /* New Video Playback Handlers */
  const handleVideoPlay = useCallback(() => {
    if (!hasIncrementedRef.current && !viewTimerRef.current) {
         viewTimerRef.current = setTimeout(() => {
             checkAndIncrementView();
             viewTimerRef.current = null;
         }, 10000); // 10s threshold
    }
  }, [checkAndIncrementView]);

  const handleVideoPause = useCallback(() => {
      // If paused before threshold, cancel view count
      if (viewTimerRef.current) {
          clearTimeout(viewTimerRef.current);
          viewTimerRef.current = null;
      }
  }, []);

  /* Ref for Scroll to Top logic */
  const topRef = useRef<HTMLDivElement>(null);

  /* Handle Channel Selection with Mobile Scroll and Fresh Data Fetch */
  const handleChannelClick = useCallback(async (channel: Channel, source: string = 'main') => {
      // Optimistic update
      setSelectedChannel(channel);
      setSelectedSource(source);
      
      // Fetch fresh details to ensure valid stream URL (and correct restriction status)
      try {
          const res = await api.get(`/channels/${channel.uuid}`);
          if (res.data.status && res.data.data) {
               const fresh = res.data.data;
               // Update if still selected
               setSelectedChannel(prev => (prev?.uuid === fresh.uuid ? fresh : prev));
          }
      } catch (e) {
          console.error("Error fetching channel details:", e);
      }

      // Scroll to player on mobile (lg breakpoint is 1024px)
      if (window.innerWidth < 1024 && topRef.current) {
          topRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, []);

  // Ensure initial channel has fresh data too
  useEffect(() => {
     if (channels.length > 0 && !selectedChannel) {
         // Should have been set by useState default, but just in case
         // OR if we want to refresh the default one:
         const first = channels[0];
         // Optimistically set to first channel to unblock UI immediately
         setSelectedChannel(first);
         
         // Then fetch fresh details
         api.get(`/channels/${first.uuid}`).then(res => {
             if (res.data.status && res.data.data) {
                 // Use functional update correctly, but since we just set it to 'first', 
                 // we can also just check if current selected is still 'first' or null
                 setSelectedChannel(prev => (prev?.uuid === first.uuid || !prev ? res.data.data : prev));
             }
         });
     }
  }, [channels, selectedChannel]); // eslint-disable-line react-hooks/exhaustive-deps

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

  /* Logic to cycle grouping modes */
  const cycleGrouping = useCallback(() => {
      const options = ['all', 'language', 'category'] as const;
      const currentIndex = options.indexOf(groupBy);
      const nextIndex = (currentIndex + 1) % options.length;
      const newGroup = options[nextIndex];
      setGroupBy(newGroup);
      setActiveGroup(''); // Reset active filter
  }, [groupBy]);

  /* Focus for Group Switcher */
  const { focusProps: groupFocus, isFocused: isGroupFocused } = useTVFocus({
      onEnter: cycleGrouping,
      className: "border-primary ring-2 ring-primary/50 bg-slate-900",
  });

  // Process groups
  const groups = getGroupedData();
  
  // Sorting Priority Logic (Same as OTT)
  const languageOrder = ['Tamil', 'Malayalam', 'Telugu', 'English', 'Others'];
  const categoryOrder = ['Entertainment', 'Movies', 'Music', 'Kids', 'News', 'Sports', 'Others'];

  const getPriority = useCallback((key: string, type: 'language' | 'category') => {
      const order = type === 'language' ? languageOrder : categoryOrder;
      const index = order.findIndex(o => o.toLowerCase() === key.toLowerCase());
      return index !== -1 ? index : 999;
  }, []);

  const getSortedKeys = useCallback(() => {
      const keys = Object.keys(groups);
      return keys.sort((a, b) => {
          if (groupBy === 'all') return 0;
          const type = groupBy === 'category' ? 'category' : 'language';
          const pA = getPriority(a, type);
          const pB = getPriority(b, type);
          if (pA !== pB) return pA - pB;
          return a.localeCompare(b);
      });
  }, [groups, groupBy, getPriority]);

  const groupKeys = getSortedKeys();

  // Handle Group Change and Auto-Select First Option
  const handleGroupChange = (newGroup: 'all' | 'language' | 'category') => {
      setGroupBy(newGroup);
      // When changing group type, reset activeGroup.
      // The useEffect below will then set it to the first key of the new group.
      setActiveGroup(''); 
  };

  // Effect to set activeGroup to the first key when groupBy changes or groups update
  useEffect(() => {
    if (groupBy === 'all') {
      setActiveGroup('All Channels');
    } else if (groupKeys.length > 0 && !groupKeys.includes(activeGroup)) {
      setActiveGroup(groupKeys[0]);
    } else if (groupKeys.length === 0) {
      setActiveGroup(''); // No groups available
    }
  }, [groupBy, groupKeys, activeGroup]);

  // Determine active keys for display
  const effectiveActiveGroup = activeGroup || (groupBy === 'all' ? 'All Channels' : groupKeys[0]);
  const displayChannels = groupBy === 'all' ? channels : (groups[effectiveActiveGroup] || []);

  // Language/Category Tabs
  const renderFilterTabs = () => {
      if (groupBy === 'all') return null;
      return (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-2">
              {groupKeys.map(key => (
                  <button
                      key={key}
                      onClick={() => setActiveGroup(key)}
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${effectiveActiveGroup === key ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                      {key}
                  </button>
              ))}
          </div>
      );
  };

  // Navigation for Player Overlay
  const gotoNextGroup = useCallback(() => {
      const keys = groupKeys;
      if (keys.length === 0) return;
      const currentIndex = keys.indexOf(effectiveActiveGroup);
      const nextIndex = (currentIndex + 1) % keys.length;
      setActiveGroup(keys[nextIndex]);
  }, [groupKeys, effectiveActiveGroup]);

  const gotoPrevGroup = useCallback(() => {
    const keys = groupKeys;
    if (keys.length === 0) return;
    const currentIndex = keys.indexOf(effectiveActiveGroup);
    const prevIndex = (currentIndex - 1 + keys.length) % keys.length;
    setActiveGroup(keys[prevIndex]);
  }, [groupKeys, effectiveActiveGroup]);

  return (
    <div ref={topRef} className="w-full px-0 py-0 lg:px-4 lg:py-2 h-auto lg:h-[calc(100vh)] overflow-y-auto lg:overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 lg:gap-6 h-full">
        {/* Left Side: Player Section (Flex Column) */}
        <div className="lg:col-span-7 flex flex-col h-auto lg:h-full overflow-hidden shrink-0 p-1 lg:pb-2">
           
           {/* Player Wrapper: Takes available space, centers video */}
           <div className="flex-1 min-h-0 w-full flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-slate-700/50 relative mb-1 lg:mb-2">
                <div className="w-full h-full max-w-full max-h-full flex items-center justify-center">
                    {/* Constrain video to aspect ratio but ensure it fits in the box */}
                    <div className="aspect-video w-full h-full max-h-full max-w-full flex items-center justify-center">
                         <VideoPlayer 
                            src={selectedChannel.hls_url || ''} 
                            poster={selectedChannel.thumbnail_url} 
                            onVideoPlay={handleVideoPlay}
                            onVideoPause={handleVideoPause}
                            channelUuid={selectedChannel.uuid}
                            channelName={selectedChannel.name}
                            
                            // STB Overlay Props
                            channels={groups[effectiveActiveGroup] || []}
                            topTrending={topTrending || []}
                            viewersCount={viewersCount}
                            
                            // Grouping Props
                            allGroupedChannels={groups}
                            groupKeys={groupKeys}
                            currentGroupType={groupBy}
                            onGroupTypeChange={handleGroupChange}
                            
                            currentGroup={effectiveActiveGroup}
                            onGroupSelect={setActiveGroup}
                            
                            onChannelSelect={handleChannelClick} // Use existing handler
                            onNextGroup={gotoNextGroup}
                            onPrevGroup={gotoPrevGroup}
                         />
                    </div>
                </div>
           </div>
              
           {/* Channel Info Card - Fixed Size */}
           <div className="w-full bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700/50 p-2 lg:p-3 shadow-lg shrink-0 mb-1 lg:mb-2">
                <div className="flex flex-col gap-1.5">
                    {/* Header Row: Name + Stats */}
                    <div className="flex items-center justify-between gap-3">
                         {/* Name - Left */}
                         <div className="flex-1 min-w-0 flex items-center gap-2">
                             <span className="bg-primary px-1.5 py-0.5 rounded text-white text-[10px] lg:text-xs font-bold shadow-sm shadow-primary/20 shrink-0">
                                CH {selectedChannel.channel_number}
                             </span>
                             <h1 className="text-sm lg:text-lg font-bold text-white truncate leading-tight">
                                {selectedChannel.name}
                             </h1>
                         </div>

                         {/* Stats - Right (Integrated) */}
                         <div className="bg-slate-950/80 rounded border border-slate-800 px-2 py-1 flex items-center gap-3 shrink-0">
                                <div className="flex flex-col items-center">
                                    <span className="flex items-center gap-1 text-white font-bold text-[10px] lg:text-xs">
                                        <Eye size={10} className="text-emerald-500" />
                                        {selectedChannel.viewers_count_formatted || '0'}
                                    </span>
                                    <span className="text-[8px] text-slate-500 font-medium uppercase tracking-wider scale-90">Views</span>
                                </div>
                                <div className="w-px h-5 bg-slate-800"></div>
                                <div className="flex flex-col items-center">
                                    <span className="flex items-center gap-1 text-white font-bold text-[10px] lg:text-xs">
                                        <Star size={10} className="text-amber-400 fill-amber-400" />
                                        {rating > 0 ? rating.toFixed(1) : '-'}
                                    </span>
                                    <span className="text-[8px] text-slate-500 font-medium uppercase tracking-wider scale-90">Rating</span>
                                </div>
                        </div>
                    </div>

                    {/* Metadata Row: Language + Location */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 text-[10px] lg:text-xs pl-0.5">
                            {selectedChannel.language?.name && (
                                <span className="flex items-center gap-1.5 text-slate-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    {selectedChannel.language.name}
                                </span>
                            )}
                            
                            {address && (
                            <span className="flex items-center gap-1 truncate text-slate-500 border-l border-slate-700/50 pl-3">
                                <MapPin size={10} className="shrink-0" />
                                <span className="truncate max-w-[200px]">{address}</span>
                            </span>
                            )}
                    </div>
                </div>
           </div>

           {/* Banner Ad - Responsive Height (Auto fit content) */}
           <div className="w-full h-auto min-h-[50px] lg:min-h-[180px] shrink-0 overflow-hidden rounded-xl bg-slate-900/30 border border-slate-800/30 flex items-center justify-center p-1">
                <AdBanner type="banner" />
           </div>

        </div>

        {/* Right Side: Channel Grid - Increased Width (Col-5) */}
        <div className="lg:col-span-5 bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-auto min-h-[500px] lg:h-full mt-1 lg:mt-0">
          <div className="p-2 lg:p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col gap-2 lg:gap-3 shrink-0">
             
             {/* Header with Branding & Switch */}
             <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2 lg:gap-3">
                    {/* Branding Logo - Increased Size */}
                    <img src={logoUrl} alt="Logo" className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg object-contain bg-black" />
                    <div>
                        <h2 className="font-bold text-white text-sm lg:text-base leading-tight">Nellai IPTV</h2>
                        <span className="text-[10px] text-primary font-medium tracking-wide">CLASSIC MODE</span>
                    </div>
                 </div>

                 <button
                    id="switch-mode-btn"
                    onClick={toggleMode}
                    {...exitFocus}
                    className={`${exitFocus.className} ${isExitFocused ? 'ring-2 ring-white bg-slate-700 scale-105 z-50 shadow-xl' : 'bg-slate-800/50 text-slate-400'} px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg border border-slate-700 transition-all text-[10px] lg:text-xs font-bold flex items-center gap-1.5`}
                    title="Switch to OTT Mode"
                >
                    <LogOut size={12} />
                    <span className="hidden sm:inline">Back</span>
                </button>
             </div>

             {/* Filters - TV Friendly Cycle Button */}
             <div className="flex gap-2">
                 <button
                    onClick={cycleGrouping}
                    {...groupFocus}
                    className={`flex-1 flex items-center justify-between bg-slate-950 text-white text-xs p-2 lg:p-2.5 rounded border transition-all ${isGroupFocused ? 'border-primary ring-2 ring-primary/50 bg-slate-900' : 'border-slate-800'}`}
                 >
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium">Group by:</span>
                        <span className="font-bold text-primary">
                            {groupBy === 'all' && 'All Channels'}
                            {groupBy === 'language' && 'Language'}
                            {groupBy === 'category' && 'Category'}
                        </span>
                    </div>
                    <ChevronDown size={14} className="text-slate-500" />
                 </button>
             </div>
             
             {/* Dynamic Filter Tabs */}
             {renderFilterTabs()}

          </div>
          
          <div className="overflow-visible lg:overflow-y-auto p-2 lg:p-3 flex-1 scrollbar-hide space-y-4 lg:space-y-6">
            
            {/* Top Trending Section */}
            {showTopTrending && topTrending.length > 0 && groupBy === 'all' && (
                <div className="mb-2 lg:mb-4">
                    <h3 className="text-[10px] lg:text-xs font-bold text-primary mb-1.5 lg:mb-2 uppercase tracking-wider pl-1 border-l-2 border-primary">Top Trending</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2"> {/* Changed to 4 columns desktop, 2 mobile */}
                        {topTrending
                            .map(t => channels.find(c => c.uuid === t.uuid) || t)
                            .sort((a, b) => (b.viewers_count || 0) - (a.viewers_count || 0))
                            .slice(0, 8)
                            .map((enrichedChannel, i) => (
                                 <ChannelListItem 
                                    key={`trend-${enrichedChannel.uuid}`} 
                                    channel={enrichedChannel} 
                                    index={i}
                                    isActive={selectedChannel.uuid === enrichedChannel.uuid && selectedSource === 'trending'}
                                    onSelect={() => handleChannelClick(enrichedChannel, 'trending')}
                                    compact={true}
                                  />
                             ))}
                    </div>
                </div>
            )}

            {/* Main List */}
            <div>
                 <h3 className="text-[10px] lg:text-xs font-bold text-slate-400 mb-1.5 lg:mb-2 uppercase tracking-wider pl-1">
                    {groupBy === 'all' ? 'All Channels' : (effectiveActiveGroup || 'Select Group')} <span className="text-slate-600">({displayChannels.length})</span>
                 </h3>
                 <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {displayChannels.map((channel, index) => (
                      <ChannelListItem 
                      key={channel.uuid} 
                      channel={channel} 
                      index={index}
                      isActive={selectedChannel.uuid === channel.uuid && selectedSource === 'main'}
                      onSelect={() => handleChannelClick(channel, 'main')}
                    />
                  ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelListItem({ channel, index, isActive, onSelect, compact = false }: { channel: Channel; index: number; isActive: boolean; onSelect: () => void; compact?: boolean }) {
  const { focusProps, isFocused } = useTVFocus({
    onEnter: onSelect,
    className: "group relative block rounded-lg overflow-hidden transition-all duration-300"
  });
  
  const { isFavorite, toggleFavorite, isProcessing } = useFavorites();
  const liked = isFavorite(channel.uuid);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;
    toggleFavorite(channel.uuid, channel.name);
  };
  
  const [isLoadingImage, setIsLoadingImage] = useState(true);

  const rating = Number(channel.ratings_avg_rating) || Number(channel.average_rating) || 0;

  return (
    <div
      id={`channel-${index}`}
      onClick={onSelect}
      {...focusProps}
      onKeyDown={(e) => {
        focusProps.onKeyDown?.(e);
        if (index < 3 && e.key === 'ArrowUp') {
            e.preventDefault();
            document.getElementById('switch-mode-btn')?.focus();
        }
      }}
      role="button"
      tabIndex={0}
      className={`
        ${focusProps.className} w-full text-left bg-slate-800 cursor-pointer relative
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
            loading="lazy"
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

        {/* Premium Badge */}
        {!!channel.is_premium && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-lg z-10">
            <Crown size={10} fill="currentColor" strokeWidth={2.5} />
            <span>PREMIUM</span>
          </div>
        )}

      {/* Channel Number Badge */}
      {/* Channel Number Badge */}
      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 z-10">
        CH {channel.channel_number}
      </div>
      
       {/* Favorite Button (Visible on hover or if liked) */}
        <button 
            onClick={handleFavoriteClick}
            className={`absolute top-2 right-2 z-20 p-1.5 rounded-full backdrop-blur-sm transition-all hover:scale-110 ${liked ? 'bg-white/10 text-red-500' : 'bg-black/40 text-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100'}`}
        >
            <Heart size={16} fill={liked ? "currentColor" : "none"} />
        </button>
      


      {/* Active Overlay */}
      <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity backdrop-blur-[2px] pointer-events-none ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
             <Play fill="currentColor" size={20} className="ml-1" />
           </div>
      </div>
    </div>

      {/* Info */}
      <div className={`w-full p-2 mb-0.5`}>
        <h3 className={`font-bold text-white truncate text-xs sm:text-sm leading-tight`}>
             {channel.name}
        </h3>
        
        {!compact && (
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
           <span>{channel.language?.name || 'Tamil'}</span>
        </div>
        )}
      </div>

      {/* Rating & Viewers - Vertical on mobile, Horizontal on Desktop */}
      <div className={`w-full flex md:flex-row items-center justify-between px-2 pb-2 gap-1`}>
             <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-yellow-500 font-bold bg-yellow-500/10 px-1 rounded-sm">
                <Star size={8} fill="currentColor" />
                <span>{rating > 0 ? rating.toFixed(1) : '0.0'}</span>
            </div>
             <div className="flex items-center text-[9px] sm:text-[10px] text-slate-400 font-medium">
                <Eye size={10} className="mr-1 text-slate-500" />
                <span>{channel.viewers_count_formatted || '0'}</span>
             </div>
      </div>
    </div>
  );
}
