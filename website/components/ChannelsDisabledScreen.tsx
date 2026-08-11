'use client';

import Link from 'next/link';
import { MonitorOff, Home } from 'lucide-react';

/**
 * Shown on /channels and /channel/[uuid] when the admin has disabled the "web"
 * platform via the "Disable Specific Platforms" setting.
 */
export default function ChannelsDisabledScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
          <MonitorOff size={36} className="text-red-400" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">
          Not Available on Web
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8">
          Channel viewing is currently disabled on the website. Please use the
          Nellai IPTV mobile or TV app to continue watching.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary hover:bg-cyan-500 text-white font-semibold px-5 py-3 rounded-xl transition-all hover:-translate-y-0.5"
        >
          <Home size={16} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
