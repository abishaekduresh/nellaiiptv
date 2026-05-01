'use client';

import { useEffect, useState } from 'react';
import { Trash2, Loader2, Star, Calendar, ThumbsUp, Monitor, Smartphone, Tv } from 'lucide-react';
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

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  general: 'General',
  bug: 'Bug Report',
  feature_request: 'Feature Request',
  channel_issue: 'Channel Issue',
  subscription: 'Subscription',
};

const ISSUE_TYPE_LABELS: Record<string, string> = {
  stream_not_working: 'Stream not working',
  buffering_frequently: 'Buffering',
  audio_issue: 'Audio issue',
  video_quality_issue: 'Video quality',
  wrong_channel: 'Wrong channel',
  other: 'Other',
};

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  reviewed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const TYPE_STYLES: Record<string, string> = {
  general: 'bg-slate-700 text-slate-300',
  bug: 'bg-red-500/20 text-red-400',
  feature_request: 'bg-purple-500/20 text-purple-400',
  channel_issue: 'bg-orange-500/20 text-orange-400',
  subscription: 'bg-cyan-500/20 text-cyan-400',
};

function PlatformIcon({ platform }: { platform: string }) {
  const cls = 'text-slate-400';
  if (platform === 'web') return <Monitor size={14} className={cls} />;
  if (platform === 'tv') return <Tv size={14} className={cls} />;
  return <Smartphone size={14} className={cls} />;
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-slate-600 text-xs">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}
        />
      ))}
    </div>
  );
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');

  // Expanded message rows
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
      setItems((prev) => prev.map((f) => f.uuid === uuid ? { ...f, status: status as any } : f));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Delete this feedback?')) return;
    try {
      await adminApi.delete(`/admin/feedback/${uuid}`);
      setItems((prev) => prev.filter((f) => f.uuid !== uuid));
      setTotal((t) => t - 1);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleExpand = (uuid: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(uuid) ? next.delete(uuid) : next.add(uuid);
      return next;
    });
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <ThumbsUp className="text-primary" />
          Feedback
          {total > 0 && (
            <span className="text-lg font-normal text-slate-400">({total})</span>
          )}
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">All Types</option>
          {Object.entries(FEEDBACK_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">All Platforms</option>
          <option value="web">Web</option>
          <option value="android">Android</option>
          <option value="ios">iOS</option>
          <option value="tv">TV</option>
          <option value="mobile">Mobile</option>
        </select>

        {(filterType || filterStatus || filterPlatform) && (
          <button
            onClick={() => { setFilterType(''); setFilterStatus(''); setFilterPlatform(''); }}
            className="text-sm text-slate-400 hover:text-white underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-background-card border border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-800/50 text-text-secondary text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-4">User</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Rating</th>
                  <th className="px-4 py-4">Message</th>
                  <th className="px-4 py-4">Platform</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.map((item) => {
                  const isExpanded = expanded.has(item.uuid);
                  return (
                    <tr key={item.uuid} className="hover:bg-gray-800/20 transition-colors align-top">
                      {/* User */}
                      <td className="px-4 py-4 min-w-[140px]">
                        {item.customer ? (
                          <div>
                            <div className="text-white font-medium text-sm">{item.customer.name}</div>
                            <div className="text-slate-500 text-xs">{item.customer.email || item.customer.phone}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">Guest</span>
                        )}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLES[item.feedback_type] || 'bg-gray-700 text-gray-300'}`}>
                            {FEEDBACK_TYPE_LABELS[item.feedback_type] || item.feedback_type}
                          </span>
                          {item.issue_type && (
                            <span className="text-xs text-slate-500">
                              {ISSUE_TYPE_LABELS[item.issue_type] || item.issue_type}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-4">
                        <StarRating rating={item.rating} />
                      </td>

                      {/* Message */}
                      <td className="px-4 py-4 max-w-xs">
                        <p className={`text-gray-300 text-sm ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {item.message}
                        </p>
                        {item.message.length > 100 && (
                          <button
                            onClick={() => toggleExpand(item.uuid)}
                            className="text-xs text-primary hover:underline mt-1"
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </td>

                      {/* Platform */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs capitalize">
                          <PlatformIcon platform={item.platform} />
                          {item.platform}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.uuid, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border bg-transparent cursor-pointer focus:outline-none ${STATUS_STYLES[item.status]}`}
                        >
                          <option value="new">New</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Calendar size={12} />
                          <div>
                            <div>{new Date(item.created_at).toLocaleDateString()}</div>
                            <div>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleDelete(item.uuid)}
                          className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-full transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-slate-500">
                      No feedback found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-800 flex justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => fetchFeedback(page - 1)}
              className="px-4 py-2 rounded bg-gray-800 text-white disabled:opacity-50 hover:bg-gray-700 transition"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-white text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => fetchFeedback(page + 1)}
              className="px-4 py-2 rounded bg-gray-800 text-white disabled:opacity-50 hover:bg-gray-700 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
