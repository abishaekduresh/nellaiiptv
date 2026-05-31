'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Radio, Search, Trash2, Loader2, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface AssignedStream {
  uuid: string;
  stream_name: string;
  stream_status: string | null;
  published_via: string | null;
  uptime: number | null;
  status: string;
  assigned_at: string;
}

interface AvailableStream {
  uuid: string;
  stream_name: string;
  stream_status: string | null;
  status: string;
}

interface Props {
  customerUuid: string;
  customerName: string;
  isOpen: boolean;
  onClose: () => void;
}

function fmtUptime(ms: number | null): string {
  if (!ms || ms <= 0) return '';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function CustomerStreamsModal({ customerUuid, customerName, isOpen, onClose }: Props) {
  const [assigned, setAssigned] = useState<AssignedStream[]>([]);
  const [available, setAvailable] = useState<AvailableStream[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);
  const [unassigning, setUnassigning] = useState<string | null>(null);

  const fetchAssigned = useCallback(async () => {
    if (!customerUuid) return;
    setLoadingAssigned(true);
    try {
      const res = await adminApi.get(`/admin/customers/${customerUuid}/streams`);
      setAssigned(res.data.data || []);
    } catch {
      toast.error('Failed to load assigned streams');
    } finally {
      setLoadingAssigned(false);
    }
  }, [customerUuid]);

  const fetchAvailable = useCallback(async () => {
    setLoadingAvailable(true);
    try {
      const res = await adminApi.get('/admin/streams', { params: { per_page: 200 } });
      setAvailable(res.data.data?.data || []);
    } catch {
      toast.error('Failed to load streams');
    } finally {
      setLoadingAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAssigned();
      fetchAvailable();
      setSearch('');
    }
  }, [isOpen, fetchAssigned, fetchAvailable]);

  const assignedUuids = new Set(assigned.map(s => s.uuid));

  const filteredAvailable = available.filter(s =>
    !assignedUuids.has(s.uuid) &&
    s.stream_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async (streamUuid: string) => {
    setAssigning(streamUuid);
    try {
      await adminApi.post(`/admin/customers/${customerUuid}/streams/${streamUuid}`);
      toast.success('Stream assigned');
      await fetchAssigned();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign stream');
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassign = async (streamUuid: string) => {
    setUnassigning(streamUuid);
    try {
      await adminApi.delete(`/admin/customers/${customerUuid}/streams/${streamUuid}`);
      toast.success('Stream removed');
      await fetchAssigned();
    } catch {
      toast.error('Failed to remove stream');
    } finally {
      setUnassigning(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Radio size={16} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Assigned Streams</h2>
              <p className="text-slate-400 text-xs">{customerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Currently Assigned */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Currently Assigned ({assigned.length})
            </h3>
            {loadingAssigned ? (
              <div className="flex items-center justify-center py-6 text-slate-500 gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : assigned.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No streams assigned yet</p>
            ) : (
              <div className="space-y-2">
                {assigned.map(s => (
                  <div key={s.uuid} className="flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${s.stream_status === 'online' ? 'bg-green-400' : 'bg-slate-600'}`} />
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{s.stream_name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          {s.published_via && <span>{s.published_via}</span>}
                          {s.uptime ? <span>⏱ {fmtUptime(s.uptime)}</span> : null}
                          <span>Added {new Date(s.assigned_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnassign(s.uuid)}
                      disabled={unassigning === s.uuid}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 shrink-0 ml-2"
                      title="Remove"
                    >
                      {unassigning === s.uuid ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Streams */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Add Stream</h3>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search streams..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-600"
              />
            </div>
            {loadingAvailable ? (
              <div className="flex items-center justify-center py-6 text-slate-500 gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : filteredAvailable.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                {search ? 'No streams match your search' : 'All streams are already assigned'}
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredAvailable.map(s => (
                  <div key={s.uuid} className="flex items-center justify-between bg-slate-800/40 border border-slate-700/30 rounded-xl px-4 py-2.5 hover:border-slate-600/60 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Wifi size={14} className="text-slate-500 shrink-0" />
                      <p className="text-slate-300 text-sm truncate">{s.stream_name}</p>
                    </div>
                    <button
                      onClick={() => handleAssign(s.uuid)}
                      disabled={assigning === s.uuid}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-50 shrink-0 ml-2 flex items-center gap-1.5"
                    >
                      {assigning === s.uuid ? <Loader2 size={12} className="animate-spin" /> : null}
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
