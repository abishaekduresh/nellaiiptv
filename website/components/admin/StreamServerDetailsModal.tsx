'use client';

import React, { useEffect, useState } from 'react';
import adminApi from '@/lib/adminApi';
import {
  X, Server, Copy, Check, Globe, MapPin,
  Wifi, WifiOff, Shield, Clock, Calendar,
  Network, Database, Key, Radio
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

  // Connection
  server_host_ip: string;
  server_host_domain: string | null;

  // Flussonic API
  api_port: number;
  api_version: string;
  username: string;

  // Location
  region: string | null;
  timezone: string | null;

  // Status
  health_status: 'online' | 'offline';
  last_ping_at: string | null;
  status: string;

  // Audit
  created_at: string;
  updated_at: string;
}

const HEALTH_CONFIG: Record<string, { label: string; classes: string; dotClass: string; Icon: any }> = {
  online:  { label: 'Online',  classes: 'bg-green-500/10 text-green-400 border-green-500/20',  dotClass: 'bg-green-500', Icon: Wifi },
  offline: { label: 'Offline', classes: 'bg-red-500/10 text-red-400 border-red-500/20',        dotClass: 'bg-red-500',   Icon: WifiOff },
};

const STATUS_CONFIG: Record<string, { classes: string; dotClass: string }> = {
  active:   { classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dotClass: 'bg-emerald-500' },
  inactive: { classes: 'bg-gray-500/10 text-gray-400 border-gray-500/20',         dotClass: 'bg-gray-500' },
  expired:  { classes: 'bg-orange-500/10 text-orange-400 border-orange-500/20',   dotClass: 'bg-orange-500' },
  deleted:  { classes: 'bg-red-500/10 text-red-400 border-red-500/20',            dotClass: 'bg-red-500' },
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

  const health    = server ? (HEALTH_CONFIG[server.health_status] ?? HEALTH_CONFIG.offline) : null;
  const statusCfg = server ? (STATUS_CONFIG[server.status]        ?? STATUS_CONFIG.inactive) : null;
  const HealthIcon = health?.Icon ?? WifiOff;

  const apiBaseUrl = server
    ? `http://${server.server_host_ip}:${server.api_port}/streamer/api/${server.api_version}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] rounded-2xl w-full max-w-3xl border border-slate-800 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto flex flex-col">

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

              {/* ── Hero: Identity + Status Badges ── */}
              <div className="p-6 lg:p-8 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  {health && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-bold uppercase tracking-wide ${health.classes}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${health.dotClass} ${server.health_status === 'online' ? 'animate-pulse' : ''}`} />
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
                </div>

                {/* Connection Grid */}
                <div className="grid sm:grid-cols-2 gap-3 bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                  <InfoRow icon={Globe}   label="Host IP"     value={server.server_host_ip}     mono copyable onCopy={() => handleCopy(server.server_host_ip, 'IP')} />
                  {server.server_host_domain && (
                    <InfoRow icon={Globe}   label="Domain"     value={server.server_host_domain} mono />
                  )}
                  {server.region && (
                    <InfoRow icon={MapPin}  label="Region"     value={server.region} />
                  )}
                  {server.timezone && (
                    <InfoRow icon={Clock}   label="Timezone"   value={server.timezone} />
                  )}
                </div>

                {/* Last Ping */}
                {server.last_ping_at && (
                  <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/30">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <Clock size={12} /> Last Ping
                    </div>
                    <p className="text-sm text-slate-200 font-mono">{fmtDate(server.last_ping_at)}</p>
                  </div>
                )}
              </div>

              {/* ── Flussonic API ── */}
              <Section title="Flussonic API" icon={Radio}>
                <div className="grid sm:grid-cols-2 gap-3">
                  <InfoRow icon={Network} label="API Port"    value={server.api_port.toString()} mono />
                  <InfoRow icon={Network} label="API Version" value={server.api_version} mono />
                  <InfoRow icon={Shield}  label="Username"    value={server.username} mono />
                </div>
                <div className="mt-3">
                  <UrlBlock
                    label="API Base URL"
                    value={apiBaseUrl}
                    color="blue"
                    onCopy={() => handleCopy(apiBaseUrl, 'API Base URL')}
                  />
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: 'Streams', path: 'streams' },
                    { label: 'Sessions', path: 'sessions' },
                    { label: 'Monitoring', path: 'monitoring/liveness' },
                    { label: 'Statistics', path: 'statistics' },
                  ].map(({ label, path }) => (
                    <div key={path} className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-2 border border-slate-800">
                      <Key size={11} className="text-slate-500 shrink-0" />
                      <span className="text-xs text-slate-400 w-20 shrink-0">{label}</span>
                      <code className="text-xs text-cyan-400 font-mono truncate">{apiBaseUrl}/{path}</code>
                      <CopyButton text={`${apiBaseUrl}/${path}`} onCopy={() => handleCopy(`${apiBaseUrl}/${path}`, label)} size={11} />
                    </div>
                  ))}
                </div>
              </Section>

              {/* ── System & Lifecycle ── */}
              <Section title="System & Lifecycle" icon={Calendar}>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <InfoRow icon={Database} label="Database ID" value={server.id.toString()} mono />
                  <InfoRow icon={Server}   label="UUID"        value={server.uuid}           mono copyable onCopy={() => handleCopy(server.uuid, 'UUID')} />
                  <InfoRow icon={Calendar} label="Created"     value={fmtDate(server.created_at)} />
                  <InfoRow icon={Calendar} label="Updated"     value={fmtDate(server.updated_at)} />
                </div>
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

// ── Helper Components ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="p-6 lg:p-8 space-y-4">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Icon size={14} /> {title}
      </h3>
      {children}
    </div>
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
    blue:   'text-cyan-400',
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
