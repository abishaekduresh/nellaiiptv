'use client';

import { useEffect, useState } from 'react';
import {
  Tv, Trash2, Calendar, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, ExternalLink, Phone, Mail, Globe,
} from 'lucide-react';
import adminApi from '@/lib/adminApi';
import { toast } from 'react-hot-toast';

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost/backend/public/api').replace(/\/api$/, '');
const logoSrc = (url: string | null) => (!url ? null : url.startsWith('http') ? url : BACKEND_BASE + url);

interface OnboardingRequest {
  uuid: string;
  channel_name: string;
  logo_url: string | null;
  category: string;
  language: string;
  stream_url: string;
  website_url: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
}

const STATUS_FILTER_OPTS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const statusBadge = (status: string) => {
  if (status === 'approved')
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/20"><CheckCircle size={11} /> Approved</span>;
  if (status === 'rejected')
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20"><XCircle size={11} /> Rejected</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20"><Clock size={11} /> Pending</span>;
};

export default function ChannelOnboardingPage() {
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchRequests = async (p: number, status: string) => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page: p };
      if (status) params.status = status;
      const res = await adminApi.get('/admin/channel-onboarding', { params });
      setRequests(res.data.data.data);
      setTotalPages(res.data.data.last_page);
      setPage(p);
    } catch {
      toast.error('Failed to load onboarding requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(1, statusFilter); }, [statusFilter]);

  const handleStatusUpdate = async (uuid: string, status: 'approved' | 'rejected' | 'pending') => {
    setUpdating(uuid);
    try {
      await adminApi.put(`/admin/channel-onboarding/${uuid}/status`, {
        status,
        admin_notes: noteInput,
      });
      toast.success(`Status set to ${status}`);
      setExpandedUuid(null);
      setNoteInput('');
      fetchRequests(page, statusFilter);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Delete this onboarding request?')) return;
    try {
      await adminApi.delete(`/admin/channel-onboarding/${uuid}`);
      setRequests(prev => prev.filter(r => r.uuid !== uuid));
      toast.success('Request deleted');
    } catch {
      toast.error('Failed to delete request');
    }
  };

  const toggleExpand = (uuid: string, notes: string | null) => {
    if (expandedUuid === uuid) {
      setExpandedUuid(null);
      setNoteInput('');
    } else {
      setExpandedUuid(uuid);
      setNoteInput(notes ?? '');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Channel Onboarding</h1>
        <p className="text-slate-400 text-sm mt-1">Review and manage channel listing requests</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 animate-fade-up" style={{ animationDelay: '0.08s' }}>
        {STATUS_FILTER_OPTS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === opt.value
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.12s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                {['Channel', 'Category / Language', 'Contact', 'Stream URL', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span className="text-sm">Loading requests...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Tv size={32} className="opacity-30" />
                      <span className="text-sm">No onboarding requests found</span>
                    </div>
                  </td>
                </tr>
              ) : requests.map(req => (
                <>
                  <tr key={req.uuid} className="hover:bg-slate-800/30 transition-colors">
                    {/* Channel */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {logoSrc(req.logo_url) ? (
                          <img src={logoSrc(req.logo_url)!} alt={req.channel_name} className="w-8 h-8 rounded-lg object-contain bg-slate-800 border border-slate-700 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {req.channel_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium text-sm">{req.channel_name}</p>
                          {req.description && (
                            <p className="text-slate-500 text-xs truncate max-w-[160px]" title={req.description}>{req.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Category / Language */}
                    <td className="px-5 py-3.5">
                      <p className="text-white text-sm">{req.category}</p>
                      <p className="text-slate-500 text-xs">{req.language}</p>
                    </td>
                    {/* Contact */}
                    <td className="px-5 py-3.5">
                      <p className="text-white text-sm font-medium">{req.contact_name}</p>
                      <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                        <Mail size={10} />{req.contact_email}
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                        <Phone size={10} />{req.contact_phone}
                      </div>
                    </td>
                    {/* Stream URL */}
                    <td className="px-5 py-3.5">
                      <a
                        href={req.stream_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:text-cyan-400 text-xs transition-colors max-w-[160px] truncate"
                        title={req.stream_url}
                      >
                        <ExternalLink size={11} className="shrink-0" />
                        {req.stream_url}
                      </a>
                      {req.website_url && (
                        <a
                          href={req.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mt-1 transition-colors"
                        >
                          <Globe size={10} className="shrink-0" /> Website
                        </a>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">{statusBadge(req.status)}</td>
                    {/* Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Calendar size={12} />
                        {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleExpand(req.uuid, req.admin_notes)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            expandedUuid === req.uuid
                              ? 'bg-primary/20 text-primary'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleDelete(req.uuid)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded review panel */}
                  {expandedUuid === req.uuid && (
                    <tr key={`${req.uuid}-expand`}>
                      <td colSpan={7} className="px-5 py-4 bg-slate-800/40 border-b border-slate-700">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1">
                            <label className="block text-xs font-semibold text-slate-400 mb-2">Admin Notes (optional)</label>
                            <textarea
                              value={noteInput}
                              onChange={e => setNoteInput(e.target.value)}
                              rows={2}
                              placeholder="Add notes about approval/rejection reason..."
                              className="w-full bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none placeholder:text-slate-600 transition-all"
                            />
                          </div>
                          <div className="flex sm:flex-col gap-2 sm:justify-start pt-0 sm:pt-6">
                            <button
                              onClick={() => handleStatusUpdate(req.uuid, 'approved')}
                              disabled={updating === req.uuid}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(req.uuid, 'rejected')}
                              disabled={updating === req.uuid}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(req.uuid, 'pending')}
                              disabled={updating === req.uuid}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              <Clock size={14} /> Pending
                            </button>
                          </div>
                        </div>
                        {req.admin_notes && (
                          <p className="mt-3 text-xs text-slate-500">
                            <span className="font-semibold text-slate-400">Previous note:</span> {req.admin_notes}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
            <button
              disabled={page <= 1}
              onClick={() => fetchRequests(page - 1, statusFilter)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all"
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <span className="text-slate-400 text-sm">
              Page <span className="text-white font-semibold">{page}</span> of <span className="text-white font-semibold">{totalPages}</span>
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => fetchRequests(page + 1, statusFilter)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
