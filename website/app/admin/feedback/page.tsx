'use client';

import { useEffect, useState } from 'react';
import { Trash2, Star, Calendar, ThumbsUp, Monitor, Smartphone, Tv, ChevronLeft, ChevronRight, X } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import { toast } from 'react-hot-toast';

interface FeedbackItem {
  uuid: string;
  feedback_type: string;
  rating: number | null;
  issue_type: string | null;
  message: string;
  platform: string;
  status: 'new' | 'reviewed' | 'resolved';
  created_at: string;
  customer: { uuid: string; name: string; email: string; phone: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  general: 'General', bug: 'Bug Report', feature_request: 'Feature Request',
  channel_issue: 'Channel Issue', subscription: 'Subscription',
};
const ISSUE_LABELS: Record<string, string> = {
  stream_not_working: 'Stream not working', buffering_frequently: 'Buffering',
  audio_issue: 'Audio issue', video_quality_issue: 'Video quality', wrong_channel: 'Wrong channel', other: 'Other',
};
const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-400',
  reviewed: 'bg-yellow-500/15 text-yellow-400',
  resolved: 'bg-green-500/15 text-green-400',
};
const TYPE_STYLES: Record<string, string> = {
  general: 'bg-slate-700/60 text-slate-300',
  bug: 'bg-red-500/15 text-red-400',
  feature_request: 'bg-purple-500/15 text-purple-400',
  channel_issue: 'bg-orange-500/15 text-orange-400',
  subscription: 'bg-cyan-500/15 text-cyan-400',
};

function PlatformIcon({ platform }: { platform: string }) {
  const cls = 'text-slate-400 shrink-0';
  if (platform === 'web') return <Monitor size={13} className={cls} />;
  if (platform === 'tv') return <Tv size={13} className={cls} />;
  return <Smartphone size={13} className={cls} />;
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-slate-600 text-xs">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={11} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'} />
      ))}
    </div>
  );
}

const selectClass = "bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all";

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchFeedback = async (pageNum: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), per_page: '15' });
      if (filterType) params.set('feedback_type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      if (filterPlatform) params.set('platform', filterPlatform);
      const res = await adminApi.get(`/admin/feedback?${params}`);
      const data = res.data.data;
      setItems(data.data);
      setTotalPages(data.last_page);
      setTotal(data.total);
      setPage(pageNum);
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedback(1); }, [filterType, filterStatus, filterPlatform]);

  const handleStatusChange = async (uuid: string, status: string) => {
    try {
      await adminApi.put(`/admin/feedback/${uuid}/status`, { status });
      setItems(prev => prev.map(f => f.uuid === uuid ? { ...f, status: status as any } : f));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Delete this feedback?')) return;
    try {
      await adminApi.delete(`/admin/feedback/${uuid}`);
      setItems(prev => prev.filter(f => f.uuid !== uuid));
      setTotal(t => t - 1);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleExpand = (uuid: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(uuid) ? next.delete(uuid) : next.add(uuid);
    return next;
  });

  const hasFilters = filterType || filterStatus || filterPlatform;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Feedback</h1>
          <p className="text-slate-400 text-sm mt-1">{total > 0 ? `${total} submissions` : 'User feedback submissions'}</p>
        </div>
        <ThumbsUp size={22} className="text-primary" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 animate-fade-up" style={{ animationDelay: '0.12s' }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectClass}>
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectClass}>
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className={selectClass}>
          <option value="">All Platforms</option>
          <option value="web">Web</option>
          <option value="android">Android</option>
          <option value="ios">iOS</option>
          <option value="tv">TV</option>
        </select>
        {hasFilters && (
          <button onClick={() => { setFilterType(''); setFilterStatus(''); setFilterPlatform(''); }}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-2.5 rounded-xl hover:bg-slate-800">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.2s' }}>
        {loading ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-500">
            <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm">Loading feedback...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/40">
                  {['User', 'Type', 'Rating', 'Message', 'Platform', 'Status', 'Date', ''].map((h, i) => (
                    <th key={i} className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <ThumbsUp size={32} className="opacity-30" />
                      <span className="text-sm">No feedback found</span>
                    </div>
                  </td></tr>
                ) : items.map(item => {
                  const isExpanded = expanded.has(item.uuid);
                  return (
                    <tr key={item.uuid} className="hover:bg-slate-800/30 transition-colors align-top">
                      <td className="px-5 py-3.5 min-w-[130px]">
                        {item.customer ? (
                          <div>
                            <p className="text-white font-medium text-sm">{item.customer.name}</p>
                            <p className="text-slate-500 text-xs">{item.customer.email || item.customer.phone}</p>
                          </div>
                        ) : <span className="text-slate-500 text-sm">Guest</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLES[item.feedback_type] || 'bg-slate-700 text-slate-300'}`}>
                            {TYPE_LABELS[item.feedback_type] || item.feedback_type}
                          </span>
                          {item.issue_type && (
                            <span className="text-xs text-slate-500">{ISSUE_LABELS[item.issue_type] || item.issue_type}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><StarRating rating={item.rating} /></td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className={`text-slate-300 text-sm ${isExpanded ? '' : 'line-clamp-2'}`}>{item.message}</p>
                        {item.message.length > 100 && (
                          <button onClick={() => toggleExpand(item.uuid)} className="text-xs text-primary hover:underline mt-0.5">
                            {isExpanded ? 'Less' : 'More'}
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs capitalize">
                          <PlatformIcon platform={item.platform} />
                          {item.platform}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={item.status}
                          onChange={e => handleStatusChange(item.uuid, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full bg-transparent cursor-pointer focus:outline-none border ${
                            item.status === 'new' ? 'border-blue-500/30 text-blue-400' :
                            item.status === 'reviewed' ? 'border-yellow-500/30 text-yellow-400' :
                            'border-green-500/30 text-green-400'
                          }`}
                        >
                          <option value="new">New</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                          <Calendar size={11} />
                          <div>
                            <div>{new Date(item.created_at).toLocaleDateString()}</div>
                            <div>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => handleDelete(item.uuid)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
            <button disabled={page <= 1} onClick={() => fetchFeedback(page - 1)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all">
              <ChevronLeft size={15} /> Previous
            </button>
            <span className="text-slate-400 text-sm">Page <span className="text-white font-semibold">{page}</span> of <span className="text-white font-semibold">{totalPages}</span></span>
            <button disabled={page >= totalPages} onClick={() => fetchFeedback(page + 1)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all">
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
