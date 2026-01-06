'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search, ExternalLink, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';
import { Category, Language, State } from '@/types';

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
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [states, setStates] = useState<State[]>([]);

  // Selected Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchFilters = async () => {
    try {
      const [catRes, langRes, stateRes] = await Promise.all([
        adminApi.get('/categories'),
        adminApi.get('/languages'),
        adminApi.get('/states'),
      ]);
      setCategories(catRes.data.data);
      setLanguages(langRes.data.data);
      setStates(stateRes.data.data);
    } catch (error) {
      console.error('Failed to fetch filters', error);
      toast.error('Failed to load filter options');
    }
  };

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/admin/channels`, {
        params: {
          page,
          per_page: 20,
          search: search || undefined,
          category_id: filterCategory || undefined,
          language_id: filterLanguage || undefined,
          state_id: filterState || undefined,
          status: filterStatus || undefined,
        },
      });
      setChannels(res.data.data.data);
      setTotalPages(res.data.data.last_page);
    } catch (error) {
      console.error('Failed to fetch channels', error);
      toast.error('Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filterCategory, filterLanguage, filterState, filterStatus]);

  useEffect(() => {
    fetchChannels();
  }, [page, search, filterCategory, filterLanguage, filterState, filterStatus]);

  const handleDelete = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;
    try {
      await adminApi.delete(`/admin/channels/${uuid}`);
      toast.success('Channel deleted successfully');
      setChannels(channels.filter((c) => c.uuid !== uuid));
      await fetchChannels();
    } catch (error) {
      console.error('Delete error', error);
      toast.error('Failed to delete channel');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-white">Channels</h1>
        <Link
          href="/admin/channels/create"
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Add Channel</span>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-background-card p-4 rounded-lg border border-gray-800 mb-6 space-y-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
            <input 
                type="text" 
                placeholder="Search channels..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-primary"
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-background border border-gray-800 text-text-secondary rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
            >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>

            <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="bg-background border border-gray-800 text-text-secondary rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
            >
                <option value="">All Languages</option>
                {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                ))}
            </select>

            <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="bg-background border border-gray-800 text-text-secondary rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
            >
                <option value="">All States</option>
                {states.map((state) => (
                    <option key={state.id} value={state.id}>{state.name}</option>
                ))}
            </select>

            <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-background border border-gray-800 text-text-secondary rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
            >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
        </div>
      </div>

      {/* Channels Table */}
      <div className="bg-background-card rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-800/50 text-text-secondary text-sm uppercase">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Language</th>
                <th className="px-6 py-4">State</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">Loading...</td>
                </tr>
              ) : channels.length === 0 ? (
                 <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">No channels found</td>
                </tr>
              ) : (
                channels.map((channel) => (
                  <tr key={channel.uuid} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-text-secondary">{channel.id || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {channel.thumbnail_url ? (
                            <img src={channel.thumbnail_url} alt={channel.name} className="w-10 h-10 rounded object-cover bg-gray-800" />
                        ) : (
                            <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center text-xs text-text-secondary">No Img</div>
                        )}
                        <div>
                            <p className="text-white font-medium">{channel.name}</p>
                            <a href={channel.hls_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                Preview Link <ExternalLink size={10} />
                            </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                        {channel.category?.name && <span className="bg-gray-800 px-2 py-0.5 rounded text-xs">{channel.category.name}</span>}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                        {channel.language?.name && <span className="mr-2">{channel.language.name}</span>}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                        {channel.state?.name && <span className="mr-2">{channel.state.name}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          channel.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {channel.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/channels/${channel.uuid}`}
                          className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 p-2 rounded transition-colors"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(channel.uuid)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-800 flex justify-between items-center">
            <button 
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 hover:bg-gray-700"
            >
                Previous
            </button>
            <span className="text-text-secondary">Page {page} of {totalPages}</span>
            <button 
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 hover:bg-gray-700"
            >
                Next
            </button>
        </div>
      </div>
    </div>
  );
}
