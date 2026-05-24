'use client';

import { useState, useEffect } from 'react';
import adminApi from '@/lib/adminApi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { MessageSquare, Trash2, Search, EyeOff, Eye } from 'lucide-react';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get('/admin/comments');
      setComments(res.data.data);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, []);

  const handleDelete = async (uuid: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await adminApi.delete(`/admin/comments/${uuid}`);
      toast.success('Comment deleted');
      fetchComments();
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleStatusToggle = async (uuid: string, currentStatus: string) => {
    try {
      await adminApi.put(`/admin/comments/${uuid}/status`);
      toast.success(`Comment ${currentStatus === 'active' ? 'hidden' : 'shown'}`);
      fetchComments();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = comments.filter(c =>
    c.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.channel?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Channel Comments</h1>
        <p className="text-slate-400 text-sm mt-1">Moderate user comments across all channels</p>
      </div>

      {/* Table card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.12s' }}>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search comments, users, channels..."
              className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-slate-600"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-slate-500 text-sm shrink-0">{filtered.length} comment{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                {['User', 'Channel', 'Comment', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm">Loading comments...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <MessageSquare size={32} className="opacity-30" />
                    <span className="text-sm">No comments found</span>
                  </div>
                </td></tr>
              ) : filtered.map(comment => (
                <tr key={comment.uuid} className="hover:bg-slate-800/30 transition-colors align-top">
                  <td className="px-5 py-3.5">
                    <p className="text-white font-medium text-sm">{comment.customer?.name || 'Unknown'}</p>
                    <p className="text-slate-500 text-xs">{comment.customer?.phone}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-primary text-sm font-medium">{comment.channel?.name || '—'}</p>
                    <p className="text-slate-500 text-xs">CH {comment.channel?.channel_number || '-'}</p>
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <p className="text-slate-300 text-sm line-clamp-2">{comment.comment}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      comment.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-slate-500/15 text-slate-400'
                    }`}>
                      {comment.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                    {format(new Date(comment.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStatusToggle(comment.uuid, comment.status)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          comment.status === 'active'
                            ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                            : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        }`}
                        title={comment.status === 'active' ? 'Hide' : 'Show'}
                      >
                        {comment.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleDelete(comment.uuid)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
