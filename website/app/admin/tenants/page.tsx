'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search, Building2, Server, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface Tenant {
  uuid: string;
  company_name: string;
  email: string;
  max_viewers: number;
  allowed_servers: string[];
  channel_id: string[];
  status: string;
  created_at: string;
}

const STATUS_CLS: Record<string, string> = {
  active:   'bg-green-500/20 text-green-400',
  inactive: 'bg-gray-500/20 text-gray-400',
  expired:  'bg-orange-500/20 text-orange-400',
  deleted:  'bg-red-900/20 text-red-600',
};

export default function TenantsPage() {
  const [tenants,    setTenants]    = useState<Tenant[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/tenants', {
        params: { page, per_page: 20, search: search || undefined, status: filterStatus || undefined },
      });
      setTenants(res.data.data.data);
      setTotalPages(res.data.data.last_page);
      setTotal(res.data.data.total);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [search, filterStatus]);
  useEffect(() => { fetchTenants(); }, [page, search, filterStatus]);

  const handleDelete = async (uuid: string, name: string) => {
    if (!confirm(`Delete tenant "${name}"?`)) return;
    try {
      await adminApi.delete(`/admin/tenants/${uuid}`);
      toast.success('Tenant deleted');
      setTenants(prev => prev.filter(t => t.uuid !== uuid));
      setTotal(n => n - 1);
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
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Tenants</h1>
          {!loading && <p className="text-slate-400 text-sm mt-1">{total} tenant{total !== 1 ? 's' : ''}</p>}
        </div>
        <Link href="/admin/tenants/create"
          className="flex items-center gap-2 bg-primary hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 self-start sm:self-auto">
          <Plus size={16} /> Add Tenant
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fade-up" style={{ animationDelay: '0.12s' }}>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search by company or email…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary transition-all placeholder:text-slate-600" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`${selectCls} w-full md:w-1/3`}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                {['#', 'Company', 'Email', 'Max Viewers', 'Servers', 'Channels', 'Status', 'Actions'].map(h => (
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
                    <span className="text-sm">Loading tenants…</span>
                  </div>
                </td></tr>
              ) : tenants.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Building2 size={32} className="opacity-30" />
                    <span className="text-sm">No tenants found</span>
                  </div>
                </td></tr>
              ) : tenants.map((t, index) => (
                <tr key={t.uuid} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{(page - 1) * 20 + index + 1}</td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                        <Building2 size={15} className="text-slate-400" />
                      </div>
                      <span className="text-white font-medium text-sm">{t.company_name}</span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-slate-400 text-xs">{t.email}</td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Users size={11} className="text-slate-500" />
                      {t.max_viewers.toLocaleString()}
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Server size={11} className="text-slate-500" />
                      {(t.allowed_servers ?? []).length}
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-slate-300 text-xs">
                    {(t.channel_id ?? []).length}
                  </td>

                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_CLS[t.status] ?? STATUS_CLS.inactive}`}>
                      {t.status}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/admin/tenants/${t.uuid}`}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Edit">
                        <Edit size={14} />
                      </Link>
                      <button onClick={() => handleDelete(t.uuid, t.company_name)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
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
