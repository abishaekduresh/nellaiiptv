'use client';

import { useEffect, useState } from 'react';
import { Cpu, HardDrive, MemoryStick, Network, Radio, Users, RefreshCw, Server, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface MetricSnapshot {
  id: number;
  uuid: string;
  server_id: number;
  cpu_usage: number;
  ram_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  active_streams: number;
  active_viewers: number;
  recorded_at: string;
}

interface ServerData {
  server_uuid: string;
  server_name: string;
  server_host_ip: string;
  health_status: 'online' | 'offline';
  latest: MetricSnapshot | null;
}

interface HistoryItem extends MetricSnapshot {}

function UsageBar({ value, color }: { value: number; color: string }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const barColor = value > 85 ? 'bg-red-500' : value > 60 ? 'bg-amber-400' : color;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className={`text-sm font-semibold w-12 text-right ${value > 85 ? 'text-red-400' : value > 60 ? 'text-amber-400' : 'text-white'}`}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

function fmtBytes(bytes: number): string {
  if (!bytes) return '—';
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB/s`;
  if (bytes >= 1_000_000)     return `${(bytes / 1_000_000).toFixed(1)} MB/s`;
  if (bytes >= 1_000)         return `${(bytes / 1_000).toFixed(0)} KB/s`;
  return `${bytes} B/s`;
}

export default function MonitoringPage() {
  const [servers,       setServers]      = useState<ServerData[]>([]);
  const [selected,      setSelected]     = useState<string | null>(null);
  const [history,       setHistory]      = useState<HistoryItem[]>([]);
  const [loadingMain,   setLoadingMain]  = useState(true);
  const [loadingHist,   setLoadingHist]  = useState(false);
  const [recording,     setRecording]    = useState(false);

  const fetchAll = async () => {
    setLoadingMain(true);
    try {
      const res = await adminApi.get('/admin/monitoring');
      const data: ServerData[] = res.data.data;
      setServers(data);
      if (!selected && data.length > 0) setSelected(data[0].server_uuid);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load monitoring data');
    } finally {
      setLoadingMain(false);
    }
  };

  const fetchHistory = async (serverUuid: string) => {
    setLoadingHist(true);
    try {
      const res = await adminApi.get(`/admin/monitoring/${serverUuid}/history`, { params: { limit: 20 } });
      setHistory(res.data.data);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHist(false);
    }
  };

  const handleRecordAll = async () => {
    setRecording(true);
    try {
      const res = await adminApi.post('/admin/monitoring/record-all');
      toast.success(res.data.message || 'Snapshots recorded');
      await fetchAll();
      if (selected) await fetchHistory(selected);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Record failed');
    } finally {
      setRecording(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (selected) fetchHistory(selected);
  }, [selected]);

  const current = servers.find(s => s.server_uuid === selected);
  const m       = current?.latest;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Server Monitoring</h1>
          <p className="text-slate-400 text-sm mt-1">Live resource metrics per Flussonic server</p>
        </div>
        <button onClick={handleRecordAll} disabled={recording || loadingMain}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 self-start sm:self-auto">
          <RefreshCw size={15} className={recording ? 'animate-spin' : ''} />
          {recording ? 'Recording…' : 'Record Snapshot'}
        </button>
      </div>

      {/* Server tabs */}
      {!loadingMain && servers.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: '0.12s' }}>
          {servers.map(s => (
            <button key={s.server_uuid} onClick={() => setSelected(s.server_uuid)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                selected === s.server_uuid
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
              }`}>
              {s.health_status === 'online'
                ? <Wifi size={13} className="text-green-400" />
                : <WifiOff size={13} className="text-red-400" />}
              {s.server_name}
            </button>
          ))}
        </div>
      )}

      {loadingMain ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <svg className="animate-spin h-6 w-6 text-primary mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading monitoring data…
        </div>
      ) : servers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Server size={40} className="opacity-30 mb-3" />
          <p>No active servers found</p>
        </div>
      ) : current && (
        <div className="space-y-6">
          {/* Metric cards */}
          {!m ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-sm animate-fade-up">
              No snapshot recorded yet. Click "Record Snapshot" to pull data from Flussonic.
            </div>
          ) : (
            <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
              {/* Last recorded */}
              <p className="text-xs text-slate-500 mb-4">
                Last snapshot: <span className="text-slate-300">{new Date(m.recorded_at).toLocaleString()}</span>
              </p>

              {/* Usage bars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {[
                  { label: 'CPU Usage', value: m.cpu_usage, icon: Cpu, color: 'bg-primary' },
                  { label: 'RAM Usage', value: m.ram_usage, icon: MemoryStick, color: 'bg-purple-500' },
                  { label: 'Disk Usage', value: m.disk_usage, icon: HardDrive, color: 'bg-amber-500' },
                ].map(card => (
                  <div key={card.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <card.icon size={16} className="text-slate-400" />
                      <span className="text-slate-400 text-sm font-medium">{card.label}</span>
                    </div>
                    <UsageBar value={card.value} color={card.color} />
                  </div>
                ))}
              </div>

              {/* Network + stream/viewer counts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Network In',      value: fmtBytes(m.network_in),    icon: Network, color: 'text-cyan-400' },
                  { label: 'Network Out',     value: fmtBytes(m.network_out),   icon: Network, color: 'text-teal-400' },
                  { label: 'Active Streams',  value: m.active_streams.toString(), icon: Radio,  color: 'text-blue-400' },
                  { label: 'Active Viewers',  value: m.active_viewers.toString(), icon: Users,  color: 'text-green-400' },
                ].map(card => (
                  <div key={card.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <card.icon size={16} className="text-slate-500" />
                      <span className="text-slate-400 text-xs font-medium">{card.label}</span>
                    </div>
                    <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="px-5 py-4 border-b border-slate-800">
              <h2 className="text-white font-semibold text-sm">Recent Snapshots</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/40">
                    {['Recorded At', 'CPU %', 'RAM %', 'Disk %', 'Net In', 'Net Out', 'Streams', 'Viewers'].map(h => (
                      <th key={h} className="px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loadingHist ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading history…</td></tr>
                  ) : history.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No history available</td></tr>
                  ) : history.map(h => (
                    <tr key={h.uuid} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-400">{new Date(h.recorded_at).toLocaleString()}</td>
                      <td className={`px-4 py-3 font-mono font-semibold ${h.cpu_usage > 85 ? 'text-red-400' : 'text-white'}`}>{h.cpu_usage.toFixed(1)}</td>
                      <td className={`px-4 py-3 font-mono font-semibold ${h.ram_usage > 85 ? 'text-red-400' : 'text-white'}`}>{h.ram_usage.toFixed(1)}</td>
                      <td className={`px-4 py-3 font-mono font-semibold ${h.disk_usage > 85 ? 'text-red-400' : 'text-white'}`}>{h.disk_usage.toFixed(1)}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono">{fmtBytes(h.network_in)}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono">{fmtBytes(h.network_out)}</td>
                      <td className="px-4 py-3 text-blue-400 font-semibold">{h.active_streams}</td>
                      <td className="px-4 py-3 text-green-400 font-semibold">{h.active_viewers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
