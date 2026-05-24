'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface StreamServerFormProps {
  initialData?: any;
  isEditing?: boolean;
}

const defaultForm = {
  // Identity
  server_name: '',
  server_code: '',
  description: '',
  // Connection
  host_ipv4: '',
  host_ipv6: '',
  host_domain: '',
  // MistServer
  mist_api_protocol: 'http',
  mist_api_host: '',
  mist_api_port: 4242,
  mist_server_username: '',
  mist_server_password: '',
  // Streaming endpoints
  rtmp_publish_base_url: '',
  hls_base_url: '',
  https_hls_base_url: '',
  cmaf_base_url: '',
  webrtc_base_url: '',
  srt_base_url: '',
  // Infrastructure
  server_type: 'vps',
  provider_name: '',
  datacenter_region: '',
  country_code: '',
  operating_system: '',
  kernel_version: '',
  // Hardware
  cpu_model: '',
  cpu_cores: '',
  cpu_threads: '',
  memory_total_mb: '',
  disk_total_gb: '',
  bandwidth_limit_tb: '',
  network_speed_mbps: '',
  gpu_enabled: false,
  // Capacity
  max_streams: '',
  max_viewers: '',
  purchased_at: '',
  expiry_at: '',
  // Feature flags
  supports_hls: true,
  supports_rtmp: true,
  supports_cmaf: true,
  supports_webrtc: false,
  supports_srt: false,
  supports_transcoding: false,
  // Security & admin
  api_whitelist_enabled: false,
  ssl_enabled: false,
  health_status: 'offline',
  status: 'active',
  notes: '',
};

export default function StreamServerForm({ initialData, isEditing = false }: StreamServerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Merge initial data, converting nulls to empty strings for controlled inputs
  const buildInitial = () => {
    if (!initialData) return defaultForm;
    const merged: any = { ...defaultForm };
    Object.keys(defaultForm).forEach((key) => {
      const val = initialData[key];
      if (val !== null && val !== undefined) {
        // Format timestamps for datetime-local input
        if ((key === 'purchased_at' || key === 'expiry_at') && val) {
          merged[key] = val.replace(' ', 'T').slice(0, 16);
        } else {
          merged[key] = val;
        }
      }
    });
    return merged;
  };

  const [form, setForm] = useState<any>(buildInitial);

  const set = (field: string, value: any) => setForm((prev: any) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Build payload — strip empty strings for optional fields
    const payload: any = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) return;
      payload[k] = v;
    });

    try {
      if (isEditing) {
        await adminApi.put(`/admin/stream-servers/${initialData.uuid}`, payload);
        toast.success('Stream server updated');
      } else {
        await adminApi.post('/admin/stream-servers', payload);
        toast.success('Stream server created');
      }
      router.push('/admin/stream-servers');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to save stream server';
      const errors = error.response?.data?.errors;
      if (errors) {
        Object.values(errors).flat().forEach((e: any) => toast.error(e));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors';
  const labelCls = 'block text-sm font-medium text-slate-400 mb-1';
  const sectionCls = 'border border-slate-800 rounded-lg p-5 space-y-4';
  const sectionTitle = 'text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4';

  const Toggle = ({ field, label }: { field: string; label: string }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => set(field, !form[field])}
        className={`relative w-11 h-6 rounded-full transition-colors ${form[field] ? 'bg-primary' : 'bg-gray-700'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form[field] ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      <span className="text-sm text-slate-400">{label}</span>
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Server Identity ── */}
      <div className={sectionCls}>
        <p className={sectionTitle}>Server Identity</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Server Name *</label>
            <input required value={form.server_name} onChange={(e) => set('server_name', e.target.value)} className={inputCls} placeholder="e.g. Chennai Primary" />
          </div>
          <div>
            <label className={labelCls}>Server Code</label>
            <input value={form.server_code} onChange={(e) => set('server_code', e.target.value)} className={inputCls} placeholder="e.g. CHN-01" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Optional description..." />
        </div>
      </div>

      {/* ── Host / Connection ── */}
      <div className={sectionCls}>
        <p className={sectionTitle}>Host / Connection</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>IPv4 Address *</label>
            <input required value={form.host_ipv4} onChange={(e) => set('host_ipv4', e.target.value)} className={inputCls} placeholder="123.45.67.89" />
          </div>
          <div>
            <label className={labelCls}>IPv6 Address</label>
            <input value={form.host_ipv6} onChange={(e) => set('host_ipv6', e.target.value)} className={inputCls} placeholder="Optional" />
          </div>
          <div>
            <label className={labelCls}>Domain</label>
            <input value={form.host_domain} onChange={(e) => set('host_domain', e.target.value)} className={inputCls} placeholder="stream.example.com" />
          </div>
        </div>
      </div>

      {/* ── MistServer API ── */}
      <div className={sectionCls}>
        <p className={sectionTitle}>MistServer API</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Protocol</label>
            <select value={form.mist_api_protocol} onChange={(e) => set('mist_api_protocol', e.target.value)} className={`${inputCls} appearance-none`}>
              <option value="http">http</option>
              <option value="https">https</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>API Host *</label>
            <input required value={form.mist_api_host} onChange={(e) => set('mist_api_host', e.target.value)} className={inputCls} placeholder="123.45.67.89 or domain" />
          </div>
          <div>
            <label className={labelCls}>API Port</label>
            <input type="number" value={form.mist_api_port} onChange={(e) => set('mist_api_port', e.target.value)} className={inputCls} placeholder="4242" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Username *</label>
            <input required value={form.mist_server_username} onChange={(e) => set('mist_server_username', e.target.value)} className={inputCls} placeholder="admin" autoComplete="off" />
          </div>
          <div>
            <label className={labelCls}>{isEditing ? 'Password (leave blank to keep)' : 'Password *'}</label>
            <input
              type="password"
              required={!isEditing}
              value={form.mist_server_password}
              onChange={(e) => set('mist_server_password', e.target.value)}
              className={inputCls}
              placeholder={isEditing ? '••••••••' : 'Enter password'}
              autoComplete="new-password"
            />
          </div>

        {/* ── MistServer Auth State (read-only, populated after save) ── */}
        {isEditing && (initialData?.mist_challenge || initialData?.mist_final_hash) && (
          <div className="col-span-full mt-2 rounded-lg border border-gray-700 bg-gray-900/50 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Validated Auth State</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">MistServer Challenge</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-950 rounded px-3 py-2 text-xs text-yellow-400 font-mono break-all">
                    {initialData.mist_challenge ?? '—'}
                  </code>
                  {initialData.mist_challenge && (
                    <button type="button" onClick={() => navigator.clipboard.writeText(initialData.mist_challenge)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-gray-800 shrink-0">
                      Copy
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Final MD5 Hash</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-950 rounded px-3 py-2 text-xs text-green-400 font-mono break-all">
                    {initialData.mist_final_hash ?? '—'}
                  </code>
                  {initialData.mist_final_hash && (
                    <button type="button" onClick={() => navigator.clipboard.writeText(initialData.mist_final_hash)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-gray-800 shrink-0">
                      Copy
                    </button>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400">Refreshed automatically each time a new password is saved.</p>
          </div>
        )}
        </div>
      </div>

      {/* ── Streaming Endpoints ── */}
      <div className={sectionCls}>
        <p className={sectionTitle}>Streaming Endpoints</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { field: 'rtmp_publish_base_url', label: 'RTMP Publish Base URL', ph: 'rtmp://ip:1935/live/' },
            { field: 'hls_base_url',          label: 'HLS Base URL',          ph: 'http://ip:8080/hls/' },
            { field: 'https_hls_base_url',    label: 'HTTPS HLS Base URL',    ph: 'https://domain/hls/' },
            { field: 'cmaf_base_url',         label: 'CMAF Base URL',         ph: 'http://ip:8080/cmaf/' },
            { field: 'webrtc_base_url',       label: 'WebRTC Base URL',       ph: 'ws://ip:8080/webrtc/' },
            { field: 'srt_base_url',          label: 'SRT Base URL',          ph: 'srt://ip:8889' },
          ].map(({ field, label, ph }) => (
            <div key={field}>
              <label className={labelCls}>{label}</label>
              <input value={form[field]} onChange={(e) => set(field, e.target.value)} className={inputCls} placeholder={ph} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Infrastructure ── */}
      <div className={sectionCls}>
        <p className={sectionTitle}>Infrastructure</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Server Type</label>
            <select value={form.server_type} onChange={(e) => set('server_type', e.target.value)} className={`${inputCls} appearance-none`}>
              <option value="vps">VPS</option>
              <option value="dedicated">Dedicated</option>
              <option value="cloud">Cloud</option>
              <option value="baremetal">Baremetal</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Provider Name</label>
            <input value={form.provider_name} onChange={(e) => set('provider_name', e.target.value)} className={inputCls} placeholder="Hetzner, OVH, Contabo..." />
          </div>
          <div>
            <label className={labelCls}>Datacenter Region</label>
            <input value={form.datacenter_region} onChange={(e) => set('datacenter_region', e.target.value)} className={inputCls} placeholder="Chennai, Singapore..." />
          </div>
          <div>
            <label className={labelCls}>Country Code</label>
            <input value={form.country_code} onChange={(e) => set('country_code', e.target.value)} maxLength={2} className={inputCls} placeholder="IN" />
          </div>
          <div>
            <label className={labelCls}>Operating System</label>
            <input value={form.operating_system} onChange={(e) => set('operating_system', e.target.value)} className={inputCls} placeholder="Ubuntu 22.04 LTS" />
          </div>
          <div>
            <label className={labelCls}>Kernel Version</label>
            <input value={form.kernel_version} onChange={(e) => set('kernel_version', e.target.value)} className={inputCls} placeholder="5.15.0-91-generic" />
          </div>
        </div>
      </div>

      {/* ── Hardware Specs ── */}
      <div className={sectionCls}>
        <p className={sectionTitle}>Hardware Specifications</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>CPU Model</label>
            <input value={form.cpu_model} onChange={(e) => set('cpu_model', e.target.value)} className={inputCls} placeholder="Intel Xeon E5-2630v4" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>CPU Cores</label>
              <input type="number" min={1} value={form.cpu_cores} onChange={(e) => set('cpu_cores', e.target.value)} className={inputCls} placeholder="4" />
            </div>
            <div>
              <label className={labelCls}>CPU Threads</label>
              <input type="number" min={1} value={form.cpu_threads} onChange={(e) => set('cpu_threads', e.target.value)} className={inputCls} placeholder="8" />
            </div>
          </div>
          <div>
            <label className={labelCls}>RAM (MB)</label>
            <input type="number" min={0} value={form.memory_total_mb} onChange={(e) => set('memory_total_mb', e.target.value)} className={inputCls} placeholder="8192" />
          </div>
          <div>
            <label className={labelCls}>Disk (GB)</label>
            <input type="number" min={0} value={form.disk_total_gb} onChange={(e) => set('disk_total_gb', e.target.value)} className={inputCls} placeholder="500" />
          </div>
          <div>
            <label className={labelCls}>Bandwidth Limit (TB/month)</label>
            <input type="number" step="0.01" min={0} value={form.bandwidth_limit_tb} onChange={(e) => set('bandwidth_limit_tb', e.target.value)} className={inputCls} placeholder="20" />
          </div>
          <div>
            <label className={labelCls}>Network Speed (Mbps)</label>
            <input type="number" min={0} value={form.network_speed_mbps} onChange={(e) => set('network_speed_mbps', e.target.value)} className={inputCls} placeholder="1000" />
          </div>
        </div>
        <Toggle field="gpu_enabled" label="GPU Enabled" />
      </div>

      {/* ── Capacity & Lifecycle ── */}
      <div className={sectionCls}>
        <p className={sectionTitle}>Capacity & Lifecycle</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Max Streams</label>
            <input type="number" min={0} value={form.max_streams} onChange={(e) => set('max_streams', e.target.value)} className={inputCls} placeholder="100" />
          </div>
          <div>
            <label className={labelCls}>Max Viewers</label>
            <input type="number" min={0} value={form.max_viewers} onChange={(e) => set('max_viewers', e.target.value)} className={inputCls} placeholder="5000" />
          </div>
          <div>
            <label className={labelCls}>Purchased At</label>
            <input type="datetime-local" value={form.purchased_at} onChange={(e) => set('purchased_at', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Expiry At</label>
            <input type="datetime-local" value={form.expiry_at} onChange={(e) => set('expiry_at', e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── Feature Flags ── */}
      <div className={sectionCls}>
        <p className={sectionTitle}>Feature Flags</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Toggle field="supports_hls"         label="Supports HLS" />
          <Toggle field="supports_rtmp"        label="Supports RTMP" />
          <Toggle field="supports_cmaf"        label="Supports CMAF" />
          <Toggle field="supports_webrtc"      label="Supports WebRTC" />
          <Toggle field="supports_srt"         label="Supports SRT" />
          <Toggle field="supports_transcoding" label="Supports Transcoding" />
        </div>
      </div>

      {/* ── Security & Status ── */}
      <div className={sectionCls}>
        <p className={sectionTitle}>Security & Status</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Health Status</label>
            <select value={form.health_status} onChange={(e) => set('health_status', e.target.value)} className={`${inputCls} appearance-none`}>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="warning">Warning</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Server Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={`${inputCls} appearance-none`}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
        <div className="flex gap-6 mt-2">
          <Toggle field="ssl_enabled"           label="SSL Enabled" />
          <Toggle field="api_whitelist_enabled"  label="API Whitelist Enabled" />
        </div>
        <div>
          <label className={labelCls}>Notes</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Internal notes about this server..." />
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push('/admin/stream-servers')}
          className="px-5 py-2 text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : isEditing ? 'Update Server' : 'Create Server'}
        </button>
      </div>
    </form>
  );
}
