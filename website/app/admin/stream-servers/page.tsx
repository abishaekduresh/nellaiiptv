'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search, Server, Wifi, WifiOff, AlertTriangle, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface StreamServer {
  uuid: string;
  server_name: string;
  server_code: string | null;
  host_ipv4: string;
  provider_name: string | null;
  datacenter_region: string | null;
  server_type: string;
  health_status: 'online' | 'offline' | 'warning' | 'maintenance';
  status: string;
  current_streams: number;
  current_viewers: number;
  max_streams: number | null;
  max_viewers: number | null;
  expiry_at: string | null;
  ssl_enabled: boolean;
}

const HEALTH_CONFIG: Record<string, { label: string; classes: string; Icon: any }> = {
  online:      { label: 'Online',      classes: 'bg-green-500/20 text-green-400',   Icon: Wifi },
  offline:     { label: 'Offline',     classes: 'bg-red-500/20 text-red-400',       Icon: WifiOff },
  warning:     { label: 'Warning',     classes: 'bg-yellow-500/20 text-yellow-400', Icon: AlertTriangle },
  maintenance: { label: 'Maintenance', classes: 'bg-blue-500/20 text-blue-400',     Icon: Wrench },
};

const STATUS_CLASSES: Record<string, string> = {
  active:    'bg-green-500/20 text-green-400',
  inactive:  'bg-gray-500/20 text-gray-400',
  expired:   'bg-orange-500/20 text-orange-400',
  suspended: 'bg-red-500/20 text-red-400',
  deleted:   'bg-red-900/20 text-red-600',
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
  const [filterType, setFilterType] = useState('');

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
          server_type: filterType || undefined,
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

  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterHealth, filterType]);

  useEffect(() => {
    fetchServers();
  }, [page, search, filterStatus, filterHealth, filterType]);

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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Stream Servers</h1>
          {!loading && <p className="text-text-secondary text-sm mt-1">{total} server{total !== 1 ? 's' : ''} total</p>}
        </div>
        <Link
          href="/admin/stream-servers/create"
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Add Server</span>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-background-card p-4 rounded-lg border border-gray-800 mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
          <input
            type="text"
            placeholder="Search by name, code, IP, or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-background border border-gray-800 text-text-secondary rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={filterHealth}
            onChange={(e) => setFilterHealth(e.target.value)}
            className="bg-background border border-gray-800 text-text-secondary rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
          >
            <option value="">All Health</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="warning">Warning</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-background border border-gray-800 text-text-secondary rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
          >
            <option value="">All Types</option>
            <option value="vps">VPS</option>
            <option value="dedicated">Dedicated</option>
            <option value="cloud">Cloud</option>
            <option value="baremetal">Baremetal</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-background-card rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-800/50 text-text-secondary text-sm uppercase">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Server</th>
                <th className="px-6 py-4">Host</th>
                <th className="px-6 py-4">Provider / Region</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Streams</th>
                <th className="px-6 py-4">Health</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-text-secondary">
                    Loading...
                  </td>
                </tr>
              ) : servers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-text-secondary">
                    No stream servers found
                  </td>
                </tr>
              ) : (
                servers.map((server, index) => {
                  const health = HEALTH_CONFIG[server.health_status] ?? HEALTH_CONFIG.offline;
                  const HealthIcon = health.Icon;
                  return (
                    <tr key={server.uuid} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-text-secondary">{(page - 1) * 20 + index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center">
                            <Server size={18} className="text-text-secondary" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{server.server_name}</p>
                            {server.server_code && (
                              <span className="text-xs text-text-secondary font-mono">{server.server_code}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-mono text-sm">{server.host_ipv4}</p>
                          {server.ssl_enabled && (
                            <span className="text-xs text-green-400">SSL</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        <div>
                          {server.provider_name && <p className="text-white text-sm">{server.provider_name}</p>}
                          {server.datacenter_region && (
                            <p className="text-xs text-text-secondary">{server.datacenter_region}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-800 px-2 py-0.5 rounded text-xs text-text-secondary capitalize">
                          {server.server_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm">
                        <div>
                          <span className="text-white">{server.current_streams}</span>
                          {server.max_streams && <span> / {server.max_streams}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${health.classes}`}>
                          <HealthIcon size={12} />
                          {health.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${STATUS_CLASSES[server.status] ?? STATUS_CLASSES.inactive}`}>
                          {server.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/stream-servers/${server.uuid}`}
                            className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 p-2 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(server.uuid, server.server_name)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-800 flex justify-between items-center">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="text-text-secondary">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
