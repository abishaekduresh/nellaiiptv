'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Settings, Search, X, Loader2, Menu, Maximize, Minimize, Crown, Tv, CreditCard, Radio, RotateCcw } from 'lucide-react';
import UserMenu from './UserMenu';
import api from '@/lib/api';
import { Channel } from '@/types';
import { useTVFocus } from '@/hooks/useTVFocus';

interface MyStream {
  uuid: string;
  stream_name: string;
  health_status: 'online' | 'offline' | null;
  stream_status: 'running' | 'stopped' | 'error' | null;
  status: string;
  published_via: string | null;
  uptime: number | null;
  online_clients: number | null;
  max_sessions: number | null;
  out_bandwidth: number | null;
}

function fmtUptime(ms: number | null): string {
  if (!ms || ms <= 0) return '';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Navbar() {
  const { user, isAdmin } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const [showSearch, setShowSearch] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [logoUrl, setLogoUrl] = useState('/icon.jpg');
  const [scrolled, setScrolled] = useState(false);
  const [myStreams, setMyStreams] = useState<MyStream[]>([]);
  const [showStreams, setShowStreams] = useState(false);
  const [restarting, setRestarting] = useState<string | null>(null);
  const [restartCooldowns, setRestartCooldowns] = useState<Record<string, number>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncCooldown, setSyncCooldown] = useState(0);
  const streamsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/settings/public').then(res => {
      if (res.data.status && res.data.data.logo_url) setLogoUrl(res.data.data.logo_url);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

  // Fetch assigned streams for logged-in customer
  const fetchStreams = useCallback(async (force = false) => {
    try {
      const params: Record<string, unknown> = { _t: Date.now() };
      if (force) params.sync = 1;
      const res = await api.get('/customers/streams', { params });
      if (res.data?.status) setMyStreams(res.data.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) { setMyStreams([]); return; }
    fetchStreams();
  }, [user]);

  // Sync cooldown tick
  useEffect(() => {
    if (syncCooldown <= 0) return;
    const t = setTimeout(() => setSyncCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [syncCooldown]);

  // Restart cooldown tick — decrements all active per-stream cooldowns
  useEffect(() => {
    const active = Object.values(restartCooldowns).some(v => v > 0);
    if (!active) return;
    const t = setTimeout(() => {
      setRestartCooldowns(prev => {
        const next = { ...prev };
        for (const k in next) if (next[k] > 0) next[k]--;
        return next;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [restartCooldowns]);

  // Close streams panel on outside click
  useEffect(() => {
    if (!showStreams) return;
    const handler = (e: MouseEvent) => {
      if (streamsRef.current && !streamsRef.current.contains(e.target as Node)) {
        setShowStreams(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStreams]);

  const handleSync = async () => {
    if (syncing || syncCooldown > 0) return;
    setSyncing(true);
    try {
      await fetchStreams(true); // force=true → ?sync=1 → triggers Flussonic pull
    } finally {
      setSyncing(false);
      setSyncCooldown(30);
    }
  };

  const handleStreamRestart = async (streamUuid: string) => {
    if (restarting || (restartCooldowns[streamUuid] ?? 0) > 0) return;
    setRestarting(streamUuid);
    try {
      await api.post(`/customers/streams/${streamUuid}/toggle`, { enable: false });
      await new Promise(r => setTimeout(r, 2000));
      await api.post(`/customers/streams/${streamUuid}/toggle`, { enable: true });
      await fetchStreams();
    } catch {}
    setRestarting(null);
    setRestartCooldowns(prev => ({ ...prev, [streamUuid]: 30 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/channels?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await api.get('/channels', { params: { search: searchQuery, limit: 5 } });
          setSearchResults(res.data.status ? (res.data.data.data || res.data.data || []) : []);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  const handleResultClick = (uuid: string) => {
    router.push(`/channel/${uuid}`);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const isReseller = (user as any)?.role === 'reseller';

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 shadow-xl shadow-black/20'
            : 'bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60'
        }`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-white/10 group-hover:ring-primary/50 transition-all duration-300 shadow-lg">
                <Image src={logoUrl} alt="Nellai IPTV" width={32} height={32} className="w-full h-full object-cover" unoptimized />
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                Nellai <span className="text-primary">IPTV</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/" label="Home" pathname={pathname} />
              <NavLink href="/channels" label="Watch TV" pathname={pathname} />
              <NavLink href="/stream" label="Streaming" pathname={pathname} />
              {isReseller
                ? <NavLink href="/reseller" label="Reseller" pathname={pathname} />
                : <NavLink href="/plans" label="Plans" pathname={pathname} />
              }
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <FullScreenToggle />

              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200"
                title="Search channels"
                aria-label="Search"
              >
                <Search size={19} />
              </button>

              {user ? (
                <div className="flex items-center gap-2">
                  {myStreams.length > 0 && (
                    <div ref={streamsRef} className="relative">
                      <button
                        onClick={() => setShowStreams(v => !v)}
                        className={`relative hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                          showStreams
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/15'
                        }`}
                        title="My Streams"
                      >
                        <Radio size={13} />
                        My Streams
                        <span className="ml-0.5 bg-cyan-500 text-slate-900 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                          {myStreams.length}
                        </span>
                      </button>

                      {showStreams && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                            <Radio size={14} className="text-cyan-400" />
                            <span className="text-white text-sm font-semibold">My Streams</span>
                            <span className="text-slate-500 text-xs">{myStreams.length} assigned</span>
                            <button
                              onClick={handleSync}
                              disabled={syncing || syncCooldown > 0}
                              className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-semibold"
                              title="Sync streams"
                            >
                              <RotateCcw size={10} className={syncing ? 'animate-spin' : ''} />
                              {syncing ? 'Syncing…' : syncCooldown > 0 ? `${syncCooldown}s` : 'Sync'}
                            </button>
                          </div>
                          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                            {myStreams.map(s => {
                              const isHealthy = s.health_status === 'online';
                              const stLabel = s.stream_status === 'running' ? 'Running' : s.stream_status === 'stopped' ? 'Stopped' : s.stream_status === 'error' ? 'Error' : null;
                              const stColor = s.stream_status === 'running' ? 'text-emerald-400' : s.stream_status === 'error' ? 'text-red-400' : 'text-slate-500';
                              const cd = restartCooldowns[s.uuid] ?? 0;
                              const isRestarting = restarting === s.uuid;
                              return (
                                <div key={s.uuid} className="px-4 py-3 flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${isHealthy ? 'bg-green-400 shadow-sm shadow-green-400/50' : 'bg-red-500'}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{s.stream_name}</p>
                                    <div className="flex items-center gap-2 text-xs mt-0.5 flex-wrap">
                                      <span className={isHealthy ? 'text-green-400' : 'text-red-400'}>
                                        {isHealthy ? 'Online' : 'Offline'}
                                      </span>
                                      {stLabel && <span className={`${stColor} font-medium`}>· {stLabel}</span>}
                                      {s.published_via && <span className="text-slate-500">· {s.published_via}</span>}
                                      {s.uptime ? <span className="text-slate-500">· ⏱ {fmtUptime(s.uptime)}</span> : null}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleStreamRestart(s.uuid)}
                                    disabled={!!restarting || cd > 0}
                                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 text-[10px] font-semibold min-w-[52px] justify-center"
                                    title={cd > 0 ? `Available in ${cd}s` : 'Restart'}
                                  >
                                    <RotateCcw size={11} className={isRestarting ? 'animate-spin' : ''} />
                                    {isRestarting ? '…' : cd > 0 ? `${cd}s` : 'Restart'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      className="hidden sm:flex items-center gap-1.5 text-secondary hover:text-yellow-300 transition-colors px-3 py-1.5 rounded-full bg-yellow-500/10 hover:bg-yellow-500/15 border border-yellow-500/20 text-xs font-semibold"
                    >
                      <Settings size={14} />
                      Dashboard
                    </Link>
                  )}
                  <UserMenu user={user as any} />
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href={`/login?redirect=${encodeURIComponent(pathname)}`}
                    className="px-4 py-2 text-slate-300 hover:text-white text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-primary hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-px"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(v => !v)}
                className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200"
                aria-label="Toggle menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Sidebar */}
      <div
        className={`md:hidden fixed top-0 right-0 bottom-0 z-[9999] w-80 max-w-[88vw] bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden ring-1 ring-white/10">
              <Image src={logoUrl} alt="Logo" width={28} height={28} className="w-full h-full object-cover" unoptimized />
            </div>
            <span className="font-bold text-white">Nellai <span className="text-primary">IPTV</span></span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Body */}
        <div className="flex-1 px-4 py-5 space-y-6">

          {/* Nav Links */}
          <nav className="space-y-1">
            {[
              { href: '/',         label: 'Home',               icon: null    },
              { href: '/channels', label: 'Watch TV',           icon: Tv      },
              { href: '/stream',   label: 'Streaming',          icon: Radio   },
              { href: isReseller ? '/reseller' : '/plans', label: isReseller ? 'Reseller Panel' : 'Subscription Plans', icon: CreditCard },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === href
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {Icon && <Icon size={17} className="shrink-0" />}
                {label}
              </Link>
            ))}
          </nav>

          <div className="h-px bg-slate-800" />

          {/* User Section */}
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="relative w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-base shrink-0">
                  {((user as any).name || (user as any).username)?.[0]?.toUpperCase() || 'U'}
                  {(user as any).plan && (user as any).status === 'active' && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-slate-900 rounded-full p-0.5 border-2 border-slate-900">
                      <Crown size={10} fill="currentColor" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{(user as any).name || (user as any).username}</p>
                  <p className="text-slate-400 text-xs truncate">{(user as any).email || (user as any).phone}</p>
                </div>
              </div>
              <Link href="/profile" className="block text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-2.5 rounded-xl text-sm transition-all">
                My Profile
              </Link>
              {myStreams.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/50">
                    <Radio size={13} className="text-cyan-400" />
                    <span className="text-slate-300 text-sm font-medium">My Streams</span>
                    <span className="ml-auto text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full">{myStreams.length}</span>
                  </div>
                  <div className="divide-y divide-slate-700/30 max-h-48 overflow-y-auto">
                    {myStreams.map(s => (
                      <div key={s.uuid} className="flex items-center gap-2.5 px-4 py-2.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${s.health_status === 'online' ? 'bg-green-400' : 'bg-red-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{s.stream_name}</p>
                          {s.uptime ? <p className="text-slate-500 text-[11px]">⏱ {fmtUptime(s.uptime)}</p> : null}
                        </div>
                        <button
                          onClick={() => handleStreamRestart(s.uuid)}
                          disabled={restarting === s.uuid}
                          className="p-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                          title="Restart"
                        >
                          <RotateCcw size={12} className={restarting === s.uuid ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isAdmin && (
                <Link href="/admin/dashboard" className="block text-secondary hover:text-yellow-300 hover:bg-slate-800 px-4 py-2.5 rounded-xl text-sm transition-all">
                  Admin Dashboard
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <Link
                href={`/login?redirect=${encodeURIComponent(pathname)}`}
                className="block text-center px-4 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block text-center px-4 py-3 rounded-xl bg-primary hover:bg-cyan-500 text-white transition-colors text-sm font-semibold"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSearch(false)} />
          <div className="relative w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Search Channels</h3>
              <button onClick={() => setShowSearch(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSearch} className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search channels or enter a number..."
                  className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-primary focus:outline-none text-sm placeholder:text-slate-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-cyan-500 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-primary/30"
                >
                  Search
                </button>
              </div>

              {(isSearching || searchResults.length > 0) && searchQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-slate-400 flex items-center justify-center gap-2 text-sm">
                      <Loader2 className="animate-spin" size={15} />
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <ul>
                      {searchResults.map(ch => (
                        <li key={ch.uuid}>
                          <SearchResultItem channel={ch} onClick={() => handleResultClick(ch.uuid)} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-sm">No channels found.</div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const router = useRouter();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
  const { focusProps, isFocused } = useTVFocus({
    onEnter: () => router.push(href),
    className: `relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 outline-none`,
  });

  return (
    <Link
      href={href}
      {...focusProps}
      className={`${focusProps.className} ${
        isActive
          ? 'text-white bg-slate-800'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
      } ${isFocused ? 'ring-2 ring-primary' : ''}`}
    >
      {label}
      {isActive && (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
      )}
    </Link>
  );
}

function FullScreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handle = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handle);
    return () => document.removeEventListener('fullscreenchange', handle);
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const { focusProps, isFocused } = useTVFocus({
    onEnter: toggle,
    className: 'p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200 outline-none',
  });

  return (
    <button
      {...focusProps}
      onClick={toggle}
      className={`${focusProps.className} ${isFocused ? 'ring-2 ring-primary text-white bg-slate-800' : ''}`}
      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
    >
      {isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
    </button>
  );
}

function SearchResultItem({ channel, onClick }: { channel: Channel; onClick: () => void }) {
  const { focusProps, isFocused } = useTVFocus({
    onEnter: onClick,
    className: 'w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left focus:outline-none',
  });

  return (
    <button
      {...focusProps}
      className={`${focusProps.className} ${isFocused ? 'bg-slate-700 ring-inset ring-2 ring-primary' : ''}`}
    >
      <div className="w-12 h-8 bg-slate-900 rounded-lg overflow-hidden shrink-0">
        {channel.thumbnail_url ? (
          <img src={channel.thumbnail_url} alt={channel.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px]">IMG</div>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-white font-medium text-sm truncate">
          {channel.channel_number && (
            <span className="text-primary font-bold mr-1.5">CH {channel.channel_number}</span>
          )}
          {channel.name}
        </p>
        <p className="text-slate-400 text-xs">{channel.language?.name}</p>
      </div>
    </button>
  );
}
