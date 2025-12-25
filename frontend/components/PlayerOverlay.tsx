import React, { useEffect, useRef, useState } from 'react';
import { Channel } from '@/types';
import { 
    ChevronLeft, ChevronRight, Tv, Eye, 
    Play, Pause, Volume2, VolumeX, SkipBack, SkipForward,
    TrendingUp, List, X, Search, Radio, Maximize, Minimize, Star
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
  onToggleFullscreen
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'trending'>('list');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const formatViewers = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  // Auto-close sidebar when minimizing (exiting fullscreen)
  useEffect(() => {
    if (!isFullscreen) {
        setSidebarOpen(false);
    }
  }, [isFullscreen]);

  const activeList = activeTab === 'list' ? channels : topTrending;

  // Reset index on group change
  useEffect(() => setSelectedIndex(0), [currentGroup]);

  // Keyboard Navigation
  useEffect(() => {
    if (!visible && !sidebarOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
                    setSelectedIndex(prev => Math.min(activeList.length - 1, prev + 1));
                }
                break;
             case 'Enter':
                 if (sidebarOpen && activeList[selectedIndex]) {
                     e.preventDefault(); e.stopPropagation();
                     onSelect(activeList[selectedIndex]);
                     // Optional: setSidebarOpen(false);
                 } else if (!sidebarOpen) {
                     // Maybe toggle play/pause or open menu?
                     // onPlayPause();
                 }
                 break;
            case 'ArrowLeft':
                if (sidebarOpen && activeTab === 'list') {
                     e.preventDefault(); e.stopPropagation();
                     onPrevGroup();
                } else if (!sidebarOpen) {
                     e.preventDefault(); e.stopPropagation();
                     onPrevChannel();
                }
                break;
            case 'ArrowRight':
                if (sidebarOpen && activeTab === 'list') {
                    e.preventDefault(); e.stopPropagation();
                    onNextGroup();
                } else if (!sidebarOpen) {
                    e.preventDefault(); e.stopPropagation();
                    onNextChannel();
                }
                break;
             case 'Escape':
                if (sidebarOpen) setSidebarOpen(false);
                else onClose();
                break;
             case ' ': // Spacebar
                e.preventDefault(); e.stopPropagation();
                onPlayPause();
                break;
             case 'm':
                if (onToggleMute) onToggleMute();
                break;
        }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [visible, sidebarOpen, activeList, selectedIndex, onSelect, onNextGroup, onPrevGroup, onClose, activeTab, onPlayPause, onToggleMute, onNextChannel, onPrevChannel]);

  // Scroll Sync
  useEffect(() => {
    if (sidebarOpen && listRef.current) {
        const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
        if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, sidebarOpen]);

  
  // UI Visibility Logic
  const showUI = visible || sidebarOpen;
  const showSidebar = (isFullscreen && visible) || sidebarOpen;

  return (
    <div className="absolute inset-0 z-50 font-sans text-white transition-all duration-300 pointer-events-none">
        
        {/* --- BACKDROP (Darkens video when internal UI (Sidebar) is active & manually pinned) --- */}
        <div 
            className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
            onClick={() => setSidebarOpen(false)}
        />

        {/* --- SIDEBAR DRAWER (Floating Glass Panel) --- */}
        <div 
            className={`absolute left-0 sm:left-4 top-0 sm:top-4 bottom-0 w-[85vw] sm:w-64 md:w-80 max-w-[400px] bg-black/80 md:bg-black/60 backdrop-blur-2xl border-r sm:border border-white/10 sm:rounded-3xl sm:rounded-b-none sm:border-b-0 flex flex-col shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-40 pointer-events-auto ${showSidebar ? 'translate-x-0 opacity-100' : '-translate-x-full sm:-translate-x-[120%] opacity-0'}`}
            onClick={(e) => e.stopPropagation()}
        >
             {/* Drawer Header */}
             <div className="h-12 sm:h-16 flex items-center px-4 sm:px-6 border-b border-white/5 shrink-0">
                 <Radio className="text-primary mr-3" size={18} />
                 <h2 className="font-bold text-sm sm:text-base tracking-wider text-white/90">CHANNELS</h2>
             </div>

             {/* Tabs */}
             <div className="flex p-2 gap-2 border-b border-white/5 shrink-0">
                <button 
                    onClick={() => setActiveTab('list')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                    ALL LIST
                </button>
                <button 
                    onClick={() => setActiveTab('trending')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'trending' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                    TRENDING
                </button>
            </div>

            {/* Group Navigation */}
            {activeTab === 'list' && (
                <div className="flex items-center justify-between p-2 mx-2 mt-2 bg-white/5 rounded-xl border border-white/5 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); onPrevGroup(); }} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><ChevronLeft size={16}/></button>
                    <span className="text-xs font-bold text-slate-300 truncate px-2">{currentGroup || 'All Channels'}</span>
                    <button onClick={(e) => { e.stopPropagation(); onNextGroup(); }} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><ChevronRight size={16}/></button>
                </div>
            )}

            {/* List */}
             <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-hide p-2 pointer-events-auto pb-32">
                 {activeList.map((channel, idx) => (
                    <div 
                        key={channel.uuid}
                        className={`group flex items-center gap-3 p-3 mb-1 rounded-xl cursor-pointer transition-all border border-transparent ${
                            idx === selectedIndex 
                            ? 'bg-primary/20 border-primary/30 shadow-inner' 
                            : 'hover:bg-white/5 hover:border-white/5'
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIndex(idx);
                            onSelect(channel);
                            if (window.innerWidth < 768) setSidebarOpen(false);
                        }}
                    >
                         {/* Thumbnail */}
                         <div className="w-9 h-9 rounded-lg bg-black/40 flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-white/20 transition-colors">
                             {channel.thumbnail_url ? (
                                 <img src={channel.thumbnail_url} className="w-full h-full object-contain p-0.5" alt={channel.name} />
                             ) : (
                                 <Tv size={14} className="text-slate-600" />
                             )}
                         </div>
                         
                         {/* Text */}
                         <div className="flex-1 min-w-0">
                             <h4 className={`text-sm font-bold truncate ${idx === selectedIndex ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                 {channel.name}
                             </h4>
                             <div className="flex items-center gap-2 mt-0.5 overflow-hidden w-full">
                                 <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-1 rounded shrink-0">CH {channel.channel_number}</span>
                                 {/* Star Rating */}
                                 <div className="flex items-center gap-1 text-[10px] text-amber-500 bg-amber-500/10 px-1 rounded shrink-0">
                                     <Star size={8} fill="currentColor" />
                                     <span className="font-bold">{channel.average_rating ? channel.average_rating.toFixed(1) : '0.0'}</span>
                                 </div>
                                 
                                 {/* Language */}
                                 {channel.language?.name && (
                                     <span className="text-[10px] text-slate-500 truncate border-l border-white/10 pl-2 shrink-0 max-w-[60px]">{channel.language.name}</span>
                                 )}
                                 
                                  {/* Category */}
                                 {channel.category?.name && (
                                     <span className="text-[10px] text-slate-500 truncate border-l border-white/10 pl-2 opacity-70">{channel.category.name}</span>
                                 )}
                             </div>
                         </div>

                         {/* Active Indicator */}
                         {currentChannel?.uuid === channel.uuid && (
                             <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                         )}
                    </div>
                ))}
            </div>
        </div>

        {/* --- BOTTOM CONTROL BAR (Dock Style) --- */}
        <div className={`absolute bottom-0 left-0 right-0 transition-transform duration-300 z-50 pointer-events-auto ${showUI ? 'translate-y-0' : 'translate-y-full'}`}>
            
             {/* Gradient Shade */}
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent h-32 -z-10 bottom-0 pointer-events-none" />

             <div className="container mx-auto max-w-5xl px-3 md:px-8 pb-3 md:pb-6 pt-8 md:pt-10 flex items-end justify-between gap-2 md:gap-4 relative">
                 
                 {/* LEFT: Menu / Channel Info */}
                 <div className="flex-1 flex items-center justify-start gap-2 md:gap-4 min-w-0">
                     <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            // Toggle Sidebar Menu
                            setSidebarOpen(prev => !prev);
                        }}
                        className={`flex items-center gap-2 px-2 py-1.5 md:px-4 md:py-2.5 rounded-full backdrop-blur-md border transition-all group shrink-0 ${
                            sidebarOpen 
                            ? 'bg-white text-black border-white' 
                            : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                        }`}
                    >
                         {sidebarOpen ? <X className="w-4 h-4 md:w-5 md:h-5" /> : <List className="w-4 h-4 md:w-5 md:h-5" />}
                        <span className="hidden md:inline font-bold text-sm tracking-wide">
                            {!isFullscreen ? '' : ' '}
                        </span>
                     </button>

                     {/* Channel Info (Bottom) - Fills the gap */}
                     {currentChannel && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500 min-w-0 overflow-hidden">
                             <div className="hidden sm:block w-12 h-12 bg-white/5 rounded-lg border border-white/10 p-1 backdrop-blur-sm shrink-0">
                                 {currentChannel.thumbnail_url ? (
                                     <img src={currentChannel.thumbnail_url} className="w-full h-full object-contain" alt="" />
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
                                     
                                     {currentChannel.language?.name && (
                                         <span className="truncate text-slate-400 border-l border-white/10 pl-2 hidden sm:inline">{currentChannel.language.name}</span>
                                     )}
                                     
                                     {currentChannel.category?.name && (
                                         <span className="truncate text-slate-400 border-l border-white/10 pl-2 hidden sm:inline">{currentChannel.category.name}</span>
                                     )}
                                     
                                     <span className="w-1 h-1 rounded-full bg-white/20 shrink-0 hidden sm:block" />
                                     <div className="flex items-center gap-1.5 text-slate-300 bg-black/20 px-1.5 py-0.5 rounded-md border border-white/5 shrink-0">
                                         <Eye size={10} className="md:w-3 md:h-3" />
                                         <span className="font-mono font-bold text-[10px] md:text-xs">{formatViewers(viewersCount || 0)}</span>
                                     </div>
                                 </div>
                             </div>
                        </div>
                     )}
                 </div>

                 {/* CENTER: Playback Controls (Absolutely Centered) */}
                 <div className="absolute left-1/2 -translate-x-1/2 bottom-4 md:bottom-6 flex items-center gap-4 md:gap-6">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onPrevChannel(); }}
                        className="text-slate-400 hover:text-white hover:scale-110 transition-all active:scale-95 p-2"
                        title="Previous Channel"
                      >
                          <SkipBack className="w-5 h-5 md:w-6 md:h-6" />
                      </button>

                      <button 
                        onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
                        className="text-white hover:scale-110 active:scale-95 transition-all drop-shadow-lg p-2"
                      >
                          {isPlaying ? (
                              <Pause className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" />
                          ) : (
                              <Play className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" />
                          )}
                      </button>

                      <button 
                        onClick={(e) => { e.stopPropagation(); onNextChannel(); }}
                        className="text-slate-400 hover:text-white hover:scale-110 transition-all active:scale-95 p-2"
                        title="Next Channel"
                      >
                          <SkipForward className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                 </div>

                 {/* RIGHT: Volume & Tools */}
                 <div className="flex-1 flex justify-end items-center gap-4">
                      {onToggleMute && (
                          <button 
                            onClick={onToggleMute} 
                            className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-500' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                        >
                            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                          </button>
                      )}
                      
                      <div className="hidden md:block w-28 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer group relative">
                          <div className="absolute inset-0 bg-primary w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-75" style={{ transform: `scaleX(${volume})` }} />
                          <div className="absolute inset-0 bg-white w-full origin-left" style={{ transform: `scaleX(${volume})` }} /> {/* White bar for visibility */}
                          <input 
                            type="range" min="0" max="1" step="0.05" value={volume}
                            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                      </div>
                      
                      {/* Fullscreen Toggle */}
                       {onToggleFullscreen && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onToggleFullscreen(); }}
                            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            title="Toggle Fullscreen"
                          >
                              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                          </button>
                      )}
                 </div>
             </div>
        </div>

    </div>
  );
}