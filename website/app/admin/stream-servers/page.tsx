'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search, Server, Wifi, WifiOff, Eye, ChevronLeft, ChevronRight, MapPin, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';
import StreamServerDetailsModal from '@/components/admin/StreamServerDetailsModal';
import CronUrlCard from '@/components/admin/CronUrlCard';

interface StreamServer {
  uuid: string;
  server_name: string;
  server_host_ip: string;
  server_host_domain: string | null;
  api_port: number;
  api_version: string;
  username: string;
  region: string | null;
  timezone: string | null;
  health_status: 'online' | 'offline';
  last_ping_at: string | null;
  status: string;
}

const HEALTH_CONFIG: Record<string, { label: string; classes: string; Icon: any }> = {
  online:  { label: 'Online',  classes: 'bg-green-500/20 text-green-400', Icon: Wifi },
  offline: { label: 'Offline', classes: 'bg-red-500/20 text-red-400',     Icon: WifiOff },
};

const STATUS_CLASSES: Record<string, string> = {
  active:   'bg-green-500/20 text-green-400',
  inactive: 'bg-gray-500/20 text-gray-400',
  expired:  'bg-orange-500/20 text-orange-400',
  deleted:  'bg-red-900/20 text-red-600',
};

export default function StreamServersPage() {
  const [servers, setServers] = useState<StreamServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterHealth, setFilterHealth] = useState('');

  const [viewUuid, setViewUuid] = useState<string | null>(null);
  const [pinging, setPinging] = useState(false);

  const handlePingAll = async () => {
    setPinging(true);
    try {
      const res = await adminApi.post('/admin/stream-servers/ping-all');
      const { online, offline, total } = res.data.data;
      toast.success(`Pinged ${total} server(s): ${online} online, ${offline} offline`);
      fetchServers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ping failed');
    } finally {
      setPinging(false);
    }
  };

  const fetchServers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/stream-servers', {
        params: {
          page,
          per_page: 20,
          search: search || undefined,
          status: filterStatus || undefined,
          health_status: filterHealth || undefined,
        },
      });
      setServers(res.data.data.data);
      setTotalPages(res.data.data.last_page);
      setTotal(res.data.data.total);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load stream servers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [search, filterStatus, filterHealth]);
  useEffect(() => { fetchServers(); }, [page, search, filterStatus, filterHealth]);

  const handleDelete = async (uuid: string, name: string) => {
    if (!confirm(`Delete stream server "${name}"? This cannot be undone.`)) return;
    try {
      await adminApi.delete(`/admin/stream-servers/${uuid}`);
      toast.success('Stream server deleted');
      setServers((prev) => prev.filter((s) => s.uuid !== uuid));
      setTotal((t) => t - 1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete stream server');
    }
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString() : '—';

  const selectCls = 'bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all';

  return (
    <div className="space-y-6">
      <StreamServerDetailsModal uuid={viewUuid ?? ''} isOpen={!!viewUuid} onClose={() => setViewUuid(null)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Stream Servers</h1>
          {!loading && <p className="text-slate-400 text-sm mt-1">{total} Flussonic server{total !== 1 ? 's' : ''}</p>}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={handlePingAll} disabled={pinging}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5">
            <RefreshCw size={15} className={pinging ? 'animate-spin' : ''} />
            {pinging ? 'Pinging…' : 'Ping All'}
          </button>
          <Link href="/admin/stream-servers/create"
            className="flex items-center gap-2 bg-primary hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5">
            <Plus size={16} /> Add Server
          </Link>
        </div>
      </div>

      {/* Cron URL */}
      <CronUrlCard endpoints={[{ method: 'GET', label: 'Ping Servers', path: '/cron/ping-servers' }]} />

      {/* Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fade-up" style={{ animationDelay: '0.12s' }}>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search by name, IP, domain, or region..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-slate-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
            <option value="deleted">Deleted</option>
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
                {['#', 'Server', 'Host / Domain', 'API Endpoint', 'Region', 'Last Ping', 'Health', 'Status', 'Actions'].map(h => (
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
                    <span className="text-sm">Loading servers...</span>
                  </div>
                </td></tr>
              ) : servers.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Server size={32} className="opacity-30" />
                    <span className="text-sm">No Flussonic servers found</span>
                  </div>
                </td></tr>
              ) : servers.map((server, index) => {
                const health = HEALTH_CONFIG[server.health_status] ?? HEALTH_CONFIG.offline;
                const HealthIcon = health.Icon;
                return (
                  <tr key={server.uuid} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{(page - 1) * 20 + index + 1}</td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          <Server size={16} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{server.server_name}</p>
                          <span className="text-xs text-slate-500 font-mono">{server.username}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="text-white font-mono text-xs">{server.server_host_ip}</p>
                      {server.server_host_domain && (
                        <p className="text-xs text-slate-500">{server.server_host_domain}</p>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <code className="text-xs text-cyan-400 font-mono">
                        :{server.api_port}/streamer/api/{server.api_version}
                      </code>
                    </td>

                    <td className="px-5 py-3.5">
                      {server.region ? (
                        <div className="flex items-center gap-1 text-slate-300 text-xs">
                          <MapPin size={11} className="text-slate-500" />
                          {server.region}
                        </div>
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <Clock size={11} />
                        {server.last_ping_at ? fmtDate(server.last_ping_at) : '—'}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${health.classes}`}>
                        <HealthIcon size={11} />{health.label}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_CLASSES[server.status] ?? STATUS_CLASSES.inactive}`}>
                        {server.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setViewUuid(server.uuid)}
                          className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors" title="Details">
                          <Eye size={14} />
                        </button>
                        <Link href={`/admin/stream-servers/${server.uuid}`}
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Edit">
                          <Edit size={14} />
                        </Link>
                        <button onClick={() => handleDelete(server.uuid, server.server_name)}
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
