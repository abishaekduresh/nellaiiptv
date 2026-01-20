import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Channel } from '@/types';
import { useTVFocus } from '@/hooks/useTVFocus';
import { useBranding } from '@/hooks/useBranding';

import {
    ChevronLeft, ChevronRight, Tv, Eye,
    Play, Pause, Volume2, VolumeX, SkipBack, SkipForward,
    List, X, Radio, Maximize, Minimize, Star, Settings, Check,
    Layers, Globe, Grid, Search,
    PictureInPicture, Cast, MonitorPlay // New Icons
} from 'lucide-react';

interface Props {
  visible: boolean;
  channels: Channel[];
  topTrending?: Channel[];
  currentGroup: string;
  onSelect: (channel: Channel) => void;
  onNextGroup: () => void;
  onPrevGroup: () => void;
  onClose: () => void;

  // Player State
  isPlaying: boolean;
  isMuted?: boolean;
  volume: number;
  onPlayPause: () => void;
  onToggleMute?: () => void;
  onVolumeChange: (vol: number) => void;
  onNextChannel: () => void;
  onPrevChannel: () => void;
  currentChannel: Channel | null;
  viewersCount: number;

  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;

  // Quality
  qualities?: { index: number; label: string }[];
  currentQuality?: number;
  onQualityChange?: (index: number) => void;

  // new grouping props
  groupedChannels?: { [key: string]: Channel[] };
  groupKeys?: string[];
  currentGroupType?: 'all' | 'language' | 'category';
  onGroupTypeChange?: (type: 'all' | 'language' | 'category') => void;
  onGroupSelect?: (group: string) => void;

  // New Features
  onTogglePiP?: () => void;
  isPiP?: boolean;
  onAirPlay?: () => void;
}

  // Helper for TV Focusable Buttons
  function TVButton({ onClick, className, children, title, ...props }: any) {
      const { focusProps, isFocused } = useTVFocus({
          onEnter: onClick,
          className: className,
          focusClassName: 'ring-4 ring-white z-50 scale-110 bg-white/20'
      });
      return (
          <button
            onClick={onClick}
            {...props}
            {...focusProps}
            className={`${className} ${isFocused ? 'ring-4 ring-white z-50 scale-110 bg-white/20' : ''}`}
            title={title}
          >
              {children}
          </button>
      );
  }

export default function PlayerOverlay({
  visible,
  channels,
  topTrending = [],
  currentGroup,
  onSelect,
  onNextGroup,
  onPrevGroup,
  onClose,
  isPlaying,
  isMuted = false,
  volume,
  onPlayPause,
  onToggleMute,
  onVolumeChange,
  onNextChannel,
  onPrevChannel,
  currentChannel,
  viewersCount,
  isFullscreen = false,
  onToggleFullscreen,
  qualities = [],
  currentQuality = -1,
  onQualityChange,
  groupedChannels,
  groupKeys,
  currentGroupType = 'all',
  onGroupTypeChange,
  onGroupSelect,
  onTogglePiP,
  isPiP,
  onAirPlay
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'list' | 'trending'>('list');
  // 'root' = showing list of groups (Language list), 'channels' = showing channels in selected group
  const [menuView, setMenuView] = useState<'root' | 'channels'>('channels'); 
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);



  // Auto-close sidebar when minimizing
  useEffect(() => {
    if (!isFullscreen) {
        setSidebarOpen(false);
    }
  }, [isFullscreen]);

  // Determine what list to show
  // If activeTab is 'trending', always show trending channels.
  // If activeTab is 'list':
  //    If currentGroupType is 'all', show 'channels' directly.
  //    If currentGroupType is 'language'/'category':
  //         If menuView is 'root', show list of groups.
  //         If menuView is 'channels', show channels in currentGroup.

  const isRootView = activeTab === 'list' && currentGroupType !== 'all' && menuView === 'root' && !searchQuery;
  
  // List Items
  const listItems = useMemo(() => {
      // 1. Search Logic
      if (searchQuery.trim().length > 0) {
          const query = searchQuery.toLowerCase();
          
          // Flatten all channels for global search
          let sourceChannels: Channel[] = [];
          
          if (groupedChannels) {
              sourceChannels = Object.values(groupedChannels).flat();
              // Remove duplicates if any (though typically API returns unique uuids)
              sourceChannels = Array.from(new Map(sourceChannels.map(c => [c.uuid, c])).values());
          } else {
              sourceChannels = channels;
          }

          return sourceChannels.filter(c => 
              c.name.toLowerCase().includes(query) || 
              (c.channel_number ? c.channel_number.toString().includes(query) : false)
          );
      }

      // 2. Normal Logic
      if (activeTab === 'trending') {
          return [...topTrending].sort((a, b) => (b.viewers_count || 0) - (a.viewers_count || 0));
      }
      if (isRootView && groupKeys) {
          // Return list of groups as pseudo-channels or just strings
          return groupKeys; 
      }
      return channels;
  }, [activeTab, isRootView, topTrending, groupKeys, channels, searchQuery, groupedChannels]);

  // Handle Selection
  const handleItemSelect = (item: any, index: number) => {
      if (searchQuery.trim().length > 0) {
          // Selecting a search result (Channel)
          onSelect(item as Channel);
          if (window.innerWidth < 768) setSidebarOpen(false);
          // Optional: Clear search on select?
          // setSearchQuery(''); 
      } else if (activeTab === 'trending') {
          onSelect(item as Channel);
          if (window.innerWidth < 768) setSidebarOpen(false);
      } else if (isRootView) {
          // User selected a group
          if (onGroupSelect) onGroupSelect(item as string);
          setMenuView('channels');
          setSelectedIndex(0); // Reset for channel list
      } else {
          // User selected a channel
          onSelect(item as Channel);
          if (window.innerWidth < 768) setSidebarOpen(false);
      }
  };

  // Handle Back (Left Arrow or Back Button) in Menu
  const handleBack = () => {
      if (searchQuery) {
          setSearchQuery('');
          setSelectedIndex(0);
          return;
      }

      if (activeTab === 'list' && currentGroupType !== 'all' && menuView === 'channels') {
          setMenuView('root');
          setSelectedIndex(0);
      } else {
          setSidebarOpen(false);
      }
  };

  // Reset index on tab change
  useEffect(() => {
      setSelectedIndex(0);
      if (activeTab === 'list' && currentGroupType !== 'all') {
          // When switching to list tab, maybe go to root?
          // Let's stay where we were unless logic demands otherwise.
      }
  }, [activeTab]);

  // Reset to root if group type changes
  useEffect(() => {
      if (currentGroupType !== 'all') {
         setMenuView('root');
      } else {
         setMenuView('channels');
      }
      setSelectedIndex(0);
      setSearchQuery(''); // Clear search on type change
  }, [currentGroupType]);


  // Keyboard Navigation
  useEffect(() => {
    if (!visible && !sidebarOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore navigation keys if input is focused, except for Enter/Escape/Down/Up maybe?
        // Actually, if input is focused, we probably want normal input behavior.
        if (document.activeElement?.tagName === 'INPUT') {
            if (e.key === 'Escape') {
                (document.activeElement as HTMLElement).blur();
                setSidebarOpen(false);
            }
            if (e.key === 'ArrowDown') {
                 // Move focus to list?
                 e.preventDefault();
                 (document.activeElement as HTMLElement).blur();
                 setSelectedIndex(0);
                 // We need to focus the list container or body to capture keys again?
                 // The window listener keeps capturing, so just blurring is enough.
            }
            return; 
        }

        switch (e.key) {
            case 'ArrowUp':
                if (sidebarOpen) {
                    e.preventDefault(); e.stopPropagation();
                    setSelectedIndex(prev => Math.max(0, prev - 1));
                }
                break;
            case 'ArrowDown':
                if (sidebarOpen) {
                    e.preventDefault(); e.stopPropagation();
                    setSelectedIndex(prev => Math.min(listItems.length - 1, prev + 1));
                }
                break;
             case 'Enter':
                 if (sidebarOpen && listItems[selectedIndex]) {
                     e.preventDefault(); e.stopPropagation();
                     handleItemSelect(listItems[selectedIndex], selectedIndex);
                 }
                 break;
            case 'ArrowLeft':
                if (sidebarOpen) {
                     e.preventDefault(); e.stopPropagation();
                     handleBack();
                }
                break;
            case 'ArrowRight':
                // Maybe drill down if on a group?
                if (sidebarOpen && isRootView && listItems[selectedIndex]) {
                    e.preventDefault(); e.stopPropagation();
                    handleItemSelect(listItems[selectedIndex], selectedIndex);
                }
                break;
             case 'Escape':
                if (sidebarOpen) handleBack();
                else onClose();
                break;
             case ' ': // Spacebar
                e.preventDefault(); e.stopPropagation();
                onPlayPause();
                break;
             case 'm':
                if (onToggleMute) onToggleMute();
                break;
             case 's':
                 setShowSettings(prev => !prev);
                 break;
        }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [visible, sidebarOpen, listItems, selectedIndex, activeTab, isRootView, onPlayPause, onToggleMute, searchQuery]); // Added searchQuery to deps to rest listener if needed

  // Scroll Sync
  useEffect(() => {
    if (sidebarOpen && listRef.current) {
        const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
        if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, sidebarOpen]);


  // UI Visibility Logic
  // Optimize: Only render heavy sidebar content if explicitly open
  const showSidebar = sidebarOpen;

  return (
    <div className="absolute inset-0 z-50 font-sans text-white transition-all duration-300 pointer-events-none">

        {/* --- BACKDROP --- */}
        <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setSidebarOpen(false)}
        />

         {/* --- SIDEBAR DRAWER --- */}
        <div
            className={`fixed sm:absolute left-0 top-0 bottom-0 w-full sm:w-80 md:w-96 max-w-[90vw] bg-slate-950/95 sm:bg-black/80 backdrop-blur-2xl sm:border-r border-white/10 sm:rounded-r-2xl shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-[60] pointer-events-auto flex flex-col ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}
            onClick={(e) => e.stopPropagation()}
        >
             {/* Header */}
             <div className="flex flex-col shrink-0 border-b border-white/5 bg-black/20">
                 <div className="h-14 flex items-center px-4 justify-between">
                     <div className="flex items-center gap-2">
                        <Radio className="text-primary" size={20} />
                        <h2 className="font-bold text-lg tracking-wide text-white">CHANNELS</h2>
                     </div>
                     <button onClick={() => setSidebarOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-white"><X size={20}/></button>
                 </div>
                 
                 {/* Search Input */}
                 <div className="px-4 pb-3">
                     <div className="relative group">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={16} />
                         <input 
                            type="text" 
                            placeholder="Search channel..." 
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setSelectedIndex(0); // Reset selection on search
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:bg-white/10 focus:border-white/30 transition-all"
                         />
                         {searchQuery && (
                             <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                             >
                                 <X size={14} />
                             </button>
                         )}
                     </div>
                 </div>

                 {/* Main Tabs */}
                 {!searchQuery && (
                 <div className="flex px-4 pb-3 gap-2">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeTab === 'list' ? 'bg-primary border-primary text-white' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                    >
                        CHANNELS
                    </button>
                    <button
                        onClick={() => setActiveTab('trending')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeTab === 'trending' ? 'bg-amber-600 border-amber-600 text-white' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                    >
                        TRENDING
                    </button>
                </div>
                )}
                
                {/* Group Type Selector (Only in List Tab) */}
                {activeTab === 'list' && onGroupTypeChange && !searchQuery && (
                    <div className="flex items-center gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
                         {[
                            { id: 'all', label: 'All', icon: List },
                            { id: 'language', label: 'Language', icon: Globe },
                            { id: 'category', label: 'Category', icon: Layers },
                         ].map(type => (
                             <button
                                key={type.id}
                                onClick={() => {
                                    if (currentGroupType !== type.id) {
                                        onGroupTypeChange(type.id as any);
                                        // Menu view reset handled by effect
                                    } else if (type.id !== 'all') {
                                        // If clicking active type (lang/cat), go back to root
                                        setMenuView('root');
                                    }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${currentGroupType === type.id ? 'bg-white text-black border-white' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30'}`}
                             >
                                 <type.icon size={12} />
                                 {type.label}
                             </button>
                         ))}
                    </div>
                )}
             </div>

             {/* Sub-Header / Breadcrumb */}
             {activeTab === 'list' && !isRootView && currentGroupType !== 'all' && !searchQuery && (
                 <div className="flex items-center gap-2 px-4 py-2 bg-white/5 text-xs font-bold text-slate-300 border-b border-white/5 shrink-0">
                     <button onClick={() => setMenuView('root')} className="hover:text-white flex items-center gap-1">
                         <ChevronLeft size={14} />
                         Back
                     </button>
                     <span className="text-slate-600">/</span>
                     <span className="text-primary truncate">{currentGroup}</span>
                 </div>
             )}

            {/* Content List */}
             <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-hide p-2 pointer-events-auto pb-32">
                 {/* EMPTY STATE */}
                 {showSidebar && listItems.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                         <Radio size={32} className="opacity-50 mb-2" />
                         <span className="text-sm">No items found</span>
                     </div>
                 )}

                 {/* Render List ONLY if sidebar is open to save DOM nodes */}
                 {showSidebar && listItems.map((item, idx) => {
                     // Check if item is a group key (string) or channel
                     const isGroupItem = typeof item === 'string';
                     const channel = !isGroupItem ? (item as Channel) : null;
                     const groupName = isGroupItem ? (item as string) : null;
                     
                     const isActive = isGroupItem 
                        ? (currentGroup === groupName && !isRootView) // Highlight if this group is active (rarely happens in root view unless we want to mark selected)
                        : (currentChannel?.uuid === channel?.uuid);

                     return (
                        <div
                            key={isGroupItem ? groupName : channel?.uuid}
                            className={`group flex items-center gap-3 p-3 mb-1 rounded-xl cursor-pointer transition-all border border-transparent ${
                                idx === selectedIndex
                                ? 'bg-white/10 border-white/10 shadow-lg'
                                : 'hover:bg-white/5 hover:border-white/5'
                            } ${isActive ? 'bg-primary/20 border-primary/30' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIndex(idx);
                                handleItemSelect(item, idx);
                            }}
                        >
                             {isGroupItem ? (
                                 // GROUP ITEM RENDER
                                 <>
                                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                                        <Layers size={16} />
                                    </div>
                                    <div className="flex-1 font-bold text-sm text-slate-200">{groupName}</div>
                                    <ChevronRight size={16} className="text-slate-500" />
                                 </>
                             ) : (
                                 // CHANNEL ITEM RENDER
                                 <>
                                     <div className="w-9 h-9 rounded-lg bg-black/40 flex items-center justify-center overflow-hidden border border-white/5 shrink-0">
                                         {channel?.logo_url ? (
                                             <img src={channel.logo_url} className="w-full h-full object-contain p-0.5" alt="" />
                                         ) : (
                                             <Tv size={14} className="text-slate-600" />
                                         )}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <h4 className={`text-sm font-bold truncate ${idx === selectedIndex ? 'text-white' : 'text-slate-300'}`}>
                                             {channel?.name}
                                         </h4>
                                         <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                                             <span className="bg-white/5 px-1 rounded">CH {channel?.channel_number}</span>
                                             {channel?.language?.name && <span className="truncate">{channel.language.name}</span>}
                                         </div>
                                     </div>
                                      {/* Active Indicator */}
                                     {currentChannel?.uuid === channel?.uuid && (
                                         <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                                     )}
                                 </>
                             )}
                        </div>
                     );
                 })}
            </div>
        </div>

        {/* --- BOTTOM CONTROL BAR --- */}
        <div className={`absolute bottom-0 left-0 right-0 transition-transform duration-300 z-50 pointer-events-auto ${visible ? 'translate-y-0' : 'translate-y-full'}`}>

             {/* Gradient Shade */}
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent h-32 -z-10 bottom-0 pointer-events-none" />

             {/* 
                HYBRID LAYOUT:
                - Mobile/Tablet (< lg): Flexbox flow. Left, Center, Right share space. No overlap possible.
                - Desktop (lg+): Absolute Center. Left/Right constrained to 35% width to prevent hitting center.
              */}
             <div className="container mx-auto max-w-6xl px-3 md:px-6 pb-3 md:pb-6 pt-4 md:pt-10 flex items-center lg:items-end justify-between gap-2 md:gap-4 relative">

                 {/* LEFT: Menu / Channel Info */}
                 {/* Constrained on Desktop to avoid hitting absolute center */}
                 <div className="flex-1 flex items-center justify-start gap-2 md:gap-4 min-w-0 lg:max-w-[35%]">
                     <TVButton
                        onClick={(e: any) => {
                            e.stopPropagation();
                            setSidebarOpen(prev => !prev);
                        }}
                        className={`flex items-center gap-2 px-2 py-2 md:px-4 md:py-2.5 rounded-full backdrop-blur-md border transition-all group shrink-0 ${
                            sidebarOpen
                            ? 'bg-white text-black border-white'
                            : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                        }`}
                    >
                         <List className="w-5 h-5" />
                        <span className="hidden md:inline font-bold text-sm tracking-wide">
                            CHANNELS
                        </span>
                     </TVButton>

                     {/* Channel Info */}
                     {currentChannel && (
                        <div className="hidden sm:flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500 min-w-0 overflow-hidden">
                             <div className="hidden sm:block w-12 h-12 bg-white/5 rounded-lg border border-white/10 p-1 backdrop-blur-sm shrink-0">
                                 {currentChannel.logo_url ? (
                                     <img src={currentChannel.logo_url} className="w-full h-full object-contain" alt="" />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">CH</div>
                                 )}
                             </div>
                             <div className="min-w-0 flex-1">
                                 <h3 className="font-bold text-white text-xs sm:text-sm md:text-base drop-shadow-md leading-tight truncate px-1">
                                     {currentChannel.name}
                                 </h3>
                                 <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-400 w-full overflow-hidden px-1 mt-0.5">
                                     <span className="bg-white/10 px-1.5 rounded text-slate-300 shrink-0">CH {currentChannel.channel_number}</span>
                                     <span className="flex items-center gap-1">
                                          <Eye size={10} />
                                          {currentChannel.viewers_count_formatted || '0'}
                                      </span>
                                 </div>
                             </div>
                        </div>
                     )}
                 </div>

                 {/* CENTER: Playback Controls */}
                 {/* 
                    < lg: Relative (Part of flex flow)
                    lg+: Absolute (Perfect Center)
                 */}
                 <div className="relative lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:bottom-6 flex items-center gap-3 md:gap-6 shrink-0 order-2 lg:order-none">
                      <TVButton
                        onClick={(e: any) => { e.stopPropagation(); onPrevChannel(); }}
                        className="text-slate-400 hover:text-white hover:scale-110 transition-all active:scale-95 p-2 rounded-full hidden sm:block" 
                      >
                          <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
                      </TVButton>

                      <TVButton
                        onClick={(e: any) => { e.stopPropagation(); onPlayPause(); }}
                        className="text-white hover:scale-110 active:scale-95 transition-all drop-shadow-lg p-2 rounded-full"
                      >
                          {isPlaying ? (
                              <Pause className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" />
                          ) : (
                              <Play className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" />
                          )}
                      </TVButton>

                      <TVButton
                        onClick={(e: any) => { e.stopPropagation(); onNextChannel(); }}
                        className="text-slate-400 hover:text-white hover:scale-110 transition-all active:scale-95 p-2 rounded-full hidden sm:block"
                      >
                          <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
                      </TVButton>
                 </div>

                 {/* RIGHT: Tools */}
                 {/* Constrained on Desktop */}
                 <div className="flex-1 flex justify-end items-center gap-2 md:gap-4 min-w-0 lg:max-w-[35%] order-3 lg:order-none">
                      {onToggleMute && (
                          <TVButton
                            onClick={onToggleMute}
                            className={`p-2 rounded-full transition-colors hidden sm:block ${isMuted ? 'bg-red-500/20 text-red-500' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                        >
                            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                          </TVButton>
                      )}

                      {/* Display PiP and AirPlay buttons here */}
                      {onAirPlay && (
                          <TVButton
                            onClick={(e: any) => { e.stopPropagation(); onAirPlay(); }}
                            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden sm:block"
                            title="AirPlay"
                          >
                            <Cast size={20} />
                          </TVButton>
                      )}
                      
                      {onTogglePiP && (
                          <TVButton
                            onClick={(e: any) => { e.stopPropagation(); onTogglePiP(); }}
                            className={`p-2 rounded-full transition-colors hidden sm:block ${isPiP ? 'bg-white text-black' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                            title="Picture-in-Picture"
                          >
                             <PictureInPicture size={20} />
                          </TVButton>
                      )}

                      {/* Settings */}
                      {onQualityChange && qualities.length > 0 && (
                          <div className="relative">
                              <TVButton
                                onClick={(e: any) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                                className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-white text-black' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                              >
                                  <Settings size={20} className={showSettings ? 'rotate-90 transition-transform' : ''} />
                              </TVButton>

                              {showSettings && (
                                  <div className="absolute bottom-full right-0 mb-3 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                      <div className="max-h-60 overflow-y-auto py-1">
                                          {qualities.map((q) => (
                                              <TVButton
                                                  key={q.index}
                                                  onClick={(e: any) => {
                                                      e.stopPropagation();
                                                      onQualityChange(q.index);
                                                      setShowSettings(false);
                                                  }}
                                                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-white/10 transition-colors rounded-none ${currentQuality === q.index ? 'text-primary font-bold bg-primary/10' : 'text-slate-300'}`}
                                              >
                                                  <span>{q.label}</span>
                                                  {currentQuality === q.index && <Check size={14} />}
                                              </TVButton>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}

                       {/* Fullscreen */}
                        {onToggleFullscreen && (
                           <TVButton
                             onClick={(e: any) => { e.stopPropagation(); onToggleFullscreen(); }}
                             className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                           >
                               {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                           </TVButton>
                       )}
                 </div>
             </div>
        </div>

    </div>
  );
}