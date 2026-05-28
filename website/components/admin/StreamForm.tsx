'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface StreamServer {
  uuid: string;
  server_name: string;
  server_host_ip: string;
  health_status: string;
}

interface StreamFormProps {
  uuid?: string;
}

const OUTPUT_FORMAT_OPTIONS = ['hls', 'dash', 'rtmp', 'webrtc'];

const inputCls = 'w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-slate-600';
const labelCls = 'block text-sm font-semibold text-slate-300 mb-1.5';

export default function StreamForm({ uuid }: StreamFormProps) {
  const router  = useRouter();
  const isEdit  = !!uuid;

  const [servers, setServers]   = useState<StreamServer[]>([]);
  const [saving,  setSaving]    = useState(false);
  const [loading, setLoading]   = useState(isEdit);

  const [form, setForm] = useState({
    server_uuid:     '',
    stream_name:     '',
    input_url:       '',
    output_formats:  [] as string[],
    stream_key:      '',
    viewer_limit:    1000,
    bitrate:         0,
    status:          'active',
  });

  // Load stream servers for dropdown
  useEffect(() => {
    adminApi.get('/admin/stream-servers', { params: { per_page: 100, status: 'active' } })
      .then(res => setServers(res.data.data.data ?? []))
      .catch(() => toast.error('Failed to load stream servers'));
  }, []);

  // Load existing stream for edit mode
  useEffect(() => {
    if (!isEdit) return;
    adminApi.get(`/admin/streams/${uuid}`)
      .then(res => {
        const s = res.data.data;
        setForm({
          server_uuid:    s.server?.uuid ?? '',
          stream_name:    s.stream_name  ?? '',
          input_url:      s.input_url    ?? '',
          output_formats: Array.isArray(s.output_formats) ? s.output_formats : [],
          stream_key:     s.stream_key   ?? '',
          viewer_limit:   s.viewer_limit ?? 1000,
          bitrate:        s.bitrate      ?? 0,
          status:         s.status       ?? 'active',
        });
      })
      .catch(() => toast.error('Failed to load stream'))
      .finally(() => setLoading(false));
  }, [uuid, isEdit]);

  const set = (key: string, value: any) =>
    setForm(f => ({ ...f, [key]: value }));

  const toggleFormat = (fmt: string) =>
    set('output_formats', form.output_formats.includes(fmt)
      ? form.output_formats.filter(f => f !== fmt)
      : [...form.output_formats, fmt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.server_uuid) { toast.error('Select a stream server'); return; }
    if (!form.stream_name.trim()) { toast.error('Stream name is required'); return; }
    if (!form.input_url.trim())   { toast.error('Input URL is required'); return; }

    setSaving(true);
    try {
      const payload = { ...form, output_formats: JSON.stringify(form.output_formats) };
      if (isEdit) {
        await adminApi.put(`/admin/streams/${uuid}`, payload);
        toast.success('Stream updated');
      } else {
        await adminApi.post('/admin/streams', payload);
        toast.success('Stream created');
      }
      router.push('/admin/streams');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-slate-500 text-sm">Loading…</div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      {/* Server */}
      <div>
        <label className={labelCls}>Stream Server *</label>
        <select value={form.server_uuid} onChange={e => set('server_uuid', e.target.value)} className={inputCls} required>
          <option value="">— Select server —</option>
          {servers.map(s => (
            <option key={s.uuid} value={s.uuid}>
              {s.server_name} ({s.server_host_ip}) {s.health_status === 'offline' ? '⚠ offline' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Stream Name */}
      <div>
        <label className={labelCls}>Stream Name *</label>
        <input type="text" value={form.stream_name} onChange={e => set('stream_name', e.target.value)}
          placeholder="e.g. sports_hd" className={inputCls} required />
      </div>

      {/* Input URL */}
      <div>
        <label className={labelCls}>Input URL *</label>
        <input type="text" value={form.input_url} onChange={e => set('input_url', e.target.value)}
          placeholder="rtmp://239.0.0.1:1234/live/stream" className={inputCls} required />
        <p className="text-xs text-slate-500 mt-1">Multicast, RTMP, UDP, or SRT source URL</p>
      </div>

      {/* Output Formats */}
      <div>
        <label className={labelCls}>Output Formats</label>
        <div className="flex flex-wrap gap-3">
          {OUTPUT_FORMAT_OPTIONS.map(fmt => {
            const active = form.output_formats.includes(fmt);
            return (
              <button type="button" key={fmt} onClick={() => toggleFormat(fmt)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  active
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}>
                {fmt.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stream Key */}
      <div>
        <label className={labelCls}>Stream Key</label>
        <input type="text" value={form.stream_key} onChange={e => set('stream_key', e.target.value)}
          placeholder="abc123" className={inputCls} />
      </div>

      {/* Viewer Limit & Bitrate */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Viewer Limit</label>
          <input type="number" min="0" value={form.viewer_limit}
            onChange={e => set('viewer_limit', parseInt(e.target.value) || 0)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Bitrate (bps)</label>
          <input type="number" min="0" value={form.bitrate}
            onChange={e => set('bitrate', parseInt(e.target.value) || 0)} className={inputCls} />
          <p className="text-xs text-slate-500 mt-1">e.g. 4500000 = 4.5 Mbps</p>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className={labelCls}>Status</label>
        <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-cyan-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25">
          {saving ? 'Saving…' : isEdit ? 'Update Stream' : 'Create Stream'}
        </button>
        <button type="button" onClick={() => router.push('/admin/streams')}
          className="px-6 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}
