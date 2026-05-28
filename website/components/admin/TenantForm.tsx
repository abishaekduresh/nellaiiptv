'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface StreamServer {
  uuid: string;
  server_name: string;
  server_host_ip: string;
}

interface TenantFormProps {
  uuid?: string;
}

const inputCls = 'w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-slate-600';
const labelCls = 'block text-sm font-semibold text-slate-300 mb-1.5';

export default function TenantForm({ uuid }: TenantFormProps) {
  const router = useRouter();
  const isEdit = !!uuid;

  const [servers,  setServers]  = useState<StreamServer[]>([]);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(isEdit);

  const [form, setForm] = useState({
    company_name:    '',
    email:           '',
    max_viewers:     1000,
    allowed_servers: [] as string[],
    channel_id:      [] as string[],
    status:          'active',
  });

  const [channelInput, setChannelInput] = useState('');

  useEffect(() => {
    adminApi.get('/admin/stream-servers', { params: { per_page: 100, status: 'active' } })
      .then(res => setServers(res.data.data.data ?? []))
      .catch(() => toast.error('Failed to load servers'));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    adminApi.get(`/admin/tenants/${uuid}`)
      .then(res => {
        const t = res.data.data;
        setForm({
          company_name:    t.company_name    ?? '',
          email:           t.email           ?? '',
          max_viewers:     t.max_viewers     ?? 1000,
          allowed_servers: Array.isArray(t.allowed_servers) ? t.allowed_servers : [],
          channel_id:      Array.isArray(t.channel_id)      ? t.channel_id      : [],
          status:          t.status          ?? 'active',
        });
      })
      .catch(() => toast.error('Failed to load tenant'))
      .finally(() => setLoading(false));
  }, [uuid, isEdit]);

  const set = (key: string, value: any) =>
    setForm(f => ({ ...f, [key]: value }));

  const toggleServer = (serverUuid: string) =>
    set('allowed_servers', form.allowed_servers.includes(serverUuid)
      ? form.allowed_servers.filter(s => s !== serverUuid)
      : [...form.allowed_servers, serverUuid]);

  const addChannel = () => {
    const val = channelInput.trim();
    if (!val || form.channel_id.includes(val)) { setChannelInput(''); return; }
    set('channel_id', [...form.channel_id, val]);
    setChannelInput('');
  };

  const removeChannel = (id: string) =>
    set('channel_id', form.channel_id.filter(c => c !== id));

  const handleChannelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addChannel(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim()) { toast.error('Company name is required'); return; }
    if (!form.email.trim())        { toast.error('Email is required'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        allowed_servers: JSON.stringify(form.allowed_servers),
        channel_id:      JSON.stringify(form.channel_id),
      };
      if (isEdit) {
        await adminApi.put(`/admin/tenants/${uuid}`, payload);
        toast.success('Tenant updated');
      } else {
        await adminApi.post('/admin/tenants', payload);
        toast.success('Tenant created');
      }
      router.push('/admin/tenants');
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

      {/* Company Name */}
      <div>
        <label className={labelCls}>Company Name *</label>
        <input type="text" value={form.company_name} onChange={e => set('company_name', e.target.value)}
          placeholder="Nellai IPTV" className={inputCls} required />
      </div>

      {/* Email */}
      <div>
        <label className={labelCls}>Email *</label>
        <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
          placeholder="admin@example.com" className={inputCls} required />
      </div>

      {/* Max Viewers */}
      <div>
        <label className={labelCls}>Max Viewers</label>
        <input type="number" min="0" value={form.max_viewers}
          onChange={e => set('max_viewers', parseInt(e.target.value) || 0)} className={inputCls} />
      </div>

      {/* Allowed Servers */}
      <div>
        <label className={labelCls}>Allowed Servers</label>
        {servers.length === 0 ? (
          <p className="text-xs text-slate-500">No active servers available</p>
        ) : (
          <div className="flex flex-col gap-2">
            {servers.map(s => {
              const active = form.allowed_servers.includes(s.uuid);
              return (
                <label key={s.uuid}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    active
                      ? 'bg-primary/10 border-primary'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  }`}>
                  <input type="checkbox" className="hidden" checked={active} onChange={() => toggleServer(s.uuid)} />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${active ? 'bg-primary border-primary' : 'border-slate-600'}`}>
                    {active && <div className="w-2 h-2 rounded-sm bg-white" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-300'}`}>{s.server_name}</p>
                    <p className="text-xs text-slate-500 font-mono">{s.server_host_ip}</p>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Channel IDs */}
      <div>
        <label className={labelCls}>Channel IDs</label>
        <div className="flex gap-2">
          <input type="text" value={channelInput} onChange={e => setChannelInput(e.target.value)}
            onKeyDown={handleChannelKeyDown}
            placeholder="Enter ID and press Enter or comma…"
            className={`${inputCls} flex-1`} />
          <button type="button" onClick={addChannel}
            className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-all">
            Add
          </button>
        </div>
        {form.channel_id.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {form.channel_id.map(id => (
              <span key={id} className="flex items-center gap-1.5 bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-mono">
                {id}
                <button type="button" onClick={() => removeChannel(id)} className="hover:text-white transition-colors">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
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
          {saving ? 'Saving…' : isEdit ? 'Update Tenant' : 'Create Tenant'}
        </button>
        <button type="button" onClick={() => router.push('/admin/tenants')}
          className="px-6 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}
