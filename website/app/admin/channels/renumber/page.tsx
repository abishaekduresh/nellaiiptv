'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Save, RotateCcw, AlertCircle, Loader2, CheckCircle2, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface Channel {
  uuid: string;
  name: string;
  channel_number: number | null;
  status: string;
  category?: { name: string };
  thumbnail_url?: string;
}

const STATUSES = ['active', 'inactive', 'blocked', 'deleted'] as const;

function statusColor(s: string) {
  if (s === 'active')   return 'text-green-400  border-green-700';
  if (s === 'blocked')  return 'text-orange-400 border-orange-700';
  if (s === 'deleted')  return 'text-red-400    border-red-700';
  return 'text-gray-400 border-gray-600';
}

export default function ChannelRenumberPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Separate dirty maps — only touched rows are stored
  const [dirtyNumbers, setDirtyNumbers] = useState<Record<string, string>>({});
  const [dirtyStatuses, setDirtyStatuses] = useState<Record<string, string>>({});

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/channels', {
        params: { per_page: 1000, sort_by: 'channel_number', sort_order: 'asc' },
      });
      const raw = res.data.data;
      setChannels(Array.isArray(raw) ? raw : (raw?.data ?? []));
    } catch {
      toast.error('Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChannels(); }, []);

  // Search by name OR channel number
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return channels.filter(ch => {
      const matchSearch = !q ||
        ch.name.toLowerCase().includes(q) ||
        String(ch.channel_number ?? '').includes(q);
      const matchStatus = !statusFilter || ch.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [channels, search, statusFilter]);

  // Count how many times each number appears (dirty overrides original)
  const numberCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    channels.forEach(ch => {
      const raw = dirtyNumbers[ch.uuid] ?? String(ch.channel_number ?? '');
      const n = parseInt(raw, 10);
      if (!isNaN(n) && n > 0) counts[n] = (counts[n] ?? 0) + 1;
    });
    return counts;
  }, [channels, dirtyNumbers]);

  const duplicateNumbers = useMemo(() => {
    const set = new Set<number>();
    Object.entries(numberCounts).forEach(([num, count]) => {
      if (count > 1) set.add(Number(num));
    });
    return set;
  }, [numberCounts]);

  // All UUIDs with any change
  const changedUuids = useMemo(
    () => new Set([...Object.keys(dirtyNumbers), ...Object.keys(dirtyStatuses)]),
    [dirtyNumbers, dirtyStatuses],
  );
  const isDirty = changedUuids.size > 0;
  const hasDuplicates = duplicateNumbers.size > 0;
  const changedCount = changedUuids.size;

  const handleNumberChange = (uuid: string, original: number | null, value: string) => {
    const originalStr = String(original ?? '');
    if (value === originalStr) {
      setDirtyNumbers(prev => { const n = { ...prev }; delete n[uuid]; return n; });
    } else {
      setDirtyNumbers(prev => ({ ...prev, [uuid]: value }));
    }
  };

  const handleStatusChange = (uuid: string, original: string, value: string) => {
    if (value === original) {
      setDirtyStatuses(prev => { const n = { ...prev }; delete n[uuid]; return n; });
    } else {
      setDirtyStatuses(prev => ({ ...prev, [uuid]: value }));
    }
  };

  const handleReset = () => { setDirtyNumbers({}); setDirtyStatuses({}); };

  const handleSave = async () => {
    if (!isDirty || hasDuplicates || saving) return;

    const updates: { uuid: string; channel_number?: number; status?: string }[] = [];

    for (const uuid of Array.from(changedUuids)) {
      const entry: { uuid: string; channel_number?: number; status?: string } = { uuid };
      if (dirtyNumbers[uuid] !== undefined) {
        const n = parseInt(dirtyNumbers[uuid], 10);
        if (!n || n < 1) { toast.error('Invalid channel number — fix before saving'); return; }
        entry.channel_number = n;
      }
      if (dirtyStatuses[uuid] !== undefined) {
        entry.status = dirtyStatuses[uuid];
      }
      updates.push(entry);
    }

    if (updates.length === 0) { toast.error('No valid changes to save'); return; }

    setSaving(true);
    try {
      await adminApi.post('/admin/channels/batch-renumber', { updates });
      toast.success(`Updated ${updates.length} channel(s)`);
      setDirtyNumbers({});
      setDirtyStatuses({});
      await fetchChannels();
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Failed to save changes';
      const details: string[] = err.response?.data?.errors ?? [];
      toast.error(details.length ? details[0] : msg);
    } finally {
      setSaving(false);
    }
  };

  // Render the 4 cells for one channel entry
  const renderCells = (ch: Channel) => {
    const currentNum    = dirtyNumbers[ch.uuid] ?? String(ch.channel_number ?? '');
    const currentStatus = dirtyStatuses[ch.uuid] ?? ch.status;
    const isNumChanged  = dirtyNumbers[ch.uuid]  !== undefined;
    const isStChanged   = dirtyStatuses[ch.uuid] !== undefined;
    const isChanged     = isNumChanged || isStChanged;
    const numVal        = parseInt(currentNum, 10);
    const isDuplicate   = !isNaN(numVal) && numVal > 0 && duplicateNumbers.has(numVal);

    const rowBg = isDuplicate ? 'bg-red-500/5' : isChanged ? 'bg-amber-500/5' : '';

    return (
      <>
        {/* Channel # */}
        <td className={`px-3 py-2.5 ${rowBg}`}>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              value={currentNum}
              onChange={e => handleNumberChange(ch.uuid, ch.channel_number, e.target.value)}
              className={`w-20 px-2 py-1.5 rounded-md border text-white text-sm bg-slate-900/80 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                isDuplicate  ? 'border-red-500 focus:border-red-400' :
                isNumChanged ? 'border-amber-500 focus:border-amber-400' :
                               'border-gray-700 focus:border-primary'
              }`}
            />
            {isDuplicate  && <AlertCircle  size={13} className="text-red-400   shrink-0" />}
            {isNumChanged && !isDuplicate && <CheckCircle2 size={13} className="text-amber-400 shrink-0" />}
          </div>
        </td>

        {/* Channel Name */}
        <td className={`px-3 py-2.5 max-w-[160px] ${rowBg}`}>
          <div className="flex items-center gap-2 min-w-0">
            {ch.thumbnail_url && (
              <img src={ch.thumbnail_url} alt="" className="w-7 h-7 rounded object-cover shrink-0 bg-slate-800" />
            )}
            <span className={`truncate text-sm font-medium ${isChanged ? 'text-amber-200' : 'text-white'}`}>
              {ch.name}
            </span>
          </div>
        </td>

        {/* Category */}
        <td className={`px-3 py-2.5 text-slate-400 text-sm hidden xl:table-cell ${rowBg}`}>
          {ch.category?.name ?? '—'}
        </td>

        {/* Status — editable dropdown */}
        <td className={`px-3 py-2.5 ${rowBg}`}>
          <select
            value={currentStatus}
            onChange={e => handleStatusChange(ch.uuid, ch.status, e.target.value)}
            className={`px-2 py-1 rounded-md border text-xs font-medium bg-slate-900/80 focus:outline-none transition-colors capitalize cursor-pointer ${
              isStChanged ? 'border-amber-500' : 'border-gray-700 focus:border-primary'
            } ${statusColor(currentStatus)}`}
          >
            {STATUSES.map(s => (
              <option key={s} value={s} className="bg-slate-900 text-white capitalize">{s}</option>
            ))}
          </select>
        </td>
      </>
    );
  };

  // Pair channels into rows of 2
  const rows = useMemo(() => {
    const pairs: [Channel, Channel | null][] = [];
    for (let i = 0; i < filtered.length; i += 2) {
      pairs.push([filtered[i], filtered[i + 1] ?? null]);
    }
    return pairs;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Hash size={20} className="text-primary" />
            <h1 className="text-2xl font-bold text-white">Channel Manager</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Edit channel numbers and status inline. Amber = changed, Red = duplicate. Save when done.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isDirty && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
            >
              <RotateCcw size={14} />
              Reset ({changedCount})
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty || hasDuplicates || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors font-medium"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : `Save Changes${isDirty ? ` (${changedCount})` : ''}`}
          </button>
        </div>
      </div>

      {/* Duplicate warning */}
      {hasDuplicates && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>
            Duplicate numbers detected:{' '}
            <strong>{Array.from(duplicateNumbers).sort((a, b) => a - b).join(', ')}</strong>
            . Resolve before saving.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or channel number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-gray-700 rounded-lg text-white placeholder-text-secondary text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900/80 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      {/* Table — 2 channels per row */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={26} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-white/2">
                  <th className="text-left px-3 py-3 text-slate-400 font-medium w-36">Channel #</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium">Channel Name</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium hidden xl:table-cell">Category</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium w-28">Status</th>
                  <th className="w-px p-0 bg-gray-800" aria-hidden />
                  <th className="text-left px-3 py-3 text-slate-400 font-medium w-36">Channel #</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium">Channel Name</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium hidden xl:table-cell">Category</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium w-28">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {rows.map(([ch1, ch2], i) => (
                  <tr key={i}>
                    {renderCells(ch1)}
                    <td className="w-px p-0 bg-gray-800/70" />
                    {ch2 ? renderCells(ch2) : <td colSpan={4} />}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-14 text-slate-400">
                      No channels match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && (
        <p className="text-slate-400 text-xs">
          Showing {filtered.length} of {channels.length} channels
          {isDirty && ` — ${changedCount} unsaved change(s)`}
        </p>
      )}
    </div>
  );
}
