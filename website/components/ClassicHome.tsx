'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Channel } from '@/types';
import Link from 'next/link';
import VideoPlayer from './VideoPlayer';
import { useTVFocus } from '@/hooks/useTVFocus';
import { Play, Eye, MapPin, Star, ChevronDown, Heart, Crown, Menu, ArrowLeft, Radio, RotateCcw, Loader2, RefreshCw, ChevronUp, Monitor, Volume2, Signal, Users, Clock, LogIn, X } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import AdBanner from './AdBanner';
import ScrollingAdsTicker from './ScrollingAdsTicker';
import api from '@/lib/api';
import VideoAdOverlay, { VisualAd, getSessionImpressions, shouldAttemptAd } from './VideoAdOverlay';
import Player from 'video.js/dist/types/player';
import { useViewMode } from '@/context/ViewModeContext';
import { useAuthStore } from '@/stores/authStore';
import ClassicMenu from './ClassicMenu';
import ChannelComments from './ChannelComments';
import { resolveImageUrl } from '@/lib/utils';
import dynamic from 'next/dynamic';

const ClientSessionsMap = dynamic(() => import('@/components/ClientSessionsMap'), { ssr: false });


interface ClassicHomeProps {
  channels: Channel[];
  topTrending?: Channel[];
  initialChannelUuid?: string | null;
}

interface StreamClientSession {
  uuid: string;
  ip: string | null;
  user_agent: string | null;
  protocol: string | null;
  opened_at: number | null;
  closed_at: number | null;
  country: string | null;
  ip_type: string | null;
  continent: string | null;
  continent_code: string | null;
  country_code: string | null;
  region: string | null;
  region_code: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  postal: string | null;
  org: string | null;
  isp: string | null;
  domain: string | null;
}

interface MyStream {
  uuid: string;
  stream_name: string;
  health_status: 'online' | 'offline' | null;
  stream_status: string | null;
  status: string;
  published_via: string | null;
  published_from: string | null;
  uptime: number | null;
  online_clients: number | null;
  max_sessions: number | null;
  client_count: number | null;
  inputs_bandwidth: number | null;
  out_bandwidth: number | null;
  video_codec: string | null;
  video_width: number | null;
  video_height: number | null;
  fps: number | null;
  audio_codec: string | null;
  audio_bitrate: number | null;
  audio_sample_rate: number | null;
  audio_channels: number | null;
  assigned_at: string;
  clients: StreamClientSession[];
}

function fmtUptimeClassic(ms: number | null): string {
  if (!ms || ms <= 0) return '—';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}hrs ${m}min`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function fmtBw(bps: number | null): string {
  if (!bps || bps <= 0) return '—';
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(0)} Kbps`;
  return `${bps} bps`;
}

function fmtEpoch(ms: number | null): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleString();
}

const HEALTH_CFG: Record<string, { dot: string; label: string; badge: string }> = {
  online:  { dot: 'bg-green-400 shadow shadow-green-400/50 animate-pulse', label: 'Online',  badge: 'bg-green-500/15 text-green-400 border-green-500/25' },
  offline: { dot: 'bg-red-500',                                            label: 'Offline', badge: 'bg-red-500/15 text-red-400 border-red-500/25' },
};

const STREAM_STATUS_CFG: Record<string, { badge: string; label: string }> = {
  running: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', label: 'Running' },
  stopped: { badge: 'bg-slate-600/30 text-slate-400 border-slate-600/30',       label: 'Stopped' },
  error:   { badge: 'bg-red-500/15 text-red-400 border-red-500/25',             label: 'Error'   },
};

function fmtSessionDur(openedMs: number | null, closedMs: number | null): string {
  if (!openedMs) return '—';
  const endMs = closedMs || Date.now();
  const secs = Math.floor((endMs - openedMs) / 1000);
  if (secs < 1) return '< 1s';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ClassicHome({ channels, topTrending = [], initialChannelUuid = null }: ClassicHomeProps) {
  // Find initial channel if provided
  const getInitialChannel = () => {
    if (initialChannelUuid) {
      const found = channels.find(c => c.uuid === initialChannelUuid);
      if (found) return found;
    }
    return channels.length > 0 ? channels[0] : null;
  };

  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(getInitialChannel());
  const [selectedSource, setSelectedSource] = useState<string>('main');
  const [viewersCount, setViewersCount] = useState(0);

  // Visual ad state
  const [currentAd, setCurrentAd]   = useState<VisualAd | null>(null);
  const [showAd, setShowAd]         = useState(false);
  const [logoUrl, setLogoUrl] = useState('/icon.jpg'); // Default fallback
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // My Streams panel
  const { user } = useAuthStore();
  const [rightPanel, setRightPanel] = useState<'channels' | 'streams'>('channels');
  const [myStreams, setMyStreams] = useState<MyStream[]>([]);
  const [restarting, setRestarting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncCooldown, setSyncCooldown] = useState(0);
  const [selectedStream, setSelectedStream] = useState<MyStream | null>(null);
  const fetchMyStreams = useCallback(async (force = false): Promise<MyStream[] | null> => {
    try {
      const params: Record<string, unknown> = { _t: Date.now() };
      if (force) params.sync = 1;
      const res = await api.get('/customers/streams', { params });
      if (res.data?.status) {
        const streams: MyStream[] = res.data.data || [];
        setMyStreams(streams);
        return streams;
      }
    } catch {}
    return null;
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchMyStreams();
  }, [user, fetchMyStreams]);

  // Tick the cooldown counter down every second
  useEffect(() => {
    if (syncCooldown <= 0) return;
    const t = setTimeout(() => setSyncCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [syncCooldown]);

  const handleSyncStreams = async () => {
    if (syncing || syncCooldown > 0) return;
    setSyncing(true);
    try {
      const fresh = await fetchMyStreams(true);
      // Refresh the open modal with live data
      if (fresh) {
        setSelectedStream(prev => {
          if (!prev) return prev;
          return fresh.find(s => s.uuid === prev.uuid) ?? prev;
        });
      }
    } finally {
      setSyncing(false);
      setSyncCooldown(30);
    }
  };

  const handleStreamRestart = async (streamUuid: string) => {
    setRestarting(streamUuid);
    try {
      await api.post(`/customers/streams/${streamUuid}/toggle`, { enable: false });
      await new Promise(r => setTimeout(r, 2000));
      await api.post(`/customers/streams/${streamUuid}/toggle`, { enable: true });
      await fetchMyStreams();
    } catch {}
    setRestarting(null);
  };

  // Filtering State
  const [showTopTrending, setShowTopTrending] = useState(true);
  const [isOpenAccess, setIsOpenAccess] = useState(false);

  useEffect(() => {
      const fetchSettings = async () => {
          try {
              const response = await api.get('/settings/public');
              if (response.data.status) {
                  // Logo Logic
                  const logo = response.data.data.logo_url || response.data.data.logo_path;
                  if (logo) {
                      setLogoUrl(resolveImageUrl(logo));
                  }
                  
                  // Top Trending Logic (Classic = tv)
                  const platforms = response.data.data.top_trending_platforms || ['web', 'android', 'ios', 'tv'];
                  // Ensure it is array (Controller returns array)
                  const platformsArray = Array.isArray(platforms) ? platforms : (typeof platforms === 'string' ? platforms.split(',') : []);
                  setShowTopTrending(platformsArray.includes('tv'));

                  // Open Access Logic
                  setIsOpenAccess(!!response.data.data.is_open_access);
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
  const handleAdComplete = useCallback(() => {
    setShowAd(false);
    setCurrentAd(null);
  }, []);

  // Trigger pre-roll ad on every channel *switch* (not on initial auto-select).
  // Uses raw fetch to bypass api.ts interceptors that silently swallow errors.
  const prevAdChannelUuid = useRef<string | null>(null);
  useEffect(() => {
    const uuid = selectedChannel?.uuid ?? null;
    if (!uuid) return;
    if (prevAdChannelUuid.current === null) {
      prevAdChannelUuid.current = uuid;
      return;
    }
    if (prevAdChannelUuid.current === uuid) return;
    prevAdChannelUuid.current = uuid;

    const base = process.env.NEXT_PUBLIC_API_URL ?? '';
    const key  = process.env.NEXT_PUBLIC_API_SECRET ?? '';
    fetch(`${base}/visual-ads/active`, {
      headers: { 'X-Client-Platform': 'web', 'X-API-KEY': key },
    })
      .then(r => r.json())
      .then((data: any) => {
        const ad: VisualAd | null = data?.data ?? null;
        if (!ad) return;
        if (ad.max_impressions_per_session > 0 &&
            getSessionImpressions(ad.uuid) >= ad.max_impressions_per_session) return;
        if (!shouldAttemptAd(ad.display_frequency)) return;
        setCurrentAd(ad);
        setShowAd(true);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel?.uuid]);

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

      // Update URL silently for SEO
      if (typeof window !== 'undefined') {
          window.history.pushState(null, '', `/channel/${channel.uuid}`);
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
  // Exit Button Removed
  /* 
  const { focusProps: exitFocus, isFocused: isExitFocused } = useTVFocus({
      onEnter: () => {}, // No-op
      className: "text-slate-400 hover:text-white transition-colors"
  });
  */

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
  
  // Sorting Priority Logic (Backend Driven)
  const getPriority = useCallback((key: string, type: 'language' | 'category') => {
      // Find a channel in this group to get the metadata
      const groupChannels = groups[key];
      if (!groupChannels || groupChannels.length === 0) return 999;
      
      const firstChannel = groupChannels[0];
      if (type === 'language') {
          return firstChannel.language?.order_number || 999;
      } else {
          return firstChannel.category?.order_number || 999;
      }
  }, [groups]);

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
              {groupKeys.map((key, idx) => (
                  <FilterTabItem 
                    key={key} 
                    label={key} 
                    index={idx}
                    isSelected={effectiveActiveGroup === key} 
                    onSelect={() => setActiveGroup(key)} 
                  />
              ))}
          </div>
      );
  };

function FilterTabItem({ label, index, isSelected, onSelect }: { label: string; index: number; isSelected: boolean; onSelect: () => void }) {
    const { focusProps, isFocused } = useTVFocus({
        onEnter: onSelect,
        className: `px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border`,
        focusClassName: "bg-primary text-white scale-105 ring-2 ring-white z-10"
    });

    return (
        <button
            {...focusProps}
            id={`filter-tab-${index}`}
            className={`
                ${focusProps.className}
                ${isSelected 
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                }
                ${isFocused ? 'bg-primary text-white border-white' : ''}
            `}
        >
            {label}
        </button>
    );
}


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

                {/* Video Ad Overlay — shown as pre-roll before channel plays */}
                {showAd && currentAd && (
                  <VideoAdOverlay ad={currentAd} onComplete={handleAdComplete} />
                )}

                <div className="w-full h-full max-w-full max-h-full flex items-center justify-center isolate">
                    {/* Constrain video to aspect ratio but ensure it fits in the box */}
                    <div className="aspect-video w-full h-full max-h-full max-w-full flex items-center justify-center">
                         <VideoPlayer
                            src={selectedChannel.hls_url || ''}
                            poster={selectedChannel.thumbnail_url}
                            onVideoPlay={handleVideoPlay}
                            onVideoPause={handleVideoPause}
                            channelUuid={selectedChannel.uuid}
                            channelName={selectedChannel.name}
                            adPlaying={showAd}
                            
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

           {/* Scrolling Ads Ticker - shown just below the player */}
           <ScrollingAdsTicker />
              
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
                            
                            {/* Interactive Rating */}
                            <div className="flex items-center gap-1 border-l border-slate-700/50 pl-3">
                                <span className="text-slate-500 text-[9px] mr-1 hidden sm:inline">Rate:</span>
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <RatingStar 
                                            key={star}
                                            star={star}
                                            currentRating={Number(selectedChannel.user_rating || 0)}
                                            onRate={(val) => {
                                                api.post(`/channels/${selectedChannel.uuid}/rate`, { rating: val })
                                                   .then((res) => {
                                                       if (res.data.status && res.data.data) {
                                                            const newStats = res.data.data;
                                                            setSelectedChannel(prev => prev ? { 
                                                                ...prev, 
                                                                user_rating: val,
                                                                average_rating: newStats.average_rating,
                                                                ratings_avg_rating: newStats.average_rating,
                                                                total_ratings: newStats.total_ratings
                                                            } : null);
                                                       } else {
                                                            setSelectedChannel(prev => prev ? { ...prev, user_rating: val } : null);
                                                       }
                                                   })
                                                   .catch((err) => console.error("Rating failed", err));
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                    </div>
                </div>
           </div>

           {/* Channel Discussion - Decreased height to favor player */}
           <div className="w-full h-auto lg:h-[180px] shrink-0 overflow-hidden mb-1 lg:mb-0">
                <ChannelComments channelUuid={selectedChannel.uuid} />
           </div>

        </div>

        {/* Right Side: Channel Grid - Increased Width (Col-5) */}
        <div className="lg:col-span-5 bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-auto min-h-[500px] lg:h-full mt-1 lg:mt-0">
          <div className="p-2 lg:p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col gap-2 lg:gap-3 shrink-0">
             
             {/* Header with Branding & Switch */}
             <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2 lg:gap-3">
                    {/* Branding Logo - Link to Home */}
                    <Link href="/">
                        <img src={resolveImageUrl(logoUrl)} alt="Logo" className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg object-contain bg-black cursor-pointer hover:scale-105 transition-transform" />
                    </Link>
                    <div>
                        <h2 className="font-bold text-white text-sm lg:text-base leading-tight">Nellai IPTV</h2>
                        <span className="text-[10px] text-primary font-bold tracking-wide uppercase">Classic Mode</span>
                    </div>
                 </div>

                  <div className="flex items-center gap-2">
                      {!user && (
                        <Link
                          href="/login"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/90 hover:bg-primary text-white text-xs font-semibold shadow-sm shadow-primary/30 transition-colors"
                        >
                          <LogIn size={13} />
                          Login
                        </Link>
                      )}
                      {!isOpenAccess && (
                        <>
                          <ClassicBackButton />
                          <ClassicMenuButton onClick={() => setIsMenuOpen(true)} />
                        </>
                      )}
                  </div>
              </div>

             {/* Panel Tab Toggle: Channels / My Streams */}
             {user && myStreams.length > 0 && (
               <div className="flex gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
                 <button
                   onClick={() => setRightPanel('channels')}
                   className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold transition-all ${rightPanel === 'channels' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
                 >
                   <Eye size={12} /> Channels
                 </button>
                 <button
                   onClick={() => setRightPanel('streams')}
                   className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold transition-all ${rightPanel === 'streams' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 hover:text-cyan-400'}`}
                 >
                   <Radio size={12} /> My Streams
                   <span className="bg-cyan-500 text-slate-900 text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">{myStreams.length}</span>
                 </button>
               </div>
             )}

             {/* Filters - TV Friendly Cycle Button */}
             {rightPanel === 'channels' && (
               <>
                 <div className="flex gap-2">
                   <button
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
                 {renderFilterTabs()}
               </>
             )}

          </div>
          
          {/* My Streams Panel */}
          {rightPanel === 'streams' && (
            <div className="overflow-y-auto flex-1 scrollbar-hide flex flex-col">
              {/* Panel toolbar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60 shrink-0">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  {myStreams.length} stream{myStreams.length !== 1 ? 's' : ''} assigned
                </span>
                <button
                  onClick={handleSyncStreams}
                  disabled={syncing || syncCooldown > 0}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-semibold"
                >
                  <RefreshCw size={10} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Syncing…' : syncCooldown > 0 ? `${syncCooldown}s` : 'Sync'}
                </button>
              </div>

              {/* 3-column card grid */}
              <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {myStreams.map(s => {
                  const health   = HEALTH_CFG[s.health_status ?? 'offline'] ?? HEALTH_CFG.offline;
                  const streamSt = STREAM_STATUS_CFG[s.stream_status ?? ''];
                  return (
                    <div
                      key={s.uuid}
                      onClick={() => setSelectedStream(s)}
                      className="relative bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 cursor-pointer hover:border-cyan-500/40 hover:bg-slate-800 transition-all group flex flex-col gap-2"
                    >
                      {/* Restart button — top-right, stops propagation */}
                      <button
                        onClick={e => { e.stopPropagation(); handleStreamRestart(s.uuid); }}
                        disabled={!!restarting}
                        className="absolute top-2 right-2 p-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-40 opacity-0 group-hover:opacity-100"
                        title="Restart"
                      >
                        <RotateCcw size={10} className={restarting === s.uuid ? 'animate-spin' : ''} />
                      </button>

                      {/* Health dot + name */}
                      <div className="flex items-start gap-2 pr-5">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${health.dot}`} />
                        <p className="text-white text-sm font-semibold leading-tight line-clamp-2 break-all">{s.stream_name}</p>
                      </div>

                      {/* Status badges */}
                      <div className="flex flex-wrap gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold ${health.badge}`}>
                          {health.label}
                        </span>
                        {streamSt && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold ${streamSt.badge}`}>
                            {streamSt.label}
                          </span>
                        )}
                      </div>

                      {/* Viewers + uptime */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-auto">
                        <span className="flex items-center gap-1">
                          <Users size={11} className="text-slate-600" />
                          {s.online_clients ?? 0}
                          {s.max_sessions ? `/${s.max_sessions}` : ''}
                        </span>
                        {s.uptime ? <span>⏱ {fmtUptimeClassic(s.uptime)}</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stream detail modal */}
          {selectedStream && (
            <StreamDetailModal
              stream={selectedStream}
              restarting={restarting}
              onRestart={handleStreamRestart}
              syncing={syncing}
              syncCooldown={syncCooldown}
              onSync={handleSyncStreams}
              onClose={() => setSelectedStream(null)}
            />
          )}

          {/* Channels Panel */}
          {rightPanel === 'channels' && <div className="overflow-visible lg:overflow-y-auto p-2 lg:p-3 flex-1 scrollbar-hide space-y-4 lg:space-y-6">

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
                  {displayChannels.reduce((acc: React.ReactNode[], channel, index) => {
                      acc.push(
                        <ChannelListItem 
                          key={channel.uuid} 
                          channel={channel} 
                          index={index}
                          isActive={selectedChannel.uuid === channel.uuid && selectedSource === 'main'}
                          onSelect={() => handleChannelClick(channel, 'main')}
                        />
                      );
                      
                      // Add an ad every 12 items (3 rows on lg:grid-cols-4)
                      if ((index + 1) % 16 === 0) {
                          acc.push(
                              <div key={`ad-${index}`} className="col-span-full py-2">
                                  <div className="w-full bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
                                      <AdBanner type="banner" className="w-full" />
                                  </div>
                              </div>
                          );
                      }
                      return acc;
                  }, [])}
                </div>
            </div>
          </div>}
        </div>
      </div>
      <ClassicMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}

// ── Stream Detail Modal (full-screen) ─────────────────────────────────────────
function StreamDetailModal({
  stream: s,
  restarting,
  onRestart,
  syncing,
  syncCooldown,
  onSync,
  onClose,
}: {
  stream: MyStream;
  restarting: string | null;
  onRestart: (uuid: string) => void;
  syncing: boolean;
  syncCooldown: number;
  onSync: () => void;
  onClose: () => void;
}) {
  const health    = HEALTH_CFG[s.health_status ?? 'offline'] ?? HEALTH_CFG.offline;
  const streamSt  = STREAM_STATUS_CFG[s.stream_status ?? ''];
  const clientPct = s.max_sessions && s.max_sessions > 0
    ? Math.min(100, Math.round(((s.online_clients ?? 0) / s.max_sessions) * 100))
    : 0;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900 shrink-0">
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-3 h-3 rounded-full shrink-0 ${health.dot}`} />
          <span className="text-white text-base font-bold truncate">{s.stream_name}</span>
          <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold shrink-0 ${health.badge}`}>
            {health.label}
          </span>
          {streamSt && (
            <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold shrink-0 ${streamSt.badge}`}>
              {streamSt.label}
            </span>
          )}
        </div>

        <button
          onClick={onSync}
          disabled={syncing || syncCooldown > 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-40 text-xs font-semibold shrink-0"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">
            {syncing ? 'Syncing…' : syncCooldown > 0 ? `${syncCooldown}s` : 'Sync'}
          </span>
        </button>

        <button
          onClick={() => onRestart(s.uuid)}
          disabled={!!restarting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-40 text-xs font-semibold shrink-0"
        >
          <RotateCcw size={14} className={restarting === s.uuid ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">{restarting === s.uuid ? 'Restarting…' : 'Restart'}</span>
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4 space-y-4">

          {/* Status badges (mobile-only — hidden in top bar on sm+) */}
          <div className="flex flex-wrap gap-1.5 sm:hidden">
            <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${health.badge}`}>
              {health.label}
            </span>
            {streamSt && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${streamSt.badge}`}>
                {streamSt.label}
              </span>
            )}
          </div>

          {/* ── Map (left, stretched) + Stream Info / Video / Audio / Bandwidth (right) ── */}
          {(() => {
            const hasMap = s.clients.some(c =>
              (c.latitude != null && c.longitude != null) ||
              (c.country_code != null && c.country_code.toUpperCase() !== 'NONE') ||
              (c.country != null && c.country.toUpperCase() !== 'NONE')
            );
            return (
              <div className={`grid gap-4 items-stretch ${hasMap ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1'}`}>

                {/* Map — left column, stretches to match right column height */}
                {hasMap && (
                  <div className="lg:col-span-3 rounded-xl overflow-hidden border border-slate-800 min-h-[400px] flex flex-col">
                    <div className="flex-1" style={{ minHeight: 0 }}>
                      <ClientSessionsMap clients={s.clients} />
                    </div>
                  </div>
                )}

                {/* Right column: Stream Info + Video + Audio + Bandwidth */}
                <div className={`${hasMap ? 'lg:col-span-2' : ''} space-y-3`}>

                  {/* Stream Info */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
                    <p className="text-sm text-cyan-400 font-bold uppercase tracking-wider mb-2">Stream Info</p>
                    <InfoRow label="Protocol"  value={s.published_via  ?? '—'} />
                    <InfoRow label="Source IP" value={s.published_from ?? '—'} />
                    <InfoRow label="Uptime"    value={fmtUptimeClassic(s.uptime)} />
                    <InfoRow label="Sessions"  value={`${s.online_clients ?? 0} / ${s.max_sessions ?? '∞'}`} />
                    {s.max_sessions && s.max_sessions > 0 && (
                      <div className="pt-1">
                        <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${clientPct >= 90 ? 'bg-red-400' : clientPct >= 70 ? 'bg-amber-400' : 'bg-green-400'}`}
                            style={{ width: `${clientPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 mt-0.5 block">{clientPct}% capacity</span>
                      </div>
                    )}
                  </div>

                  {(s.video_codec || s.video_width) && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
                      <SectionLabel icon={Monitor} label="Video" />
                      <div className="mt-1 space-y-1">
                        {s.video_codec && <InfoRow label="Codec"      value={s.video_codec.toUpperCase()} />}
                        {s.video_width && s.video_height && <InfoRow label="Resolution" value={`${s.video_width}×${s.video_height}`} />}
                        {s.fps         && <InfoRow label="FPS"        value={`${s.fps}`} />}
                      </div>
                    </div>
                  )}

                  {(s.audio_codec || s.audio_channels) && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
                      <SectionLabel icon={Volume2} label="Audio" />
                      <div className="mt-1 space-y-1">
                        {s.audio_codec       && <InfoRow label="Codec"       value={s.audio_codec.toUpperCase()} />}
                        {s.audio_channels    && <InfoRow label="Channels"    value={s.audio_channels === 2 ? 'Stereo' : `${s.audio_channels}ch`} />}
                        {s.audio_bitrate     && <InfoRow label="Bitrate"     value={fmtBw(s.audio_bitrate)} />}
                        {s.audio_sample_rate && <InfoRow label="Sample Rate" value={`${(s.audio_sample_rate / 1000).toFixed(1)} kHz`} />}
                      </div>
                    </div>
                  )}

                  {(s.inputs_bandwidth || s.out_bandwidth) && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
                      <SectionLabel icon={Signal} label="Bandwidth" />
                      <div className="mt-1 space-y-1">
                        <InfoRow label="In"  value={fmtBw(s.inputs_bandwidth)} />
                        <InfoRow label="Out" value={fmtBw(s.out_bandwidth)} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Client Sessions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-cyan-400" />
              <span className="text-sm text-cyan-400 font-bold uppercase tracking-wider">
                Client Sessions
              </span>
              <span className="bg-slate-800 text-slate-400 text-sm font-bold px-2 py-0.5 rounded-full">
                {s.clients.length}
              </span>
              <div className="flex items-center gap-2 ml-auto text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Active
                </span>
                <span className="text-slate-600">= live session</span>
              </div>
            </div>

            {s.clients.length === 0 ? (
              <p className="text-xs text-slate-600 py-4 text-center">No sessions recorded.</p>
            ) : (
              <div className="rounded-xl overflow-hidden border border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="text-left px-5 py-3 font-medium">IP</th>
                        <th className="text-left px-3 py-3 font-medium">Protocol</th>
                        <th className="text-left px-3 py-3 font-medium">Location</th>
                        <th className="text-left px-3 py-3 font-medium">ISP / Org</th>
                        <th className="text-left px-3 py-3 font-medium">Opened</th>
                        <th className="text-left px-3 py-3 font-medium">Duration / Status</th>
                        <th className="text-left px-3 py-3 font-medium">User Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.clients.map(c => {
                        const isActive = c.closed_at == null;
                        const locationParts = [c.city, c.region, c.country].filter(Boolean);
                        const location = locationParts.length > 0 ? locationParts.join(', ') : null;
                        return (
                          <tr key={c.uuid} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                            {/* IP + type badge */}
                            <td className="px-5 py-3 whitespace-nowrap">
                              <div className="font-mono text-slate-300">{c.ip ?? '—'}</div>
                              {c.ip_type && (
                                <span className="mt-0.5 inline-block px-1.5 py-px rounded text-xs font-mono bg-slate-800 text-slate-500 uppercase">{c.ip_type}</span>
                              )}
                            </td>

                            {/* Protocol */}
                            <td className="px-3 py-3">
                              {c.protocol ? (
                                <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 uppercase">{c.protocol}</span>
                              ) : <span className="text-slate-600">—</span>}
                            </td>

                            {/* Location */}
                            <td className="px-3 py-3 min-w-[160px]">
                              {location ? (
                                <div>
                                  <div className="text-slate-300">{location}</div>
                                  <div className="text-slate-600 text-xs mt-0.5 flex items-center gap-1.5">
                                    {c.continent && <span>{c.continent}</span>}
                                    {c.country_code && <span className="px-1 py-px rounded bg-slate-800 font-mono uppercase">{c.country_code}</span>}
                                    {c.postal && <span>{c.postal}</span>}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>

                            {/* ISP / Org */}
                            <td className="px-3 py-3 min-w-[180px]">
                              {c.isp || c.org || c.domain ? (
                                <div>
                                  {c.isp && <div className="text-slate-300 truncate max-w-[200px]" title={c.isp}>{c.isp}</div>}
                                  {c.org && c.org !== c.isp && (
                                    <div className="text-slate-500 text-xs truncate max-w-[200px]" title={c.org}>{c.org}</div>
                                  )}
                                  {c.domain && <div className="text-slate-600 text-xs font-mono">{c.domain}</div>}
                                </div>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>

                            {/* Opened */}
                            <td className="px-3 py-3 text-slate-400 whitespace-nowrap">{fmtEpoch(c.opened_at)}</td>

                            {/* Duration / Status */}
                            <td className="px-3 py-3 whitespace-nowrap">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                  Active
                                </span>
                              ) : (
                                <span className="text-slate-500">{fmtSessionDur(c.opened_at, c.closed_at)}</span>
                              )}
                            </td>

                            {/* User Agent */}
                            <td className="px-3 py-3 text-slate-500 max-w-[200px] truncate" title={c.user_agent ?? ''}>
                              {c.user_agent ?? '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm text-slate-300 font-medium text-right truncate">{value ?? '—'}</span>
    </div>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      <Icon size={14} className="text-cyan-400 shrink-0" />
      <span className="text-sm text-cyan-400 font-semibold uppercase tracking-wide">{label}</span>
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
            src={resolveImageUrl(channel.thumbnail_url)}
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
            {/* <span>PREMIUM</span> */}
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

function ClassicMenuButton({ onClick }: { onClick: () => void }) {
    const { focusProps, isFocused } = useTVFocus({
        onEnter: onClick,
        className: "p-2 rounded-lg transition-all duration-200 flex items-center gap-2 group",
        focusClassName: "bg-primary text-white scale-105 shadow-lg shadow-primary/20"
    });

    return (
        <button
            {...focusProps}
            className={`${focusProps.className} ${isFocused ? 'ring-2 ring-primary bg-primary/20 scale-110' : 'bg-slate-900 border border-slate-700/50 hover:border-primary/50 text-slate-400 hover:text-white'}`}
        >
            <Menu size={20} className={isFocused ? 'animate-pulse' : ''} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Menu</span>
        </button>
    );
}

function RatingStar({ star, currentRating, onRate }: { star: number; currentRating: number; onRate: (val: number) => void }) {
    const { focusProps, isFocused } = useTVFocus({
        onEnter: () => onRate(star),
        className: "transition-transform focus:outline-none p-0.5"
    });

    return (
        <button
            {...focusProps}
            className={`${focusProps.className} ${isFocused ? 'scale-150' : ''}`}
        >
            <Star 
                size={12} 
                fill={star <= currentRating ? "currentColor" : "none"}
                className={`transition-colors ${isFocused ? 'text-white' : (star <= currentRating ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400')}`} 
            />
        </button>
    );
}

function ClassicBackButton() {
    const router = useRouter(); 
    
    const { focusProps, isFocused } = useTVFocus({
        onEnter: () => router.push('/'),
        className: "p-2 rounded-lg transition-all duration-200 flex items-center gap-2 group",
        focusClassName: "bg-primary text-white scale-105 shadow-lg shadow-primary/20"
    });

    return (
        <button
            {...focusProps}
            onClick={() => router.push('/')}
            className={`${focusProps.className} ${isFocused ? 'ring-2 ring-primary bg-primary/20 scale-110' : 'bg-slate-900 border border-slate-700/50 hover:border-primary/50 text-slate-400 hover:text-white'}`}
        >
            <ArrowLeft size={20} className={isFocused ? 'animate-pulse' : ''} />
             <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Back</span>
        </button>
    );
}
