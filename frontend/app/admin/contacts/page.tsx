'use client';

import { useEffect, useState } from 'react';
import { Trash2, Loader2, Mail, Calendar } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import { toast } from 'react-hot-toast';

interface ContactMessage {
  uuid: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

export default function ContactsPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMessages = async (pageNum: number) => {
    try {
      setLoading(true);
      const res = await adminApi.get(`/admin/contacts?page=${pageNum}`);
      setMessages(res.data.data.data);
      setTotalPages(res.data.data.last_page);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch messages', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(1);
  }, []);

  const handleDelete = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await adminApi.delete(`/admin/contacts/${uuid}`);
      setMessages(messages.filter(m => m.uuid !== uuid));
      toast.success('Message deleted successfully');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <Mail className="text-primary" /> Contact Messages
      </h1>

      <div className="bg-background-card border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-800/50 text-text-secondary text-sm uppercase">
              <tr>
                <th className="px-6 py-4">Sender</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Message</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {messages.map((msg) => (
                <tr key={msg.uuid} className="hover:bg-gray-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-white">{msg.name}</div>
                      <div className="text-sm text-text-secondary">{msg.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{msg.subject}</td>
                  <td className="px-6 py-4 text-gray-300 max-w-md truncate" title={msg.message}>
                    {msg.message}
                  </td>
                  <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {new Date(msg.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(msg.uuid)}
                      className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-full transition-colors"
                      title="Delete Message"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    No messages found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-800 flex justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => fetchMessages(page - 1)}
              className="px-4 py-2 rounded bg-gray-800 text-white disabled:opacity-50 hover:bg-gray-700 transition"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-white">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => fetchMessages(page + 1)}
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
