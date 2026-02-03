'use client';

import React, { useEffect, useState } from 'react';
import adminApi from '@/lib/adminApi';
import { 
    X, Tv, Globe, MapPin, Layers, Monitor, Activity, 
    Link as LinkIcon, Image as ImageIcon, BarChart, 
    DollarSign, PlayCircle, Copy, Check 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ChannelDetailsModalProps {
  uuid: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ChannelDetails {
  id: number;
  uuid: string;
  name: string;
  channel_number: number | string;
  hls_url: string;
  thumbnail_url: string;
  logo_url: string;
  
  // Location
  village?: string;
  district_id: number;
  state_id: number;
  language_id: number;
  category_id: number;
  
  // Status & Flags
  status: string;
  is_premium: number | boolean;
  is_featured: number | boolean;
  is_ad_enabled: number | boolean;
  
  // Stats
  calculated_views_count: string | number;
  average_rating: number;
  viewers_count: number;
  viewers_count_formatted: string;
  
  // System
  allowed_platforms: string;
  expiry_at?: string;
  created_at: string;
  user_agent?: string;
  referer?: string;

  // Relations
  state?: { name: string; code?: string };
  district?: { name: string; code?: string };
  language?: { name: string; code?: string };
  category?: { name: string };
}

export default function ChannelDetailsModal({ uuid, isOpen, onClose }: ChannelDetailsModalProps) {
  const [channel, setChannel] = useState<ChannelDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && uuid) {
      const fetchChannel = async () => {
        setLoading(true);
        try {
          const res = await adminApi.get(`/admin/channels/${uuid}`);
          setChannel(res.data.data);
        } catch (error: any) {
          console.error(error);
          toast.error('Failed to load channel details');
          onClose();
        } finally {
          setLoading(false);
        }
      };

      fetchChannel();
    } else {
        setChannel(null);
    }
  }, [isOpen, uuid, onClose]);

  if (!isOpen) return null;

  const isTrue = (val: number | boolean | undefined) => !!val;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatNumber = (num: string | number | undefined) => {
      if (!num) return '0';
      const n = Number(num);
      if (isNaN(n)) return num;
      return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(n);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] rounded-2xl w-full max-w-5xl border border-slate-800 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Tv className="text-primary" size={24} />
              </div>
              <div>
                  <h2 className="text-lg font-bold text-white leading-none">Channel Details</h2>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{uuid}</p>
              </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              <p className="text-slate-500 text-sm animate-pulse">Loading channel info...</p>
            </div>
          ) : channel ? (
            <div className="flex flex-col">
              
              {/* Hero Section */}
              <div className="p-6 lg:p-8 grid lg:grid-cols-[340px_1fr] gap-8 border-b border-slate-800/60 bg-slate-900/20">
                  {/* Thumbnail & Logo */}
                  <div className="flex flex-col gap-4">
                      <div className="relative group rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-950 aspect-video">
                          {channel.thumbnail_url ? (
                              <img 
                                  src={channel.thumbnail_url} 
                                  alt={channel.name} 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                          ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                                  <ImageIcon size={40} />
                                  <span className="text-xs font-medium uppercase tracking-wider">No Thumbnail</span>
                              </div>
                          )}
                          
                          {/* Channel Number Badge */}
                          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-white px-3 py-1 rounded-md text-xs font-bold border border-white/10 shadow-lg">
                              CH {channel.channel_number}
                          </div>
                      </div>

                      <div className="flex items-center gap-4 px-1">
                           {channel.logo_url && (
                              <div className="w-16 h-16 bg-slate-900 rounded-xl p-2 border border-slate-800 shadow-lg shrink-0">
                                  <img src={channel.logo_url} alt="Logo" className="w-full h-full object-contain" />
                              </div>
                           )}
                           <div className="flex-1 min-w-0">
                                <h1 className="text-2xl font-bold text-white truncate" title={channel.name}>{channel.name}</h1>
                                <div className="flex flex-wrap gap-2 mt-2">
                                     <StatusBadge status={channel.status} />
                                     {isTrue(channel.is_premium) && <Badge icon={DollarSign} label="Premium" color="purple" />}
                                     {isTrue(channel.is_featured) && <Badge icon={Activity} label="Featured" color="yellow" />}
                                     {isTrue(channel.is_ad_enabled) && <Badge icon={PlayCircle} label="Ads" color="blue" />}
                                </div>
                           </div>
                      </div>
                  </div>

                  {/* Quick Stats & Primary Info */}
                  <div className="flex flex-col gap-6 justify-center">
                       {/* Stats Cards */}
                       <div className="grid grid-cols-3 gap-4">
                           <StatCard 
                                label="Total Views" 
                                value={formatNumber(channel.calculated_views_count)} 
                                subValue={channel.calculated_views_count?.toString()}
                                icon={BarChart} 
                            />
                           <StatCard 
                                label="Live Viewers" 
                                value={channel.viewers_count_formatted || '0'} 
                                subValue={(channel.viewers_count || 0) + ' active'}
                                icon={Activity} 
                                color="emerald"
                            />
                           <StatCard 
                                label="Rating" 
                                value={channel.average_rating || '0.0'} 
                                icon={Check} 
                                color="yellow" 
                                isRating
                            />
                       </div>

                       {/* Context Info */}
                       <div className="grid sm:grid-cols-2 gap-4 bg-slate-800/30 p-5 rounded-2xl border border-slate-700/30">
                           <DetailItem icon={Layers} label="Category" value={channel.category?.name} />
                           <DetailItem icon={Globe} label="Language" value={channel.language?.name} />
                           <DetailItem icon={MapPin} label="State" value={channel.state?.name} />
                           <DetailItem icon={MapPin} label="District" value={channel.district?.name} />
                           {channel.village && <DetailItem icon={MapPin} label="Village" value={channel.village} />}
                       </div>
                  </div>
              </div>

              {/* Advanced Details Grid */}
              <div className="p-6 lg:p-8 grid md:grid-cols-2 gap-8">
                  
                  {/* Column 1: Stream Details */}
                  <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <LinkIcon size={14} /> Stream Configuration
                      </h3>
                      
                      <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                          <div className="p-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-400">HLS Stream URL</span>
                              <CopyButton text={channel.hls_url} onCopy={() => handleCopy(channel.hls_url, 'Stream URL')} />
                          </div>
                          <div className="p-3 bg-slate-950 font-mono text-xs text-green-400 break-all leading-relaxed select-all">
                              {channel.hls_url}
                          </div>
                      </div>

                      <div className="grid gap-3">
                          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                             <div className="flex justify-between items-center mb-1">
                                 <span className="text-xs text-slate-500">User Agent</span>
                                 {channel.user_agent && <CopyButton text={channel.user_agent} onCopy={() => handleCopy(channel.user_agent!, 'User Agent')} size={12} />}
                             </div>
                             <div className="font-mono text-xs text-slate-300 truncate" title={channel.user_agent}>{channel.user_agent || 'N/A'}</div>
                          </div>
                          
                          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                             <div className="flex justify-between items-center mb-1">
                                 <span className="text-xs text-slate-500">Referer</span>
                                 {channel.referer && <CopyButton text={channel.referer} onCopy={() => handleCopy(channel.referer!, 'Referer')} size={12} />}
                             </div>
                             <div className="font-mono text-xs text-slate-300 truncate" title={channel.referer}>{channel.referer || 'N/A'}</div>
                          </div>
                      </div>
                  </div>

                  {/* Column 2: System Info */}
                  <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Monitor size={14} /> System Information
                      </h3>

                      <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-5 space-y-4">
                           <div>
                                <label className="text-xs text-slate-500 block mb-2 font-medium">Platform Access</label>
                                <div className="flex flex-wrap gap-2">
                                    {channel.allowed_platforms.split(',').map(p => (
                                        <span key={p} className="px-2.5 py-1 bg-slate-700/50 text-slate-300 text-xs font-semibold rounded-md border border-slate-600/50 uppercase">
                                            {p.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/30">
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Database ID</label>
                                    <span className="font-mono text-sm text-slate-300">{channel.id}</span>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">UUID</label>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-slate-300 truncate max-w-[120px]" title={channel.uuid}>{channel.uuid}</span>
                                        <CopyButton text={channel.uuid} onCopy={() => handleCopy(channel.uuid, 'UUID')} size={12} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Created At</label>
                                    <span className="text-sm text-slate-300">{new Date(channel.created_at).toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Expiry Date</label>
                                    <span className={`text-sm font-medium ${channel.expiry_at ? 'text-yellow-400' : 'text-slate-400'}`}>
                                        {channel.expiry_at ? new Date(channel.expiry_at).toLocaleDateString() : 'Never'}
                                    </span>
                                </div>
                            </div>
                      </div>
                  </div>

              </div>

            </div>
          ) : (
            <div className="text-center text-slate-400 py-20">Channel details not found</div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
            <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium border border-slate-700 text-sm"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function StatCard({ label, value, subValue, icon: Icon, color = 'primary', isRating = false }: any) {
    const colorClasses: any = {
        primary: 'text-primary bg-primary/10 border-primary/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    };
    const activeColor = colorClasses[color] || colorClasses.primary;

    return (
        <div className={`p-4 rounded-xl border ${activeColor} flex flex-col gap-1 items-center md:items-start text-center md:text-left transition-all hover:scale-[1.02]`}>
            <div className="flex items-center gap-2 text-xs font-medium opacity-80 mb-1">
                <Icon size={14} /> {label}
            </div>
            <div className="text-2xl font-bold leading-none tracking-tight flex items-baseline gap-1">
                {value} {isRating && <span className="text-sm opacity-60">/ 5</span>}
            </div>
            {subValue && <div className="text-[10px] opacity-60 font-mono mt-1">{subValue}</div>}
        </div>
    );
}

function DetailItem({ icon: Icon, label, value }: { icon: any, label: string, value: any }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 text-slate-500">
                <Icon size={16} />
            </div>
            <div>
                <span className="text-xs text-slate-500 block">{label}</span>
                <span className="text-sm font-medium text-slate-200">{value}</span>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const isActive = status === 'active';
    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wide ${
            isActive 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
            {status}
        </div>
    );
}

function Badge({ icon: Icon, label, color }: any) {
    const colors: any = {
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };
    return (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${colors[color]}`}>
            <Icon size={10} /> {label}
        </div>
    );
}

function CopyButton({ text, onCopy, size = 14 }: { text: string, onCopy: () => void, size?: number }) {
    const [copied, setCopied] = useState(false);
    
    const handleClick = () => {
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button 
            onClick={handleClick}
            className="p-1.5 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
            title="Copy to clipboard"
            type="button"
        >
            {copied ? <Check size={size} className="text-emerald-400" /> : <Copy size={size} />}
        </button>
    );
}
