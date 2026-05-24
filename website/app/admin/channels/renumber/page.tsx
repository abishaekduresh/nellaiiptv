'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { Search, Save, RotateCcw, AlertCircle, Loader2, CheckCircle2, Hash, Play, X, Tv, WifiOff, RefreshCw, Copy, ArrowRight, ShieldCheck, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface Channel {
  uuid: string;
  name: string;
  channel_number: number | null;
  status: string;
  category?: { name: string };
  thumbnail_url?: string;
  hls_url?: string;
}

/* ── Channel Preview Modal ──────────────────────────────────────────── */
type PlayerStatus = 'loading' | 'playing' | 'buffering' | 'error' | 'no-url';

function ChannelPreviewModal({ channel, onClose }: { channel: Channel; onClose: () => void }) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const hlsRef    = useRef<Hls | null>(null);
  const [status, setStatus]     = useState<PlayerStatus>(channel.hls_url ? 'loading' : 'no-url');
  const [errorMsg, setErrorMsg] = useState('');

  const startPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || !channel.hls_url) return;

    hlsRef.current?.destroy();
    setStatus('loading');
    setErrorMsg('');

    video.onwaiting = () => setStatus(s => s === 'playing' ? 'buffering' : s);
    video.onplaying  = () => setStatus('playing');
    video.onerror    = () => { setStatus('error'); setErrorMsg('Playback error'); };

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(channel.hls_url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) { setStatus('error'); setErrorMsg(data.details ?? 'Stream unavailable'); }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.hls_url;
      video.play().catch(() => {});
    }
  }, [channel.hls_url]);

  useEffect(() => {
    startPlayer();
    return () => { hlsRef.current?.destroy(); };
  }, [startPlayer]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isLive = status === 'playing' || status === 'buffering';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-slate-950 border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl shadow-black/70 animate-fade-up"
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            {channel.thumbnail_url
              ? <img src={channel.thumbnail_url} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-800 shrink-0 ring-1 ring-white/10" />
              : <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0"><Tv size={16} className="text-slate-400" /></div>
            }
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-bold text-sm truncate">{channel.name}</p>
                {channel.channel_number != null && (
                  <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                    #{channel.channel_number}
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs truncate mt-0.5">
                {channel.category?.name ?? 'Uncategorised'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            {isLive && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-red-500 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Player area ── */}
        <div className="relative bg-black aspect-video w-full">

          {/* Actual video element — always mounted when URL exists */}
          {channel.hls_url && (
            <video
              ref={videoRef}
              className="w-full h-full"
              playsInline
            />
          )}

          {/* Loading overlay */}
          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <svg className="absolute inset-0 animate-spin w-16 h-16 text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {channel.thumbnail_url && (
                  <img src={channel.thumbnail_url} alt="" className="absolute inset-2 rounded-full object-cover opacity-50" />
                )}
              </div>
              <div className="text-center">
                <p className="text-white text-sm font-semibold">Connecting to stream…</p>
                <p className="text-slate-600 text-xs mt-1 font-mono truncate max-w-xs px-4">{channel.hls_url}</p>
              </div>
            </div>
          )}

          {/* Mid-playback buffering */}
          {status === 'buffering' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                <svg className="animate-spin w-6 h-6 text-white/80" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 gap-5">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <WifiOff size={28} className="text-red-400" />
              </div>
              <div className="text-center px-6">
                <p className="text-white font-semibold text-base mb-1.5">Stream unavailable</p>
                <p className="text-slate-500 text-xs leading-relaxed font-mono">{errorMsg || 'Could not load the stream'}</p>
              </div>
              <button
                onClick={startPlayer}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
              >
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          )}

          {/* No URL configured */}
          {status === 'no-url' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-3 text-slate-600">
              <Tv size={44} className="opacity-20" />
              <p className="text-sm">No stream URL configured for this channel</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center gap-3 px-5 py-3 bg-slate-900/80 border-t border-slate-800">
          {/* Status dot */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-2 h-2 rounded-full ${
              channel.status === 'active'  ? 'bg-green-400' :
              channel.status === 'blocked' ? 'bg-orange-400' :
              channel.status === 'deleted' ? 'bg-red-400' : 'bg-slate-500'
            }`} />
            <span className="text-xs text-slate-500 capitalize">{channel.status}</span>
          </div>

          {channel.hls_url && (
            <>
              <span className="text-slate-700 text-xs shrink-0">·</span>
              <span className="text-xs text-slate-600 font-mono truncate flex-1">{channel.hls_url}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(channel.hls_url!); toast.success('URL copied!'); }}
                className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors shrink-0"
                title="Copy stream URL"
              >
                <Copy size={13} />
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

/* ── Confirm Save Modal ─────────────────────────────────────────────── */
interface ChangePreview {
  uuid: string;
  name: string;
  thumbnail_url?: string;
  numberChange?: { from: number | null; to: number };
  statusChange?: { from: string; to: string };
}

const STATUS_DOT: Record<string, string> = {
  active: 'bg-green-400', inactive: 'bg-slate-400',
  blocked: 'bg-orange-400', deleted: 'bg-red-400',
};

function ConfirmSaveModal({ changes, onConfirm, onCancel, saving }: {
  changes: ChangePreview[];
  onConfirm: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel, saving]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={() => { if (!saving) onCancel(); }}
    >
      <div
        className="relative w-full max-w-lg bg-slate-950 border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl animate-fade-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={17} className="text-amber-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Confirm Changes</p>
              <p className="text-slate-500 text-xs mt-0.5">
                {changes.length} channel{changes.length !== 1 ? 's' : ''} will be updated
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={saving}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40"
          >
            <X size={17} />
          </button>
        </div>

        {/* Change list */}
        <div className="overflow-y-auto max-h-[360px] divide-y divide-slate-800/60">
          {changes.map(ch => (
            <div key={ch.uuid} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-900/40 transition-colors">
              {/* Thumbnail */}
              {ch.thumbnail_url
                ? <img src={ch.thumbnail_url} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-800 shrink-0 ring-1 ring-white/10 mt-0.5" />
                : <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5"><Tv size={14} className="text-slate-500" /></div>
              }

              {/* Channel name + changes */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate mb-1.5">{ch.name}</p>
                <div className="space-y-1">
                  {ch.numberChange && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 w-14 shrink-0">Number</span>
                      <span className="font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        #{ch.numberChange.from ?? '—'}
                      </span>
                      <ArrowRight size={11} className="text-slate-600 shrink-0" />
                      <span className="font-mono text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
                        #{ch.numberChange.to}
                      </span>
                    </div>
                  )}
                  {ch.statusChange && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 w-14 shrink-0">Status</span>
                      <span className={`flex items-center gap-1 capitalize px-1.5 py-0.5 rounded bg-slate-800 text-slate-400`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[ch.statusChange.from] ?? 'bg-slate-500'}`} />
                        {ch.statusChange.from}
                      </span>
                      <ArrowRight size={11} className="text-slate-600 shrink-0" />
                      <span className={`flex items-center gap-1 capitalize px-1.5 py-0.5 rounded bg-slate-800 font-semibold ${
                        ch.statusChange.to === 'active'   ? 'text-green-400' :
                        ch.statusChange.to === 'blocked'  ? 'text-orange-400' :
                        ch.statusChange.to === 'deleted'  ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[ch.statusChange.to] ?? 'bg-slate-500'}`} />
                        {ch.statusChange.to}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 bg-slate-900/80 border-t border-slate-800">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all disabled:opacity-40 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
          >
            {saving
              ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Saving…</>
              : <><Save size={14} /> Save {changes.length} Change{changes.length !== 1 ? 's' : ''}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
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
  const [previewChannel, setPreviewChannel] = useState<Channel | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showGaps, setShowGaps] = useState(false);

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

  // Status-wise counts (respect dirty status changes)
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { active: 0, inactive: 0, blocked: 0, deleted: 0 };
    channels.forEach(ch => {
      const s = dirtyStatuses[ch.uuid] ?? ch.status;
      c[s] = (c[s] ?? 0) + 1;
    });
    return c;
  }, [channels, dirtyStatuses]);

  // Channels with no assigned number
  const unassignedChannels = useMemo(() =>
    channels.filter(ch => {
      const raw = dirtyNumbers[ch.uuid] ?? String(ch.channel_number ?? '');
      const n = parseInt(raw, 10);
      return isNaN(n) || n < 1;
    }),
  [channels, dirtyNumbers]);

  // Gap numbers: integers in [1..max] not assigned to any channel
  const gapNumbers = useMemo(() => {
    const assigned = new Set(Object.keys(numberCounts).map(Number));
    if (assigned.size === 0) return [];
    const max = Math.max(...Array.from(assigned));
    const gaps: number[] = [];
    for (let i = 1; i < max; i++) { if (!assigned.has(i)) gaps.push(i); }
    return gaps;
  }, [numberCounts]);

  // Format gap numbers into compact ranges: [1,2,3,5,6,9] → "1–3, 5–6, 9"
  const gapRanges = useMemo(() => {
    if (gapNumbers.length === 0) return '';
    const ranges: string[] = [];
    let start = gapNumbers[0], end = gapNumbers[0];
    for (let i = 1; i < gapNumbers.length; i++) {
      if (gapNumbers[i] === end + 1) { end = gapNumbers[i]; }
      else { ranges.push(start === end ? `${start}` : `${start}–${end}`); start = end = gapNumbers[i]; }
    }
    ranges.push(start === end ? `${start}` : `${start}–${end}`);
    return ranges.join(', ');
  }, [gapNumbers]);

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

  // Step 1 — validate then open confirm modal
  const handleSave = () => {
    if (!isDirty || hasDuplicates || saving) return;
    for (const uuid of Array.from(changedUuids)) {
      if (dirtyNumbers[uuid] !== undefined) {
        const n = parseInt(dirtyNumbers[uuid], 10);
        if (!n || n < 1) { toast.error('Invalid channel number — fix before saving'); return; }
      }
    }
    setShowConfirm(true);
  };

  // Step 2 — called when user confirms in the modal
  const handleConfirmedSave = async () => {
    const updates: { uuid: string; channel_number?: number; status?: string }[] = [];
    for (const uuid of Array.from(changedUuids)) {
      const entry: { uuid: string; channel_number?: number; status?: string } = { uuid };
      if (dirtyNumbers[uuid] !== undefined) entry.channel_number = parseInt(dirtyNumbers[uuid], 10);
      if (dirtyStatuses[uuid] !== undefined) entry.status = dirtyStatuses[uuid];
      updates.push(entry);
    }
    if (updates.length === 0) { toast.error('No valid changes to save'); return; }

    setSaving(true);
    try {
      await adminApi.post('/admin/channels/batch-renumber', { updates });
      toast.success(`Updated ${updates.length} channel(s)`);
      setDirtyNumbers({});
      setDirtyStatuses({});
      setShowConfirm(false);
      await fetchChannels();
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Failed to save changes';
      const details: string[] = err.response?.data?.errors ?? [];
      toast.error(details.length ? details[0] : msg);
    } finally {
      setSaving(false);
    }
  };

  // Build the preview data for the confirm modal
  const confirmChanges: ChangePreview[] = useMemo(() => {
    return Array.from(changedUuids).map(uuid => {
      const ch = channels.find(c => c.uuid === uuid)!;
      const preview: ChangePreview = { uuid, name: ch?.name ?? uuid, thumbnail_url: ch?.thumbnail_url };
      if (dirtyNumbers[uuid] !== undefined)
        preview.numberChange = { from: ch?.channel_number ?? null, to: parseInt(dirtyNumbers[uuid], 10) };
      if (dirtyStatuses[uuid] !== undefined)
        preview.statusChange = { from: ch?.status ?? '', to: dirtyStatuses[uuid] };
      return preview;
    }).sort((a, b) => (a.numberChange?.to ?? 0) - (b.numberChange?.to ?? 0));
  }, [changedUuids, channels, dirtyNumbers, dirtyStatuses]);

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

        {/* Status + Preview */}
        <td className={`px-3 py-2.5 ${rowBg}`}>
          <div className="flex items-center gap-2">
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
            <button
              onClick={() => setPreviewChannel(ch)}
              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
              title="Preview stream"
            >
              <Play size={12} />
            </button>
          </div>
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
      {previewChannel && (
        <ChannelPreviewModal channel={previewChannel} onClose={() => setPreviewChannel(null)} />
      )}
      {showConfirm && (
        <ConfirmSaveModal
          changes={confirmChanges}
          saving={saving}
          onConfirm={handleConfirmedSave}
          onCancel={() => { if (!saving) setShowConfirm(false); }}
        />
      )}
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

      {/* Stats + gap numbers */}
      {!loading && (
        <div className="space-y-3">

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-medium">Total</span>
              <span className="text-2xl font-black text-white">{channels.length}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />Active
              </span>
              <span className="text-2xl font-black text-green-400">{statusCounts.active ?? 0}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />Inactive
              </span>
              <span className="text-2xl font-black text-slate-400">{statusCounts.inactive ?? 0}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />Blocked
              </span>
              <span className="text-2xl font-black text-orange-400">{statusCounts.blocked ?? 0}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />Deleted
              </span>
              <span className="text-2xl font-black text-red-400">{statusCounts.deleted ?? 0}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />No Number
              </span>
              <span className="text-2xl font-black text-amber-400">{unassignedChannels.length}</span>
            </div>
          </div>

          {/* Available gap numbers */}
          {gapNumbers.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/40 transition-colors"
                onClick={() => setShowGaps(v => !v)}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                  <span className="text-sm font-medium text-white">Available Gap Numbers</span>
                  <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {gapNumbers.length} slot{gapNumbers.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <ChevronDown
                  size={15}
                  className={`text-slate-400 transition-transform duration-200 ${showGaps ? 'rotate-180' : ''}`}
                />
              </button>
              {showGaps && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800">
                  <p className="text-xs text-slate-500 mb-2">
                    These numbers are not assigned to any channel — they are free to use.
                  </p>
                  <p className="text-sm font-mono text-slate-300 leading-relaxed break-all">{gapRanges}</p>
                </div>
              )}
            </div>
          )}

        </div>
      )}

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
                  <th className="px-3 py-3 text-slate-600 font-medium text-xs w-10 text-right">#</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium w-36">Channel #</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium">Channel Name</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium hidden xl:table-cell">Category</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium w-36">Status</th>
                  <th className="w-px p-0 bg-gray-800" aria-hidden />
                  <th className="px-3 py-3 text-slate-600 font-medium text-xs w-10 text-right">#</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium w-36">Channel #</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium">Channel Name</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium hidden xl:table-cell">Category</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium w-36">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {rows.map(([ch1, ch2], i) => (
                  <tr key={i}>
                    <td className="px-3 py-2.5 text-right text-xs text-slate-600 font-mono w-10 select-none">{i * 2 + 1}</td>
                    {renderCells(ch1)}
                    <td className="w-px p-0 bg-gray-800/70" />
                    <td className="px-3 py-2.5 text-right text-xs text-slate-600 font-mono w-10 select-none">{ch2 ? i * 2 + 2 : ''}</td>
                    {ch2 ? renderCells(ch2) : <td colSpan={4} />}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center py-14 text-slate-400">
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
