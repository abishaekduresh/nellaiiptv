'use client';

import { useEffect, useState } from 'react';
import { Terminal, Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface CronEndpoint {
  method: 'GET' | 'POST';
  label: string;
  path: string;
}

interface Props {
  endpoints: CronEndpoint[];
}

export default function CronUrlCard({ endpoints }: Props) {
  const [cronKey, setCronKey] = useState<string | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/backend/public/api';

  useEffect(() => {
    adminApi.get('/admin/settings/cron-key')
      .then(res => setCronKey(res.data.data.key))
      .catch(() => {});
  }, []);

  const copy = (path: string) => {
    const url = `${apiBase}${path}?secret=${cronKey ?? 'YOUR_KEY'}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copied');
  };

  return (
    <div className="bg-slate-900/80 border border-violet-700/30 rounded-2xl p-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-violet-400" />
          <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Cron URL{endpoints.length > 1 ? 's' : ''}</span>
        </div>
        <Link href="/admin/settings" className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-400 transition-colors">
          Manage key <ExternalLink size={11} />
        </Link>
      </div>

      <div className="space-y-2">
        {endpoints.map(({ method, label, path }) => {
          const url = `${apiBase}${path}?secret=${cronKey ?? 'YOUR_KEY'}`;
          return (
            <div key={path} className="flex items-center gap-2">
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {method}
              </span>
              <span className="text-xs text-slate-400 shrink-0 hidden sm:block">{label}</span>
              <code className={`flex-1 bg-slate-800 text-xs px-3 py-1.5 rounded-lg font-mono truncate ${cronKey ? 'text-violet-300' : 'text-slate-500'}`}>
                {url}
              </code>
              <button onClick={() => copy(path)} title="Copy URL"
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors shrink-0">
                <Copy size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {!cronKey && (
        <p className="text-xs text-amber-400 mt-2">
          No cron key set.{' '}
          <Link href="/admin/settings" className="underline hover:text-amber-300">Generate one in Settings.</Link>
        </p>
      )}
    </div>
  );
}
