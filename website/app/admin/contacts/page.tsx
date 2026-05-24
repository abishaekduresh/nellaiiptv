'use client';

import { useEffect, useState } from 'react';
import { Trash2, Mail, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(1); }, []);

  const handleDelete = async (uuid: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await adminApi.delete(`/admin/contacts/${uuid}`);
      setMessages(ms => ms.filter(m => m.uuid !== uuid));
      toast.success('Message deleted');
    } catch {
      toast.error('Failed to delete message');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Contact Messages</h1>
        <p className="text-slate-400 text-sm mt-1">Incoming messages from the website contact form</p>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.12s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                {['Sender', 'Subject', 'Message', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm">Loading messages...</span>
                  </div>
                </td></tr>
              ) : messages.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Mail size={32} className="opacity-30" />
                    <span className="text-sm">No messages found</span>
                  </div>
                </td></tr>
              ) : messages.map(msg => (
                <tr key={msg.uuid} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {msg.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{msg.name}</p>
                        <p className="text-slate-500 text-xs">{msg.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-white font-medium text-sm max-w-[180px] truncate">{msg.subject}</td>
                  <td className="px-5 py-3.5 text-slate-300 text-sm max-w-xs truncate" title={msg.message}>{msg.message}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <Calendar size={12} />
                      {new Date(msg.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleDelete(msg.uuid)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
            <button disabled={page <= 1} onClick={() => fetchMessages(page - 1)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all">
              <ChevronLeft size={15} /> Previous
            </button>
            <span className="text-slate-400 text-sm">Page <span className="text-white font-semibold">{page}</span> of <span className="text-white font-semibold">{totalPages}</span></span>
            <button disabled={page >= totalPages} onClick={() => fetchMessages(page + 1)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all">
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
