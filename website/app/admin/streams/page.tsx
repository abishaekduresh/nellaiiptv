'use client';

import { useEffect, useState } from 'react';
import { Eye, Search, Radio, Wifi, WifiOff, ChevronLeft, ChevronRight, Users, RefreshCw, Activity, Signal } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface Stream {
  uuid: string;
  stream_name: string;
  stream_key: string | null;
  input_url: string | null;
  output_formats: string[] | null;
  health_status: 'online' | 'offline';
  viewer_limit: number;
  current_viewers: number;
  bitrate: number;
  status: string;
  // Flussonic API v3 stats
  inputs_bandwidth: number | null;
  out_bandwidth: number | null;
  online_clients: number | null;
  video_width: number | null;
  video_height: number | null;
  video_codec: string | null;
  fps: number | null;
  audio_codec: string | null;
  audio_bitrate: number | null;
  audio_sample_rate: number | null;
  audio_channels: number | null;
  stream_status: string | null;
  published_via: string | null;
  published_from: string | null;
  client_count: number | null;
  stream_url_type: string | null;
  max_sessions: number | null;
  server: { uuid: string; server_name: string; server_host_ip: string } | null;
}

const HEALTH_CONFIG: Record<string, { label: string; classes: string; Icon: any }> = {
  online:  { label: 'Online',  classes: 'bg-green-500/20 text-green-400', Icon: Wifi },
  offline: { label: 'Offline', classes: 'bg-red-500/20 text-red-400',     Icon: WifiOff },
};

const STREAM_STATUS_CLS: Record<string, string> = {
  running: 'bg-emerald-500/20 text-emerald-400',
  stopped: 'bg-slate-600/30 text-slate-400',
  error:   'bg-red-500/20 text-red-400',
};

const STATUS_CLS: Record<string, string> = {
  active:   'bg-green-500/20 text-green-400',
  inactive: 'bg-gray-500/20 text-gray-400',
  expired:  'bg-orange-500/20 text-orange-400',
  deleted:  'bg-red-900/20 text-red-600',
};

function fmtKbps(kbps: number | null): string {
  if (!kbps) return '—';
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
  return `${kbps} Kbps`;
}

function fmtBps(bps: number | null): string {
  if (!bps) return '—';
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  if (bps >= 1_000)     return `${(bps / 1_000).toFixed(0)} Kbps`;
  return `${bps} bps`;
}

export default function StreamsPage() {
  const [streams, setStreams]         = useState<Stream[]>([]);
  const [loading, setLoading]         = useState(true);
  const [syncing, setSyncing]         = useState(false);
  const [search,  setSearch]          = useState('');
  const [page,    setPage]            = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total,   setTotal]           = useState(0);
  const [filterStatus, setFilterStatus]       = useState('');
  const [filterHealth, setFilterHealth]       = useState('');
  const [filterStreamStatus, setFilterStreamStatus] = useState('');

  const fetchStreams = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/streams', {
        params: {
          page, per_page: 20,
          search: search || undefined,
          status: filterStatus || undefined,
          health_status: filterHealth || undefined,
          stream_status: filterStreamStatus || undefined,
        },
      });
      setStreams(res.data.data.data);
      setTotalPages(res.data.data.last_page);
      setTotal(res.data.data.total);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load streams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [search, filterStatus, filterHealth, filterStreamStatus]);
  useEffect(() => { fetchStreams(); }, [page, search, filterStatus, filterHealth, filterStreamStatus]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await adminApi.post('/admin/streams/sync');
      const { created, updated, deactivated, clients, errors, sampleRaw } = res.data.data;
      if (sampleRaw) console.log('[Sync] Raw stream sample from Flussonic:', JSON.stringify(sampleRaw, null, 2));
      if (errors?.length) {
        errors.forEach((e: string) => toast.error(e, { duration: 8000 }));
      } else {
        toast.success(`Synced — ${created} created, ${updated} updated, ${deactivated} removed, ${clients} clients.`);
      }
      fetchStreams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };


  const selectCls = 'bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Streams</h1>
          {!loading && <p className="text-slate-400 text-sm mt-1">{total} stream{total !== 1 ? 's' : ''}</p>}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync with Server'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fade-up" style={{ animationDelay: '0.12s' }}>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search by name, stream key or source IP…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary transition-all placeholder:text-slate-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="">All Record Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
          <select value={filterHealth} onChange={e => setFilterHealth(e.target.value)} className={selectCls}>
            <option value="">All Health</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
          <select value={filterStreamStatus} onChange={e => setFilterStreamStatus(e.target.value)} className={selectCls}>
            <option value="">All Stream Status</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                {['#', 'Stream', 'Server', 'Video', 'Audio', 'Clients', 'Bandwidth', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm">Loading streams…</span>
                  </div>
                </td></tr>
              ) : streams.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Radio size={32} className="opacity-30" />
                    <span className="text-sm">No streams found</span>
                  </div>
                </td></tr>
              ) : streams.map((stream, index) => {
                const health = HEALTH_CONFIG[stream.health_status] ?? HEALTH_CONFIG.offline;
                const HealthIcon = health.Icon;
                const streamStatusCls = STREAM_STATUS_CLS[stream.stream_status ?? ''] ?? 'bg-slate-700/30 text-slate-500';
                const clientsMax = stream.max_sessions ?? stream.viewer_limit ?? 0;
                const clientsPct = clientsMax > 0 ? Math.round(((stream.online_clients ?? stream.current_viewers) / clientsMax) * 100) : 0;

                return (
                  <tr key={stream.uuid} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 text-slate-500 text-xs">{(page - 1) * 20 + index + 1}</td>

                    {/* Stream */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          <Radio size={14} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm leading-tight">{stream.stream_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {stream.stream_status && (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0 rounded text-[10px] font-medium ${streamStatusCls}`}>
                                <Activity size={9} />{stream.stream_status}
                              </span>
                            )}
                            {stream.published_via && (
                              <span className="text-[10px] text-slate-500 font-mono">{stream.published_via}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Server */}
                    <td className="px-4 py-3.5">
                      {stream.server ? (
                        <div>
                          <p className="text-slate-300 text-xs font-medium">{stream.server.server_name}</p>
                          <p className="text-slate-500 text-[11px] font-mono">{stream.server.server_host_ip}</p>
                        </div>
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>

                    {/* Video */}
                    <td className="px-4 py-3.5">
                      {stream.video_codec ? (
                        <div>
                          <p className="text-slate-200 text-xs font-mono uppercase">{stream.video_codec}</p>
                          {stream.video_width && stream.video_height && (
                            <p className="text-slate-500 text-[11px]">{stream.video_width}×{stream.video_height}{stream.fps ? ` @${stream.fps}fps` : ''}</p>
                          )}
                          {stream.bitrate > 0 && (
                            <p className="text-slate-600 text-[10px]">{stream.bitrate} Kbps</p>
                          )}
                        </div>
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>

                    {/* Audio */}
                    <td className="px-4 py-3.5">
                      {stream.audio_codec ? (
                        <div>
                          <p className="text-slate-200 text-xs font-mono uppercase">{stream.audio_codec}</p>
                          {stream.audio_channels && (
                            <p className="text-slate-500 text-[11px]">{stream.audio_channels}ch{stream.audio_sample_rate ? ` ${(stream.audio_sample_rate / 1000).toFixed(1)}kHz` : ''}</p>
                          )}
                        </div>
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>

                    {/* Clients */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-xs">
                        <Users size={11} className="text-slate-500" />
                        <span className="text-white">{stream.online_clients ?? stream.current_viewers}</span>
                        {clientsMax > 0 && <span className="text-slate-500">/ {clientsMax}</span>}
                      </div>
                      {clientsMax > 0 && (
                        <div className="w-14 h-1 bg-slate-700 rounded-full mt-1">
                          <div className={`h-1 rounded-full ${clientsPct > 80 ? 'bg-red-400' : clientsPct > 50 ? 'bg-amber-400' : 'bg-green-400'}`}
                            style={{ width: `${Math.min(clientsPct, 100)}%` }} />
                        </div>
                      )}
                      {stream.published_from && (
                        <p className="text-slate-600 text-[10px] font-mono mt-0.5 max-w-[100px] truncate" title={stream.published_from}>
                          {stream.published_from}
                        </p>
                      )}
                    </td>

                    {/* Bandwidth */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs text-slate-300">
                          <Signal size={10} className="text-slate-500" />
                          <span title="Output bandwidth">{fmtKbps(stream.out_bandwidth)}</span>
                        </div>
                        {stream.inputs_bandwidth != null && stream.inputs_bandwidth > 0 && (
                          <p className="text-slate-600 text-[10px]" title="Input bandwidth">{fmtBps(stream.inputs_bandwidth)} in</p>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${health.classes}`}>
                          <HealthIcon size={10} />{health.label}
                        </span>
                        <div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STATUS_CLS[stream.status] ?? STATUS_CLS.inactive}`}>
                            {stream.status}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Actions — view details */}
                    <td className="px-4 py-3.5">
                      <Link href={`/admin/streams/${stream.uuid}`}
                        className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors inline-flex" title="View details">
                        <Eye size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all">
            <ChevronLeft size={15} /> Previous
          </button>
          <span className="text-slate-400 text-sm">Page <span className="text-white font-semibold">{page}</span> of <span className="text-white font-semibold">{totalPages}</span></span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all">
            Next <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
