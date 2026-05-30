'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search, Radio, Wifi, WifiOff, ChevronLeft, ChevronRight, Users, Zap, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface Stream {
  uuid: string;
  stream_name: string;
  input_url: string;
  output_formats: string[];
  stream_key: string | null;
  health_status: 'online' | 'offline';
  viewer_limit: number;
  current_viewers: number;
  bitrate: number;
  status: string;
  server: { uuid: string; server_name: string; server_host_ip: string } | null;
}

const HEALTH_CONFIG: Record<string, { label: string; classes: string; Icon: any }> = {
  online:  { label: 'Online',  classes: 'bg-green-500/20 text-green-400', Icon: Wifi },
  offline: { label: 'Offline', classes: 'bg-red-500/20 text-red-400',     Icon: WifiOff },
};

const STATUS_CLS: Record<string, string> = {
  active:   'bg-green-500/20 text-green-400',
  inactive: 'bg-gray-500/20 text-gray-400',
  expired:  'bg-orange-500/20 text-orange-400',
  deleted:  'bg-red-900/20 text-red-600',
};

function fmtBitrate(bps: number): string {
  if (!bps) return '—';
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  if (bps >= 1_000)     return `${(bps / 1_000).toFixed(0)} Kbps`;
  return `${bps} bps`;
}

export default function StreamsPage() {
  const [streams, setStreams]   = useState<Stream[]>([]);
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);
  const [search,  setSearch]    = useState('');
  const [page,    setPage]      = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,   setTotal]     = useState(0);
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterHealth, setFilterHealth]   = useState('');

  const fetchStreams = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/streams', {
        params: { page, per_page: 20, search: search || undefined, status: filterStatus || undefined, health_status: filterHealth || undefined },
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

  useEffect(() => { setPage(1); }, [search, filterStatus, filterHealth]);
  useEffect(() => { fetchStreams(); }, [page, search, filterStatus, filterHealth]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await adminApi.post('/admin/streams/sync');
      const { created, updated, errors, sampleRaw } = res.data.data;
      if (sampleRaw) console.log('[Sync] Raw stream sample from Flussonic:', JSON.stringify(sampleRaw, null, 2));
      const msg = `Synced — ${created} created, ${updated} updated.`;
      if (errors?.length) {
        errors.forEach((e: string) => toast.error(e, { duration: 8000 }));
      } else {
        toast.success(msg);
      }
      fetchStreams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (uuid: string, name: string) => {
    if (!confirm(`Delete stream "${name}"?`)) return;
    try {
      await adminApi.delete(`/admin/streams/${uuid}`);
      toast.success('Stream deleted');
      setStreams(prev => prev.filter(s => s.uuid !== uuid));
      setTotal(t => t - 1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
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
          <Link href="/admin/streams/create"
            className="flex items-center gap-2 bg-primary hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5">
            <Plus size={16} /> Add Stream
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fade-up" style={{ animationDelay: '0.12s' }}>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search by name or stream key…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary transition-all placeholder:text-slate-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
          <select value={filterHealth} onChange={e => setFilterHealth(e.target.value)} className={selectCls}>
            <option value="">All Health</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                {['#', 'Stream', 'Server', 'Formats', 'Viewers', 'Bitrate', 'Health', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">{h}</th>
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
                const viewerPct = stream.viewer_limit > 0 ? Math.round((stream.current_viewers / stream.viewer_limit) * 100) : 0;
                return (
                  <tr key={stream.uuid} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{(page - 1) * 20 + index + 1}</td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          <Radio size={15} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{stream.stream_name}</p>
                          {stream.stream_key && <span className="text-xs text-slate-500 font-mono">{stream.stream_key}</span>}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {stream.server ? (
                        <div>
                          <p className="text-slate-300 text-xs font-medium">{stream.server.server_name}</p>
                          <p className="text-slate-500 text-xs font-mono">{stream.server.server_host_ip}</p>
                        </div>
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(stream.output_formats ?? []).map(f => (
                          <span key={f} className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-700 text-slate-300 uppercase">{f}</span>
                        ))}
                        {(!stream.output_formats || stream.output_formats.length === 0) && <span className="text-slate-600 text-xs">—</span>}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Users size={11} className="text-slate-500" />
                        <span className="text-white">{stream.current_viewers}</span>
                        <span className="text-slate-500">/ {stream.viewer_limit}</span>
                      </div>
                      {stream.viewer_limit > 0 && (
                        <div className="w-16 h-1 bg-slate-700 rounded-full mt-1">
                          <div className={`h-1 rounded-full ${viewerPct > 80 ? 'bg-red-400' : viewerPct > 50 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${Math.min(viewerPct, 100)}%` }} />
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-xs text-slate-300">
                        <Zap size={11} className="text-slate-500" />
                        {fmtBitrate(stream.bitrate)}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${health.classes}`}>
                        <HealthIcon size={11} />{health.label}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_CLS[stream.status] ?? STATUS_CLS.inactive}`}>
                        {stream.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/admin/streams/${stream.uuid}`}
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Edit">
                          <Edit size={14} />
                        </Link>
                        <button onClick={() => handleDelete(stream.uuid, stream.stream_name)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
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
