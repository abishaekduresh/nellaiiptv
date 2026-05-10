'use client';

import React, { useEffect, useState } from 'react';
import adminApi from '@/lib/adminApi';
import {
  X, Server, Copy, Check, Globe, MapPin, Cpu, HardDrive,
  Wifi, WifiOff, AlertTriangle, Wrench, Shield, Radio,
  Activity, Clock, Calendar, Lock, Unlock, Network,
  Monitor, Database, Zap, Video, Box
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StreamServerDetailsModalProps {
  uuid: string;
  isOpen: boolean;
  onClose: () => void;
}

interface StreamServerFull {
  id: number;
  uuid: string;
  server_name: string;
  server_code: string | null;
  description: string | null;

  // Host
  host_ipv4: string;
  host_ipv6: string | null;
  host_domain: string | null;
  ssl_enabled: boolean;

  // MistServer API
  mist_api_protocol: string | null;
  mist_api_host: string | null;
  mist_api_port: number | null;
  mist_server_username: string | null;
  mist_challenge: string | null;
  mist_final_hash: string | null;

  // Streaming Endpoints
  rtmp_publish_base_url: string | null;
  hls_base_url: string | null;
  https_hls_base_url: string | null;
  cmaf_base_url: string | null;
  webrtc_base_url: string | null;
  srt_base_url: string | null;

  // Infrastructure
  server_type: string;
  provider_name: string | null;
  datacenter_region: string | null;
  country_code: string | null;
  operating_system: string | null;
  kernel_version: string | null;

  // Hardware
  cpu_model: string | null;
  cpu_cores: number | null;
  cpu_threads: number | null;
  memory_total_mb: number | null;
  disk_total_gb: number | null;
  bandwidth_limit_tb: number | null;
  network_speed_mbps: number | null;
  gpu_enabled: boolean;

  // Capacity
  max_streams: number | null;
  max_viewers: number | null;
  current_streams: number;
  current_viewers: number;

  // Feature Flags
  supports_hls: boolean;
  supports_rtmp: boolean;
  supports_cmaf: boolean;
  supports_webrtc: boolean;
  supports_srt: boolean;
  supports_transcoding: boolean;
  api_whitelist_enabled: boolean;

  // Lifecycle
  health_status: 'online' | 'offline' | 'warning' | 'maintenance';
  status: string;
  purchased_at: string | null;
  expiry_at: string | null;
  last_seen_at: string | null;
  last_stats_sync_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const HEALTH_CONFIG: Record<string, { label: string; classes: string; dotClass: string; Icon: any }> = {
  online:      { label: 'Online',      classes: 'bg-green-500/10 text-green-400 border-green-500/20',     dotClass: 'bg-green-500',   Icon: Wifi },
  offline:     { label: 'Offline',     classes: 'bg-red-500/10 text-red-400 border-red-500/20',           dotClass: 'bg-red-500',     Icon: WifiOff },
  warning:     { label: 'Warning',     classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',  dotClass: 'bg-yellow-500',  Icon: AlertTriangle },
  maintenance: { label: 'Maintenance', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20',        dotClass: 'bg-blue-500',    Icon: Wrench },
};

const STATUS_CONFIG: Record<string, { classes: string; dotClass: string }> = {
  active:    { classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dotClass: 'bg-emerald-500' },
  inactive:  { classes: 'bg-gray-500/10 text-gray-400 border-gray-500/20',         dotClass: 'bg-gray-500' },
  expired:   { classes: 'bg-orange-500/10 text-orange-400 border-orange-500/20',   dotClass: 'bg-orange-500' },
  suspended: { classes: 'bg-red-500/10 text-red-400 border-red-500/20',            dotClass: 'bg-red-500' },
};

export default function StreamServerDetailsModal({ uuid, isOpen, onClose }: StreamServerDetailsModalProps) {
  const [server, setServer] = useState<StreamServerFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && uuid) {
      setLoading(true);
      adminApi.get(`/admin/stream-servers/${uuid}`)
        .then((res) => setServer(res.data.data))
        .catch((err: any) => {
          toast.error(err.response?.data?.message || 'Failed to load server details');
          onClose();
        })
        .finally(() => setLoading(false));
    } else {
      setServer(null);
    }
  }, [isOpen, uuid, onClose]);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString() : '—';
  const fmtDateShort = (d: string | null) => d ? new Date(d).toLocaleDateString() : '—';
  const fmtMb = (mb: number | null) => mb ? mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB` : '—';

  const health = server ? (HEALTH_CONFIG[server.health_status] ?? HEALTH_CONFIG.offline) : null;
  const statusCfg = server ? (STATUS_CONFIG[server.status] ?? STATUS_CONFIG.inactive) : null;
  const HealthIcon = health?.Icon ?? Wifi;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] rounded-2xl w-full max-w-5xl border border-slate-800 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto flex flex-col">

        {/* Sticky Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Server className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">
                {server?.server_name ?? 'Stream Server Details'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-mono">{uuid}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
              <p className="text-slate-500 text-sm animate-pulse">Loading server details...</p>
            </div>
          ) : server ? (
            <div className="flex flex-col divide-y divide-slate-800/60">

              {/* ── Hero: Identity + Live Stats ── */}
              <div className="p-6 lg:p-8 grid lg:grid-cols-[1fr_340px] gap-8 bg-slate-900/20">
                {/* Identity */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {health && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-bold uppercase tracking-wide ${health.classes}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${health.dotClass} animate-pulse`} />
                        <HealthIcon size={12} />
                        {health.label}
                      </span>
                    )}
                    {statusCfg && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-bold uppercase tracking-wide ${statusCfg.classes}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`} />
                        {server.status}
                      </span>
                    )}
                    {server.ssl_enabled && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border bg-green-500/10 text-green-400 border-green-500/20 text-xs font-bold uppercase">
                        <Lock size={10} /> SSL
                      </span>
                    )}
                    <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md text-xs font-semibold capitalize border border-slate-700">
                      {server.server_type}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                    <InfoRow icon={Server}    label="Server Code"  value={server.server_code} mono />
                    <InfoRow icon={Globe}     label="IPv4"         value={server.host_ipv4}   mono />
                    {server.host_ipv6   && <InfoRow icon={Globe}     label="IPv6"         value={server.host_ipv6}   mono />}
                    {server.host_domain && <InfoRow icon={Globe}     label="Domain"       value={server.host_domain} mono />}
                    {server.provider_name      && <InfoRow icon={Box}       label="Provider"     value={server.provider_name} />}
                    {server.datacenter_region  && <InfoRow icon={MapPin}    label="Region"       value={server.datacenter_region} />}
                    {server.country_code       && <InfoRow icon={MapPin}    label="Country"      value={server.country_code} />}
                  </div>

                  {server.description && (
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-slate-400 text-sm leading-relaxed">
                      {server.description}
                    </div>
                  )}
                </div>

                {/* Live Capacity Cards */}
                <div className="grid grid-cols-2 gap-3 content-start">
                  <CapacityCard
                    label="Live Streams"
                    current={server.current_streams}
                    max={server.max_streams}
                    icon={Video}
                    color="primary"
                  />
                  <CapacityCard
                    label="Live Viewers"
                    current={server.current_viewers}
                    max={server.max_viewers}
                    icon={Activity}
                    color="emerald"
                  />
                  {server.last_seen_at && (
                    <div className="col-span-2 bg-slate-800/30 p-3 rounded-xl border border-slate-700/30">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <Clock size={12} /> Last Seen
                      </div>
                      <p className="text-sm text-slate-200 font-mono">{fmtDate(server.last_seen_at)}</p>
                    </div>
                  )}
                  {server.expiry_at && (
                    <div className="col-span-2 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                      <div className="flex items-center gap-2 text-xs text-yellow-400 mb-1">
                        <Calendar size={12} /> Expires
                      </div>
                      <p className="text-sm text-yellow-300 font-medium">{fmtDateShort(server.expiry_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── MistServer API ── */}
              {(server.mist_api_host || server.mist_server_username) && (
                <Section title="MistServer API" icon={Shield}>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <InfoRow icon={Network} label="Protocol"  value={server.mist_api_protocol?.toUpperCase()} />
                    <InfoRow icon={Globe}   label="API Host"  value={server.mist_api_host} mono />
                    <InfoRow icon={Network} label="API Port"  value={server.mist_api_port?.toString()} mono />
                    <InfoRow icon={Shield}  label="Username"  value={server.mist_server_username} mono />
                  </div>

                  {(server.mist_challenge || server.mist_final_hash) && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Last Validated Auth State</p>
                      {server.mist_challenge && (
                        <UrlBlock
                          label="Challenge"
                          value={server.mist_challenge}
                          color="yellow"
                          onCopy={() => handleCopy(server.mist_challenge!, 'Challenge')}
                        />
                      )}
                      {server.mist_final_hash && (
                        <UrlBlock
                          label="Final Hash (MD5)"
                          value={server.mist_final_hash}
                          color="green"
                          onCopy={() => handleCopy(server.mist_final_hash!, 'Final Hash')}
                        />
                      )}
                    </div>
                  )}
                </Section>
              )}

              {/* ── Streaming Endpoints ── */}
              {(server.rtmp_publish_base_url || server.hls_base_url || server.https_hls_base_url ||
                server.cmaf_base_url || server.webrtc_base_url || server.srt_base_url) && (
                <Section title="Streaming Endpoints" icon={Radio}>
                  <div className="space-y-3">
                    {server.rtmp_publish_base_url && (
                      <UrlBlock label="RTMP Publish Base URL" value={server.rtmp_publish_base_url} onCopy={() => handleCopy(server.rtmp_publish_base_url!, 'RTMP URL')} />
                    )}
                    {server.hls_base_url && (
                      <UrlBlock label="HLS Base URL" value={server.hls_base_url} onCopy={() => handleCopy(server.hls_base_url!, 'HLS URL')} />
                    )}
                    {server.https_hls_base_url && (
                      <UrlBlock label="HTTPS HLS Base URL" value={server.https_hls_base_url} onCopy={() => handleCopy(server.https_hls_base_url!, 'HTTPS HLS URL')} />
                    )}
                    {server.cmaf_base_url && (
                      <UrlBlock label="CMAF Base URL" value={server.cmaf_base_url} onCopy={() => handleCopy(server.cmaf_base_url!, 'CMAF URL')} />
                    )}
                    {server.webrtc_base_url && (
                      <UrlBlock label="WebRTC Base URL" value={server.webrtc_base_url} onCopy={() => handleCopy(server.webrtc_base_url!, 'WebRTC URL')} />
                    )}
                    {server.srt_base_url && (
                      <UrlBlock label="SRT Base URL" value={server.srt_base_url} onCopy={() => handleCopy(server.srt_base_url!, 'SRT URL')} />
                    )}
                  </div>
                </Section>
              )}

              {/* ── Hardware & Infrastructure ── */}
              <div className="p-6 lg:p-8 grid md:grid-cols-2 gap-8">
                {/* Hardware Specs */}
                <div className="space-y-4">
                  <SectionHeader title="Hardware Specs" icon={Cpu} />
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/30 space-y-3">
                    {server.cpu_model && <InfoRow icon={Cpu}        label="CPU Model"       value={server.cpu_model} />}
                    {server.cpu_cores && <InfoRow icon={Cpu}        label="CPU Cores"       value={`${server.cpu_cores} cores${server.cpu_threads ? ` / ${server.cpu_threads} threads` : ''}`} />}
                    {server.memory_total_mb && <InfoRow icon={Database}  label="Memory"         value={fmtMb(server.memory_total_mb)} />}
                    {server.disk_total_gb  && <InfoRow icon={HardDrive} label="Disk"           value={`${server.disk_total_gb} GB`} />}
                    {server.network_speed_mbps && <InfoRow icon={Zap}       label="Network Speed"  value={`${server.network_speed_mbps} Mbps`} />}
                    {server.bandwidth_limit_tb && <InfoRow icon={Network}   label="Bandwidth Limit" value={`${server.bandwidth_limit_tb} TB/mo`} />}
                    <InfoRow icon={Monitor} label="GPU" value={server.gpu_enabled ? 'Enabled' : 'Not Available'} />
                    {server.operating_system && <InfoRow icon={Monitor} label="OS" value={`${server.operating_system}${server.kernel_version ? ` (${server.kernel_version})` : ''}`} />}
                  </div>
                </div>

                {/* Feature Flags */}
                <div className="space-y-4">
                  <SectionHeader title="Feature Flags" icon={Zap} />
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/30 grid grid-cols-2 gap-3">
                    <FeatureFlag label="HLS"          enabled={server.supports_hls} />
                    <FeatureFlag label="RTMP"         enabled={server.supports_rtmp} />
                    <FeatureFlag label="CMAF"         enabled={server.supports_cmaf} />
                    <FeatureFlag label="WebRTC"       enabled={server.supports_webrtc} />
                    <FeatureFlag label="SRT"          enabled={server.supports_srt} />
                    <FeatureFlag label="Transcoding"  enabled={server.supports_transcoding} />
                    <FeatureFlag label="API Whitelist" enabled={server.api_whitelist_enabled} />
                  </div>
                </div>
              </div>

              {/* ── System & Lifecycle ── */}
              <Section title="System & Lifecycle" icon={Clock}>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <InfoRow icon={Database}  label="Database ID"      value={server.id.toString()} mono />
                  <InfoRow icon={Server}    label="UUID"             value={server.uuid}           mono copyable onCopy={() => handleCopy(server.uuid, 'UUID')} />
                  <InfoRow icon={Calendar}  label="Created"          value={fmtDate(server.created_at)} />
                  <InfoRow icon={Calendar}  label="Updated"          value={fmtDate(server.updated_at)} />
                  {server.purchased_at     && <InfoRow icon={Calendar} label="Purchased"          value={fmtDateShort(server.purchased_at)} />}
                  {server.expiry_at        && <InfoRow icon={Calendar} label="Expires"            value={fmtDateShort(server.expiry_at)} />}
                  {server.last_stats_sync_at && <InfoRow icon={Clock}  label="Stats Synced"       value={fmtDate(server.last_stats_sync_at)} />}
                </div>

                {server.notes && (
                  <div className="mt-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Notes</p>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{server.notes}</p>
                  </div>
                )}
              </Section>

            </div>
          ) : (
            <div className="text-center text-slate-400 py-20">Server details not found</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium border border-slate-700 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ──

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="p-6 lg:p-8 space-y-4">
      <SectionHeader title={title} icon={Icon} />
      {children}
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
      <Icon size={14} /> {title}
    </h3>
  );
}

function InfoRow({
  icon: Icon, label, value, mono = false, copyable = false, onCopy,
}: {
  icon: any; label: string; value: string | number | undefined | null;
  mono?: boolean; copyable?: boolean; onCopy?: () => void;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-500 shrink-0"><Icon size={16} /></div>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-500 block">{label}</span>
        <div className="flex items-center gap-1">
          <span className={`text-sm font-medium text-slate-200 truncate ${mono ? 'font-mono' : ''}`} title={String(value)}>
            {String(value)}
          </span>
          {copyable && onCopy && <CopyButton text={String(value)} onCopy={onCopy} size={12} />}
        </div>
      </div>
    </div>
  );
}

function UrlBlock({
  label, value, color = 'slate', onCopy,
}: {
  label: string; value: string; color?: 'slate' | 'green' | 'yellow' | 'blue'; onCopy: () => void;
}) {
  const textColor: Record<string, string> = {
    slate:  'text-slate-300',
    green:  'text-green-400',
    yellow: 'text-yellow-400',
    blue:   'text-blue-400',
  };
  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">{label}</span>
        <CopyButton text={value} onCopy={onCopy} />
      </div>
      <div className={`p-3 bg-slate-950 font-mono text-xs break-all leading-relaxed select-all ${textColor[color]}`}>
        {value}
      </div>
    </div>
  );
}

function CapacityCard({
  label, current, max, icon: Icon, color = 'primary',
}: {
  label: string; current: number; max: number | null; icon: any; color?: string;
}) {
  const colorClasses: Record<string, string> = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };
  const pct = max && max > 0 ? Math.min(100, Math.round((current / max) * 100)) : null;
  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-1 ${colorClasses[color] ?? colorClasses.primary}`}>
      <div className="flex items-center gap-2 text-xs font-medium opacity-80 mb-1">
        <Icon size={12} /> {label}
      </div>
      <div className="text-2xl font-bold leading-none">{current.toLocaleString()}</div>
      {max != null && (
        <div className="text-[10px] opacity-60 font-mono">of {max.toLocaleString()}{pct !== null ? ` · ${pct}%` : ''}</div>
      )}
    </div>
  );
}

function FeatureFlag({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold ${
      enabled
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : 'bg-slate-800/50 text-slate-500 border-slate-700/30'
    }`}>
      <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-600'}`} />
      {label}
    </div>
  );
}

function CopyButton({ text, onCopy, size = 14 }: { text: string; onCopy: () => void; size?: number }) {
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleClick}
      className="p-1.5 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white shrink-0"
      title="Copy to clipboard"
      type="button"
    >
      {copied ? <Check size={size} className="text-emerald-400" /> : <Copy size={size} />}
    </button>
  );
}
