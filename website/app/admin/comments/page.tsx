'use client';

import { useState, useEffect } from 'react';
import adminApi from '@/lib/adminApi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { MessageSquare, Trash2, Search, Filter } from 'lucide-react';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get('/admin/comments');
      setComments(res.data.data);
    } catch (error) {
      console.error('Failed to fetch comments', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleDelete = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await adminApi.delete(`/admin/comments/${uuid}`);
      toast.success('Comment deleted successfully');
      fetchComments(); // Refresh list
    } catch (error) {
      console.error('Failed to delete comment', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleStatusToggle = async (uuid: string, currentStatus: string) => {
    try {
      await adminApi.put(`/admin/comments/${uuid}/status`);
      toast.success(`Comment ${currentStatus === 'active' ? 'deactivated' : 'activated'} successfully`);
      fetchComments();
    } catch (error) {
      console.error('Failed to update status', error);
      toast.error('Failed to update status');
    }
  };

  const filteredComments = comments.filter(comment => 
    comment.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.channel?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Channel Comments</h1>
          <p className="text-text-secondary">Manage user comments on channels</p>
        </div>
      </div>

      <div className="bg-background-card rounded-xl border border-gray-800 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search comments, users, or channels..." 
                    className="w-full bg-slate-900 border border-gray-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="text-sm text-gray-400">
                {filteredComments.length} comments found
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-gray-800">
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Channel</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider w-1/3">Comment</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                    Loading comments...
                  </td>
                </tr>
              ) : filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                    No comments found matching your search.
                  </td>
                </tr>
              ) : (
                filteredComments.map((comment) => (
                  <tr key={comment.uuid} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4">
                      <div className="font-medium text-white">{comment.customer?.name || 'Unknown User'}</div>
                      <div className="text-xs text-gray-500">{comment.customer?.phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-primary font-medium">{comment.channel?.name || 'Unknown Channel'}</div>
                      <div className="text-xs text-gray-500">CH: {comment.channel?.channel_number || '-'}</div>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-300 text-sm">{comment.comment}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        comment.status === 'active' 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {comment.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleStatusToggle(comment.uuid, comment.status)}
                          className={`p-2 rounded-lg transition-colors ${
                            comment.status === 'active' 
                              ? 'text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300' 
                              : 'text-green-400 hover:bg-green-500/10 hover:text-green-300'
                          }`}
                          title={comment.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          <Filter size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(comment.uuid)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Comment"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
