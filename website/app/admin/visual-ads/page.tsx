'use client';

import { useEffect, useState, useCallback } from 'react';
import adminApi from '@/lib/adminApi';
import toast from 'react-hot-toast';
import {
  Film, Plus, Edit2, Trash2, X, Save, Loader2,
  Eye, SkipForward, MousePointerClick, TrendingUp,
  Calendar, Users, Globe, ToggleLeft, ToggleRight, Play,
} from 'lucide-react';

interface VisualAd {
  uuid: string;
  title: string;
  description: string | null;
  ad_url: string;
  click_url: string | null;
  thumbnail_url: string | null;
  is_skippable: boolean;
  skip_after_seconds: number;
  duration_seconds: number;
  show_for_guests: boolean;
  show_for_free_users: boolean;
  max_impressions_per_session: number;
  display_frequency: number;
  weight: number;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'inactive';
  total_impressions: number;
  total_skips: number;
  total_clicks: number;
  created_at: string;
}

const EMPTY: Omit<VisualAd, 'uuid' | 'total_impressions' | 'total_skips' | 'total_clicks' | 'created_at'> = {
  title: '', description: '', ad_url: '', click_url: '', thumbnail_url: '',
  is_skippable: true, skip_after_seconds: 5, duration_seconds: 30,
  show_for_guests: true, show_for_free_users: true,
  max_impressions_per_session: 3, display_frequency: 1, weight: 1,
  start_date: '', end_date: '', status: 'active',
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
    >
      {checked
        ? <ToggleRight size={22} className="text-emerald-400" />
        : <ToggleLeft  size={22} className="text-slate-600" />}
      {label}
    </button>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-600 mt-1">{hint}</p>}
    </div>
  );
}

function inp(cls = '') {
  return `w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-slate-600 ${cls}`;
}

export default function VisualAdsPage() {
  const [ads, setAds]         = useState<VisualAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState<VisualAd | null>(null);
  const [form, setForm]         = useState({ ...EMPTY });
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/visual-ads');
      setAds(res.data.data ?? []);
    } catch { toast.error('Failed to load visual ads'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY }); setShowModal(true); };
  const openEdit   = (ad: VisualAd) => {
    setEditing(ad);
    setForm({
      title: ad.title, description: ad.description ?? '', ad_url: ad.ad_url,
      click_url: ad.click_url ?? '', thumbnail_url: ad.thumbnail_url ?? '',
      is_skippable: ad.is_skippable, skip_after_seconds: ad.skip_after_seconds,
      duration_seconds: ad.duration_seconds, show_for_guests: ad.show_for_guests,
      show_for_free_users: ad.show_for_free_users,
      max_impressions_per_session: ad.max_impressions_per_session,
      display_frequency: ad.display_frequency, weight: ad.weight,
      start_date: ad.start_date ?? '', end_date: ad.end_date ?? '',
      status: ad.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.ad_url.trim()) { toast.error('Ad URL is required'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        start_date: form.start_date || null,
        end_date:   form.end_date   || null,
        description:    form.description    || null,
        click_url:      form.click_url      || null,
        thumbnail_url:  form.thumbnail_url  || null,
      };
      if (editing) {
        await adminApi.put(`/admin/visual-ads/${editing.uuid}`, payload);
        toast.success('Visual ad updated');
      } else {
        await adminApi.post('/admin/visual-ads', payload);
        toast.success('Visual ad created');
      }
      setShowModal(false);
      fetchAds();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Delete this visual ad?')) return;
    setDeleting(uuid);
    try {
      await adminApi.delete(`/admin/visual-ads/${uuid}`);
      toast.success('Deleted');
      setAds(prev => prev.filter(a => a.uuid !== uuid));
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  };

  const toggleStatus = async (ad: VisualAd) => {
    const next = ad.status === 'active' ? 'inactive' : 'active';
    try {
      await adminApi.put(`/admin/visual-ads/${ad.uuid}`, { status: next });
      setAds(prev => prev.map(a => a.uuid === ad.uuid ? { ...a, status: next } : a));
    } catch { toast.error('Failed to update status'); }
  };

  const skipRate = (ad: VisualAd) =>
    ad.total_impressions > 0 ? Math.round((ad.total_skips / ad.total_impressions) * 100) : 0;

  const ctr = (ad: VisualAd) =>
    ad.total_impressions > 0 ? ((ad.total_clicks / ad.total_impressions) * 100).toFixed(1) : '0.0';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Visual Ads</h1>
          <p className="text-slate-400 text-sm mt-1">YouTube-style pre-roll video ads shown before channel playback</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-cyan-500 text-white rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20"
        >
          <Plus size={16} /> New Ad
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={28} className="animate-spin mr-3" /> Loading…
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <Film size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">No visual ads yet</p>
          <p className="text-slate-600 text-sm mt-1">Create your first pre-roll video ad</p>
          <button onClick={openCreate} className="mt-4 px-5 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-cyan-500 transition-colors">
            Create Ad
          </button>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-up">
          {ads.map(ad => (
            <div key={ad.uuid} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all">
              <div className="flex items-start gap-4 p-5">
                {/* Thumbnail */}
                <div className="w-24 h-16 bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center">
                  {ad.thumbnail_url
                    ? <img src={ad.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    : <Play size={20} className="text-slate-600" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-bold text-sm truncate">{ad.title}</h3>
                        <button onClick={() => toggleStatus(ad)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                            ad.status === 'active'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : 'bg-slate-700/40 border-slate-700 text-slate-500'
                          }`}>
                          {ad.status}
                        </button>
                        {ad.is_skippable
                          ? <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-500/10 border border-blue-500/20 text-blue-400">Skippable after {ad.skip_after_seconds}s</span>
                          : <span className="px-2 py-0.5 rounded-full text-[11px] bg-red-500/10 border border-red-500/20 text-red-400">Non-skippable</span>}
                      </div>
                      {ad.description && <p className="text-slate-500 text-xs mt-1 truncate">{ad.description}</p>}
                      <p className="text-slate-600 text-[11px] mt-1 font-mono truncate">{ad.ad_url}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => openEdit(ad)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(ad.uuid)}
                        disabled={deleting === ad.uuid}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-40">
                        {deleting === ad.uuid ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-4 mt-3">
                    {[
                      { icon: Eye,              label: 'Impressions', value: ad.total_impressions.toLocaleString() },
                      { icon: SkipForward,       label: 'Skips',       value: `${ad.total_skips.toLocaleString()} (${skipRate(ad)}%)` },
                      { icon: MousePointerClick, label: 'Clicks',      value: `${ad.total_clicks.toLocaleString()} (${ctr(ad)}% CTR)` },
                      { icon: TrendingUp,        label: 'Weight',      value: `×${ad.weight}` },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Icon size={12} className="text-slate-600" />
                        <span className="text-slate-600">{label}:</span>
                        <span className="text-slate-300 font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Targeting chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ad.show_for_guests    && <span className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-slate-400">Guests</span>}
                    {ad.show_for_free_users && <span className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-slate-400">Free users</span>}
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-slate-400">
                      {ad.duration_seconds}s • every {ad.display_frequency === 1 ? 'switch' : `${ad.display_frequency} switches`} • max {ad.max_impressions_per_session === 0 ? '∞' : ad.max_impressions_per_session}/session
                    </span>
                    {(ad.start_date || ad.end_date) && (
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-slate-400">
                        {ad.start_date ?? '∞'} → {ad.end_date ?? '∞'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/80 backdrop-blur-md overflow-y-auto"
          onClick={() => setShowModal(false)}>
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl animate-fade-up"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
                  <Film size={16} className="text-primary" />
                </div>
                <p className="text-white font-bold">{editing ? 'Edit Visual Ad' : 'New Visual Ad'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

              {/* Title */}
              <FieldRow label="Title *" hint="Headline shown to the viewer during ad playback">
                <input className={inp()} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Summer Sale — 50% Off" />
              </FieldRow>

              {/* Description */}
              <FieldRow label="Description" hint="Optional sub-text below the title">
                <input className={inp()} value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description or advertiser name" />
              </FieldRow>

              {/* Ad URL */}
              <FieldRow label="Ad Video URL *" hint="Must be a direct .m3u8 (HLS) or .mp4 link">
                <input className={inp('font-mono text-xs')} value={form.ad_url} onChange={e => setForm(f => ({ ...f, ad_url: e.target.value }))} placeholder="https://example.com/ad.m3u8" />
              </FieldRow>

              {/* Click URL */}
              <FieldRow label="Click-through URL" hint="Where to send viewers who tap the ad (optional)">
                <input className={inp()} value={form.click_url ?? ''} onChange={e => setForm(f => ({ ...f, click_url: e.target.value }))} placeholder="https://advertiser.com/landing" />
              </FieldRow>

              {/* Thumbnail */}
              <FieldRow label="Thumbnail / Poster URL" hint="Preview image shown before the ad video loads">
                <input className={inp()} value={form.thumbnail_url ?? ''} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} placeholder="https://example.com/poster.jpg" />
              </FieldRow>

              <hr className="border-slate-800" />

              {/* Skip behaviour */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Skip Behaviour</p>
                <Toggle checked={form.is_skippable} onChange={v => setForm(f => ({ ...f, is_skippable: v }))} label="Ad is skippable" />
                {form.is_skippable && (
                  <FieldRow label="Skip button appears after (seconds)" hint="YouTube default is 5 seconds">
                    <input type="number" min={1} max={60} className={inp('w-32')} value={form.skip_after_seconds}
                      onChange={e => setForm(f => ({ ...f, skip_after_seconds: parseInt(e.target.value) || 5 }))} />
                  </FieldRow>
                )}
                <FieldRow label="Max ad duration (seconds)" hint="Player stops ad at this time even if stream continues">
                  <input type="number" min={5} max={300} className={inp('w-32')} value={form.duration_seconds}
                    onChange={e => setForm(f => ({ ...f, duration_seconds: parseInt(e.target.value) || 30 }))} />
                </FieldRow>
              </div>

              <hr className="border-slate-800" />

              {/* Targeting */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Targeting</p>
                <Toggle checked={form.show_for_guests}    onChange={v => setForm(f => ({ ...f, show_for_guests: v }))}    label="Show to guests (not logged in)" />
                <Toggle checked={form.show_for_free_users} onChange={v => setForm(f => ({ ...f, show_for_free_users: v }))} label="Show to free / no-plan users" />
              </div>

              <hr className="border-slate-800" />

              {/* Frequency & rotation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FieldRow label="Max impressions / session" hint="0 = unlimited">
                  <input type="number" min={0} className={inp()} value={form.max_impressions_per_session}
                    onChange={e => setForm(f => ({ ...f, max_impressions_per_session: parseInt(e.target.value) || 0 }))} />
                </FieldRow>
                <FieldRow label="Display frequency" hint="Show every N channel switches">
                  <input type="number" min={1} className={inp()} value={form.display_frequency}
                    onChange={e => setForm(f => ({ ...f, display_frequency: parseInt(e.target.value) || 1 }))} />
                </FieldRow>
                <FieldRow label="Weight" hint="Higher = shown more often">
                  <input type="number" min={1} className={inp()} value={form.weight}
                    onChange={e => setForm(f => ({ ...f, weight: parseInt(e.target.value) || 1 }))} />
                </FieldRow>
              </div>

              <hr className="border-slate-800" />

              {/* Scheduling */}
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Start date" hint="Leave blank for no start limit">
                  <input type="date" className={inp()} value={form.start_date ?? ''}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </FieldRow>
                <FieldRow label="End date" hint="Leave blank for no end limit">
                  <input type="date" className={inp()} value={form.end_date ?? ''}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                </FieldRow>
              </div>

              {/* Status */}
              <FieldRow label="Status">
                <select className={inp('w-40')} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </FieldRow>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-900/80 border-t border-slate-800">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all font-medium">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 shadow-lg shadow-primary/20">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> {editing ? 'Update Ad' : 'Create Ad'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
