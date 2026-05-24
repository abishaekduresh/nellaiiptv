'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search, ExternalLink, BarChart2, Eye, Download, Tv, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';
import { Category, Language, State } from '@/types';
import ChannelAnalyticsModal from '@/components/admin/ChannelAnalyticsModal';
import ChannelDetailsModal from '@/components/admin/ChannelDetailsModal';
import ExportChannelsModal from '@/components/admin/ExportChannelsModal';

interface AdminChannel {
  uuid: string;
  name: string;
  channel_number: string;
  thumbnail_url: string;
  status: string;
  state?: { name: string };
  language?: { name: string };
  category?: { name: string };
  hls_url: string;
  id: string;
  is_premium?: boolean;
  calculated_views_count?: number;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [analyticsUuid, setAnalyticsUuid] = useState<string | null>(null);
  const [detailsUuid, setDetailsUuid] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const fetchFilters = async () => {
    try {
      const [catRes, langRes, stateRes] = await Promise.all([
        adminApi.get('/admin/categories', { params: { status: 'all' } }),
        adminApi.get('/admin/languages', { params: { status: 'all' } }),
        adminApi.get('/admin/states'),
      ]);
      setCategories(catRes.data.data);
      setLanguages(langRes.data.data);
      setStates(stateRes.data.data);
    } catch {
      toast.error('Failed to load filter options');
    }
  };

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/channels', {
        params: {
          page, per_page: 20,
          search: search || undefined,
          category_id: filterCategory || undefined,
          language_id: filterLanguage || undefined,
          state_id: filterState || undefined,
          status: filterStatus || undefined,
        },
      });
      setChannels(res.data.data.data);
      setTotalPages(res.data.data.last_page);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFilters(); }, []);
  useEffect(() => { setPage(1); }, [search, filterCategory, filterLanguage, filterState, filterStatus]);
  useEffect(() => { fetchChannels(); }, [page, search, filterCategory, filterLanguage, filterState, filterStatus]);

  const handleDelete = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;
    try {
      await adminApi.delete(`/admin/channels/${uuid}`);
      toast.success('Channel deleted');
      fetchChannels();
    } catch {
      toast.error('Failed to delete channel');
    }
  };

  const selectClass = "bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Channels</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your IPTV channel library</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          >
            <Download size={16} />
            Export
          </button>
          <Link
            href="/admin/channels/create"
            className="flex items-center gap-2 bg-primary hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
          >
            <Plus size={16} />
            Add Channel
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fade-up" style={{ animationDelay: '0.12s' }}>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search channels by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-slate-600"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectClass}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterLanguage} onChange={e => setFilterLanguage(e.target.value)} className={selectClass}>
            <option value="">All Languages</option>
            {languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select value={filterState} onChange={e => setFilterState(e.target.value)} className={selectClass}>
            <option value="">All States</option>
            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectClass}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                <th className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">#</th>
                <th className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">CH</th>
                <th className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Name</th>
                <th className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Views</th>
                <th className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Category</th>
                <th className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Language</th>
                <th className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">State</th>
                <th className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Actions</th>
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
                    <span className="text-sm">Loading channels...</span>
                  </div>
                </td></tr>
              ) : channels.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Tv size={32} className="opacity-30" />
                    <span className="text-sm">No channels found</span>
                  </div>
                </td></tr>
              ) : channels.map((ch, i) => (
                <tr key={ch.uuid} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{(page - 1) * 20 + i + 1}</td>
                  <td className="px-5 py-3.5 text-white font-mono font-bold text-xs">{ch.channel_number || '-'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {ch.thumbnail_url ? (
                        <img src={ch.thumbnail_url} alt={ch.name} className="w-9 h-9 rounded-lg object-cover bg-slate-800 shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                          <Tv size={14} className="text-slate-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium text-sm">{ch.name}</p>
                        <a href={ch.hls_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors">
                          Preview <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {ch.calculated_views_count ? (
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg text-xs font-mono">{ch.calculated_views_count}</span>
                    ) : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {ch.category?.name ? <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg text-xs">{ch.category.name}</span> : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 text-xs">{ch.language?.name || '—'}</td>
                  <td className="px-5 py-3.5 text-slate-300 text-xs">{ch.state?.name || '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ch.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {ch.status ? ch.status.charAt(0).toUpperCase() + ch.status.slice(1) : ''}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ch.is_premium ? 'bg-yellow-500/15 text-yellow-400' : 'bg-blue-500/15 text-blue-400'}`}>
                        {ch.is_premium ? 'Premium' : 'Free'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <a href={`/channels/preview/${ch.uuid}`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors" title="Preview">
                        <ExternalLink size={14} />
                      </a>
                      <button onClick={() => setDetailsUuid(ch.uuid)}
                        className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors" title="Details">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => setAnalyticsUuid(ch.uuid)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Analytics">
                        <BarChart2 size={14} />
                      </button>
                      <Link href={`/admin/channels/${ch.uuid}`}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Edit">
                        <Edit size={14} />
                      </Link>
                      <button onClick={() => handleDelete(ch.uuid)}
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all"
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <span className="text-slate-400 text-sm">Page <span className="text-white font-semibold">{page}</span> of <span className="text-white font-semibold">{totalPages}</span></span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all"
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <ChannelAnalyticsModal uuid={analyticsUuid || ''} isOpen={!!analyticsUuid} onClose={() => setAnalyticsUuid(null)} />
      <ChannelDetailsModal uuid={detailsUuid || ''} isOpen={!!detailsUuid} onClose={() => setDetailsUuid(null)} />
      <ExportChannelsModal
        isOpen={showExportModal} onClose={() => setShowExportModal(false)}
        categories={categories} languages={languages} states={states}
        currentFilters={{ search, category_id: filterCategory, language_id: filterLanguage, state_id: filterState, status: filterStatus }}
      />
    </div>
  );
}
