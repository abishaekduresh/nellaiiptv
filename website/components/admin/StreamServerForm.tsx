'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff, Loader2, PlugZap } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface StreamServerFormProps {
  initialData?: any;
  isEditing?: boolean;
}

const defaultForm = {
  server_name: '',
  server_host_ip: '',
  server_host_domain: '',
  api_port: 8080,
  api_version: 'v3',
  username: '',
  password_encrypted: '',
  bearer_token: '',
  timezone: 'Asia/Kolkata',
  region: '',
  health_status: 'offline',
  status: 'active',
};

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

export default function StreamServerForm({ initialData, isEditing = false }: StreamServerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState('');

  const buildInitial = () => {
    if (!initialData) return defaultForm;
    const merged: any = { ...defaultForm };
    Object.keys(defaultForm).forEach((key) => {
      const val = initialData[key];
      if (val !== null && val !== undefined) merged[key] = val;
    });
    return merged;
  };

  const [form, setForm] = useState<any>(buildInitial);

  const set = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    // Reset test result whenever any connection field changes
    const connFields = ['server_host_ip', 'api_port', 'api_version', 'username', 'password_encrypted', 'bearer_token'];
    if (connFields.includes(field)) setTestStatus('idle');
  };

  // ── Test Connectivity ────────────────────────────────────────────────────────
  const handleTestConnection = async () => {
    if (!form.server_host_ip) {
      toast.error('Enter the Server Host IP first.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('');

    try {
      const res = await adminApi.post('/admin/stream-servers/test-connection', {
        server_host_ip:    form.server_host_ip,
        api_port:          form.api_port    || 8080,
        api_version:       form.api_version || 'v3',
        username:          form.username,
        password_encrypted: form.password_encrypted,
        bearer_token:      form.bearer_token,
      });

      const msg = res.data?.message || 'Connection successful';
      setTestStatus('success');
      setTestMessage(msg);
      toast.success(msg);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Connection failed';
      setTestStatus('error');
      setTestMessage(msg);
      toast.error(msg);
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

  const inputCls   = 'w-full bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors';
  const labelCls   = 'block text-sm font-medium text-slate-400 mb-1';
  const sectionCls = 'border border-slate-800 rounded-lg p-5 space-y-4';
  const sectionTitle = 'text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4';

  const testBtnCls = (() => {
    if (testStatus === 'success') return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20';
    if (testStatus === 'error')   return 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20';
    return 'border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white';
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Server Identity ── */}
      <div className={sectionCls}>
        <p className={sectionTitle}>Server Identity</p>
        <div>
          <label className={labelCls}>Server Name *</label>
          <input
            required
            value={form.server_name}
            onChange={(e) => set('server_name', e.target.value)}
            className={inputCls}
            placeholder="e.g. Chennai-Main"
          />
        </div>
      </div>

      {/* ── Host / Connection ── */}
      <div className={sectionCls}>
        <p className={sectionTitle}>Host / Connection</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Server Host IP *</label>
            <input
              required
              value={form.server_host_ip}
              onChange={(e) => set('server_host_ip', e.target.value)}
              className={inputCls}
              placeholder="123.45.67.89"
            />
          </div>
          <div>
            <label className={labelCls}>Server Host Domain</label>
            <input
              value={form.server_host_domain}
              onChange={(e) => set('server_host_domain', e.target.value)}
              className={inputCls}
              placeholder="flussonic.example.com"
            />
          </div>
        </div>
      </div>

      {/* ── Flussonic API ── */}
      <div className={sectionCls}>
        <p className={sectionTitle}>Flussonic API</p>

        {/* Port + Version */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>API Port</label>
            <input
              type="number"
              value={form.api_port}
              onChange={(e) => set('api_port', e.target.value)}
              className={inputCls}
              placeholder="8080"
            />
          </div>
          <div>
            <label className={labelCls}>API Version</label>
            <select
              value={form.api_version}
              onChange={(e) => set('api_version', e.target.value)}
              className={`${inputCls} appearance-none`}
            >
              <option value="v3">v3</option>
              <option value="v2">v2</option>
            </select>
          </div>
        </div>

        {/* Username + Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Username *</label>
            <input
              required={!isEditing}
              value={form.username}
              onChange={(e) => set('username', e.target.value)}
              className={inputCls}
              placeholder="admin"
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelCls}>
              {isEditing ? 'Password (leave blank to keep)' : 'Password *'}
            </label>
            <input
              type="password"
              required={!isEditing}
              value={form.password_encrypted}
              onChange={(e) => set('password_encrypted', e.target.value)}
              className={inputCls}
              placeholder={isEditing ? '••••••••' : 'Enter API password'}
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Bearer Token */}
        <div>
          <label className={labelCls}>Bearer Token (optional)</label>
          <input
            type="password"
            value={form.bearer_token}
            onChange={(e) => set('bearer_token', e.target.value)}
            className={inputCls}
            placeholder={isEditing ? '•••• leave blank to keep ••••' : 'Optional JWT / bearer token'}
            autoComplete="new-password"
          />
          <p className="text-xs text-slate-500 mt-1">
            If set, bearer token is preferred over username/password for API requests.
          </p>
        </div>

        {/* ── Test Connectivity ── */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus === 'testing' || !form.server_host_ip}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${testBtnCls}`}
          >
            {testStatus === 'testing' ? (
              <Loader2 size={15} className="animate-spin" />
            ) : testStatus === 'success' ? (
              <Wifi size={15} />
            ) : testStatus === 'error' ? (
              <WifiOff size={15} />
            ) : (
              <PlugZap size={15} />
            )}
            {testStatus === 'testing' ? 'Testing…'
              : testStatus === 'success' ? 'Connected'
              : testStatus === 'error'   ? 'Retry Test'
              : 'Test Connectivity'}
          </button>

          {/* Inline result banner */}
          {testStatus === 'success' && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <Wifi size={15} className="mt-0.5 shrink-0 text-emerald-400" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-emerald-400">Flussonic reachable</p>
                <p className="text-xs text-emerald-300/70 mt-0.5">{testMessage}</p>
                <code className="block text-xs text-emerald-300/50 font-mono mt-1 truncate">
                  {`http://${form.server_host_ip}:${form.api_port || 8080}/streamer/api/${form.api_version || 'v3'}/monitoring/liveness`}
                </code>
              </div>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <WifiOff size={15} className="mt-0.5 shrink-0 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-400">Connection failed</p>
                <p className="text-xs text-red-300/80 mt-0.5">{testMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Live API URL preview */}
        {form.server_host_ip && (
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
            <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">API Base URL</p>
            <code className="text-xs text-cyan-400 font-mono break-all">
              {`http://${form.server_host_ip}:${form.api_port || 8080}/streamer/api/${form.api_version || 'v3'}`}
            </code>
          </div>
        )}
      </div>

      {/* ── Location & Details ── */}
      <div className={sectionCls}>
        <p className={sectionTitle}>Location & Details</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Region</label>
            <input
              value={form.region}
              onChange={(e) => set('region', e.target.value)}
              className={inputCls}
              placeholder="India South"
            />
          </div>
          <div>
            <label className={labelCls}>Timezone</label>
            <input
              value={form.timezone}
              onChange={(e) => set('timezone', e.target.value)}
              className={inputCls}
              placeholder="Asia/Kolkata"
            />
          </div>
        </div>
      </div>

      {/* ── Status ── */}
      <div className={sectionCls}>
        <p className={sectionTitle}>Status</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Health Status</label>
            <select
              value={form.health_status}
              onChange={(e) => set('health_status', e.target.value)}
              className={`${inputCls} appearance-none`}
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Server Status</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className={`${inputCls} appearance-none`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
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
