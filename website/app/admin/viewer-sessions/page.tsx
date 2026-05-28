'use client';

import { useEffect, useState } from 'react';
import { Search, Monitor, Globe, ChevronLeft, ChevronRight, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface ViewerSession {
  id: number;
  session_id: string;
  stream_id: number;
  ip_address: string;
  country: string | null;
  user_agent: string | null;
  started_at: string | null;
  bandwidth: number;
  protocol: string;
  stream: { uuid: string; stream_name: string } | null;
}

const PROTOCOL_CLS: Record<string, string> = {
  hls:    'bg-blue-500/20 text-blue-400',
  dash:   'bg-purple-500/20 text-purple-400',
  rtmp:   'bg-orange-500/20 text-orange-400',
  webrtc: 'bg-teal-500/20 text-teal-400',
};

function fmtBandwidth(bps: number): string {
  if (!bps) return '—';
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  if (bps >= 1_000)     return `${(bps / 1_000).toFixed(0)} Kbps`;
  return `${bps} bps`;
}

export default function ViewerSessionsPage() {
  const [sessions,   setSessions]   = useState<ViewerSession[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [filterProtocol, setFilterProtocol] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/viewer-sessions', {
        params: { page, per_page: 30, search: search || undefined, protocol: filterProtocol || undefined },
      });
      setSessions(res.data.data.data);
      setTotalPages(res.data.data.last_page);
      setTotal(res.data.data.total);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [search, filterProtocol]);
  useEffect(() => { fetchSessions(); }, [page, search, filterProtocol]);

  const selectCls = 'bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Viewer Sessions</h1>
        {!loading && <p className="text-slate-400 text-sm mt-1">{total} session{total !== 1 ? 's' : ''}</p>}
      </div>

      {/* Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fade-up" style={{ animationDelay: '0.12s' }}>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search by session ID, IP, or country…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary transition-all placeholder:text-slate-600" />
        </div>
        <select value={filterProtocol} onChange={e => setFilterProtocol(e.target.value)} className={`${selectCls} w-full md:w-1/3`}>
          <option value="">All Protocols</option>
          <option value="hls">HLS</option>
          <option value="dash">DASH</option>
          <option value="rtmp">RTMP</option>
          <option value="webrtc">WebRTC</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                {['#', 'Session ID', 'Stream', 'IP / Country', 'Protocol', 'Bandwidth', 'Started At', 'User Agent'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm">Loading sessions…</span>
                  </div>
                </td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Monitor size={32} className="opacity-30" />
                    <span className="text-sm">No viewer sessions found</span>
                  </div>
                </td></tr>
              ) : sessions.map((s, i) => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{(page - 1) * 30 + i + 1}</td>

                  <td className="px-5 py-3.5">
                    <span className="text-xs font-mono text-slate-300 max-w-[120px] truncate block">{s.session_id}</span>
                  </td>

                  <td className="px-5 py-3.5">
                    {s.stream ? (
                      <span className="text-slate-300 text-xs">{s.stream.stream_name}</span>
                    ) : <span className="text-slate-600 text-xs">—</span>}
                  </td>

                  <td className="px-5 py-3.5">
                    <p className="text-white text-xs font-mono">{s.ip_address}</p>
                    {s.country && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Globe size={10} />{s.country}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${PROTOCOL_CLS[s.protocol] ?? 'bg-slate-700 text-slate-400'}`}>
                      {s.protocol}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-slate-300 text-xs">
                    <div className="flex items-center gap-1">
                      <Wifi size={11} className="text-slate-500" />
                      {fmtBandwidth(s.bandwidth)}
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-slate-400 text-xs">
                    {s.started_at ? new Date(s.started_at).toLocaleString() : '—'}
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="text-xs text-slate-500 max-w-[150px] truncate block" title={s.user_agent ?? ''}>
                      {s.user_agent || '—'}
                    </span>
                  </td>
                </tr>
              ))}
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
