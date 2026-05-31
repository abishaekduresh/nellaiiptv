'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Radio, Wifi, WifiOff, Activity, Monitor,
  Volume2, Users, Signal, Server, Clock, RefreshCw, Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface StreamDetail {
  uuid: string;
  stream_name: string;
  stream_key: string | null;
  input_url: string | null;
  output_formats: string[] | null;
  health_status: 'online' | 'offline';
  viewer_limit: number;
  current_viewers: number;
  bitrate: number;
  status: string;
  inputs_bandwidth: number | null;
  out_bandwidth: number | null;
  online_clients: number | null;
  video_width: number | null;
  video_height: number | null;
  video_codec: string | null;
  fps: number | null;
  audio_codec: string | null;
  audio_bitrate: number | null;
  audio_sample_rate: number | null;
  audio_channels: number | null;
  stream_status: string | null;
  published_via: string | null;
  published_from: string | null;
  client_count: number | null;
  stream_url_type: string | null;
  max_sessions: number | null;
  created_at: string | null;
  updated_at: string | null;
  server: {
    uuid: string;
    server_name: string;
    server_host_ip: string;
    api_port: number;
    api_version: string;
  } | null;
}

interface StreamClientRecord {
  id: number;
  uuid: string;
  stream_name: string;
  ip: string | null;
  user_agent: string | null;
  protocol: string | null;
  opened_at: number | null;
  closed_at: number | null;
  country: string | null;
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-800/60 last:border-0">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className="text-slate-200 text-xs text-right font-medium max-w-[60%] break-all">{value ?? <span className="text-slate-600">—</span>}</span>
    </div>
  );
}

function Card({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className="text-primary" />
        <h3 className="text-slate-300 text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function fmtKbps(kbps: number | null): string {
  if (!kbps) return '—';
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(2)} Mbps`;
  return `${kbps} Kbps`;
}

function fmtBps(bps: number | null): string {
  if (!bps) return '—';
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  if (bps >= 1_000)     return `${(bps / 1_000).toFixed(0)} Kbps`;
  return `${bps} bps`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function fmtEpochMs(ms: number | null): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleString();
}

function fmtDuration(openedMs: number | null, closedMs: number | null): string {
  if (!openedMs) return '—';
  const endMs = closedMs ?? Date.now();
  const secs = Math.floor((endMs - openedMs) / 1000);
  if (secs < 0) return '—';
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

const HEALTH_CFG: Record<string, { label: string; classes: string; Icon: any }> = {
  online:  { label: 'Online',  classes: 'bg-green-500/20 text-green-400 border border-green-500/30',  Icon: Wifi },
  offline: { label: 'Offline', classes: 'bg-red-500/20 text-red-400 border border-red-500/30',        Icon: WifiOff },
};

const STREAM_STATUS_CLS: Record<string, string> = {
  running: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  stopped: 'bg-slate-700/40 text-slate-400 border border-slate-600/30',
  error:   'bg-red-500/20 text-red-400 border border-red-500/30',
};

const STATUS_CLS: Record<string, string> = {
  active:   'bg-green-500/20 text-green-400',
  inactive: 'bg-gray-500/20 text-gray-400',
  expired:  'bg-orange-500/20 text-orange-400',
  deleted:  'bg-red-900/20 text-red-600',
};

export default function StreamDetailPage({ params }: { params: { uuid: string } }) {
  const router = useRouter();
  const [stream,  setStream]  = useState<StreamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error,   setError]   = useState('');
  const [clients,        setClients]        = useState<StreamClientRecord[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  const loadStream = useCallback(() => {
    setLoading(true);
    adminApi.get(`/admin/streams/${params.uuid}`)
      .then(res => setStream(res.data.data))
      .catch(() => setError('Stream not found.'))
      .finally(() => setLoading(false));
  }, [params.uuid]);

  const loadClients = useCallback(() => {
    setClientsLoading(true);
    adminApi.get(`/admin/streams/${params.uuid}/clients`)
      .then(res => setClients(res.data.data ?? []))
      .catch(() => setClients([]))
      .finally(() => setClientsLoading(false));
  }, [params.uuid]);

  useEffect(() => {
    loadStream();
    loadClients();
  }, [loadStream, loadClients]);

  const handleSync = async () => {
    if (!stream?.server?.uuid) return;
    setSyncing(true);
    try {
      const res = await adminApi.post('/admin/streams/sync', null, {
        params: { server_uuid: stream.server.uuid },
      });
      const { created, updated, deactivated, clients: cnt, errors } = res.data.data;
      if (errors?.length) {
        errors.forEach((e: string) => toast.error(e, { duration: 8000 }));
      } else {
        toast.success(`Synced — ${created} created, ${updated} updated, ${deactivated} removed, ${cnt} clients.`);
      }
      loadStream();
      loadClients();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  );

  if (error || !stream) return (
    <div className="text-center py-24 text-slate-500">{error || 'Stream not found.'}</div>
  );

  const health    = HEALTH_CFG[stream.health_status] ?? HEALTH_CFG.offline;
  const HealthIcon = health.Icon;
  const streamStatusCls = STREAM_STATUS_CLS[stream.stream_status ?? ''] ?? 'bg-slate-700/30 text-slate-500 border border-slate-700/30';
  const clientsMax = stream.max_sessions ?? stream.viewer_limit ?? 0;
  const onlineNow  = stream.online_clients ?? stream.current_viewers ?? 0;
  const clientsPct = clientsMax > 0 ? Math.min(Math.round((onlineNow / clientsMax) * 100), 100) : 0;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()}
          className="mt-1 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors shrink-0">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight truncate">{stream.stream_name}</h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${health.classes}`}>
              <HealthIcon size={11} />{health.label}
            </span>
            {stream.stream_status && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${streamStatusCls}`}>
                <Activity size={11} />{stream.stream_status}
              </span>
            )}
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_CLS[stream.status] ?? STATUS_CLS.inactive}`}>
              {stream.status}
            </span>
          </div>
          {stream.stream_key && stream.stream_key !== stream.stream_name && (
            <p className="text-slate-500 text-sm font-mono mt-1">{stream.stream_key}</p>
          )}
        </div>
        <button onClick={handleSync} disabled={syncing || !stream.server}
          className="mt-1 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0">
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
      </div>

      {/* Live client bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-primary" />
            <span className="text-slate-300 text-sm font-semibold">Live Viewers</span>
          </div>
          <span className="text-white text-sm font-bold">{onlineNow} <span className="text-slate-500 font-normal">/ {clientsMax || '∞'}</span></span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full">
          <div className={`h-2 rounded-full transition-all ${clientsPct > 80 ? 'bg-red-400' : clientsPct > 50 ? 'bg-amber-400' : 'bg-green-400'}`}
            style={{ width: `${clientsPct}%` }} />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-slate-600">
          <span>{clientsPct}% capacity</span>
          {stream.client_count != null && stream.client_count !== onlineNow && (
            <span>total client count: {stream.client_count}</span>
          )}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Publish / Source */}
        <Card icon={Radio} title="Publish Info">
          <StatRow label="Published Via"   value={stream.published_via} />
          <StatRow label="Published From"  value={stream.published_from} />
          <StatRow label="URL Type"        value={stream.stream_url_type} />
          <StatRow label="Input URL"       value={stream.input_url} />
        </Card>

        {/* Video */}
        <Card icon={Monitor} title="Video Track">
          <StatRow label="Codec"      value={stream.video_codec?.toUpperCase()} />
          <StatRow label="Resolution" value={stream.video_width && stream.video_height ? `${stream.video_width} × ${stream.video_height} px` : null} />
          <StatRow label="Frame Rate" value={stream.fps != null ? `${stream.fps} fps` : null} />
          <StatRow label="Bitrate"    value={stream.bitrate ? `${stream.bitrate} Kbps` : null} />
        </Card>

        {/* Audio */}
        <Card icon={Volume2} title="Audio Track">
          <StatRow label="Codec"       value={stream.audio_codec?.toUpperCase()} />
          <StatRow label="Channels"    value={stream.audio_channels != null ? `${stream.audio_channels} ch` : null} />
          <StatRow label="Sample Rate" value={stream.audio_sample_rate != null ? `${(stream.audio_sample_rate / 1000).toFixed(1)} kHz` : null} />
          <StatRow label="Bitrate"     value={stream.audio_bitrate != null ? `${stream.audio_bitrate} Kbps` : null} />
        </Card>

        {/* Bandwidth */}
        <Card icon={Signal} title="Bandwidth">
          <StatRow label="Output BW"    value={fmtKbps(stream.out_bandwidth)} />
          <StatRow label="Input BW"     value={fmtBps(stream.inputs_bandwidth)} />
          <StatRow label="Max Sessions" value={stream.max_sessions != null ? stream.max_sessions.toString() : null} />
        </Card>

        {/* Server */}
        <Card icon={Server} title="Stream Server">
          <StatRow label="Name"        value={stream.server?.server_name} />
          <StatRow label="IP"          value={stream.server?.server_host_ip} />
          <StatRow label="API Port"    value={stream.server?.api_port?.toString()} />
          <StatRow label="API Version" value={stream.server?.api_version} />
        </Card>

        {/* Record Info */}
        <Card icon={Clock} title="Record Info">
          <StatRow label="UUID"      value={<span className="font-mono text-[10px]">{stream.uuid}</span>} />
          <StatRow label="Created"   value={fmtDate(stream.created_at)} />
          <StatRow label="Last Sync" value={fmtDate(stream.updated_at)} />
          {stream.output_formats && stream.output_formats.length > 0 && (
            <StatRow label="Formats" value={
              <div className="flex flex-wrap gap-1 justify-end">
                {stream.output_formats.map(f => (
                  <span key={f} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-700 text-slate-300 uppercase">{f}</span>
                ))}
              </div>
            } />
          )}
        </Card>

      </div>

      {/* Client Sessions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Globe size={15} className="text-primary" />
            <h3 className="text-slate-300 text-sm font-semibold">Client Sessions</h3>
            {!clientsLoading && (
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{clients.length}</span>
            )}
          </div>
        </div>

        {clientsLoading ? (
          <div className="flex items-center justify-center py-10">
            <svg className="animate-spin h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-10 text-slate-600 text-sm">No client sessions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="text-left px-5 py-3 font-medium">IP</th>
                  <th className="text-left px-3 py-3 font-medium">Protocol</th>
                  <th className="text-left px-3 py-3 font-medium">Country</th>
                  <th className="text-left px-3 py-3 font-medium">Opened</th>
                  <th className="text-left px-3 py-3 font-medium">Duration / Status</th>
                  <th className="text-left px-3 py-3 font-medium">User Agent</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => {
                  const isActive = c.closed_at == null;
                  return (
                    <tr key={c.uuid} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-slate-300 whitespace-nowrap">{c.ip ?? '—'}</td>
                      <td className="px-3 py-3">
                        {c.protocol ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 uppercase">{c.protocol}</span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-3 py-3 text-slate-400">{c.country ?? '—'}</td>
                      <td className="px-3 py-3 text-slate-400 whitespace-nowrap">{fmtEpochMs(c.opened_at)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="text-slate-500">{fmtDuration(c.opened_at, c.closed_at)}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-500 max-w-[220px] truncate" title={c.user_agent ?? ''}>
                        {c.user_agent ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
