'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Settings, Search, X, Loader2, Menu, Maximize, Minimize } from 'lucide-react';
import UserMenu from './UserMenu';
import api from '@/lib/api';
import { Channel } from '@/types';
import { useTVFocus } from '@/hooks/useTVFocus';
import { useViewMode } from '@/context/ViewModeContext';
import { Monitor, LayoutGrid } from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin } = useAuthStore();
  const { mode, toggleMode } = useViewMode();
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [logoUrl, setLogoUrl] = useState('/icon.jpg');

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await api.get('/settings/public');
        if (response.data.status && response.data.data.logo_url) {
          setLogoUrl(response.data.data.logo_url);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchLogo();
  }, []);

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
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await api.get('/channels', { 
            params: { search: searchQuery, limit: 5 } 
          });
          if (response.data.status) {
            setSearchResults(response.data.data.data || response.data.data || []);
          } else {
            setSearchResults([]);
          }
        } catch (err) {
          console.error('Search error:', err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300); // 300ms debounce
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleResultClick = (uuid: string) => {
    router.push(`/channel/${uuid}`);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  /* Existing Logic */
  if (mode === 'Classic') return null;

  return (
    <>
      <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg group-hover:shadow-primary/50 transition-all duration-300">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Nellai <span className="text-primary">IPTV</span></span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <NavButton href="/" label="Home" />
              <NavButton href="/channels" label="Channels" />
              <NavButton href="/about" label="About" />
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Fullscreen Toggle */}
              <FullScreenToggle />

              {/* View Mode Toggle */}
              <ViewModeToggle />

              {/* Search Icon (Mobile/Desktop) */}
              <button 
                onClick={() => setShowSearch(true)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Search"
              >
                <Search size={20} />
              </button>

              {user ? (
                <div className="flex items-center space-x-4">
                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center space-x-1 text-secondary hover:text-yellow-300 transition-colors px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20"
                    >
                      <Settings size={16} />
                      <span className="text-xs font-medium">Admin</span>
                    </Link>
                  )}
                  <UserMenu user={user as any} />
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-slate-300 hover:text-white font-medium text-sm transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-primary hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40"
                  >
                    Register
                  </Link>
                </div>
              )}
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
                aria-label="Toggle menu"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Sidebar Drawer - Outside nav to avoid stacking context issues */}
      {/* Backdrop */}
      <div 
        className={`md:hidden fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Sidebar */}
      <div 
        className={`md:hidden fixed top-0 right-0 bottom-0 z-[9999] w-80 max-w-[85vw] bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-lg font-bold text-white">Menu</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Menu Content */}
          <div className="flex-1 p-6 space-y-6">
            {/* Navigation Links */}
            <div className="space-y-2">
              <Link 
                href="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-lg transition-all"
              >
                Home
              </Link>
              <Link 
                href="/channels" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-lg transition-all"
              >
                Channels
              </Link>
              <Link 
                href="/about" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-lg transition-all"
              >
                About
              </Link>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800"></div>

            {/* User Section */}
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                    {((user as any).name || (user as any).username)?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{(user as any).name || (user as any).username}</p>
                    <p className="text-slate-400 text-sm truncate">{(user as any).email || (user as any).phone}</p>
                  </div>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-lg transition-all"
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-secondary hover:text-yellow-300 hover:bg-slate-800 px-4 py-3 rounded-lg transition-all"
                  >
                    Admin Dashboard
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-center px-4 py-3 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-center px-4 py-3 rounded-lg bg-primary hover:bg-cyan-600 text-white transition-colors font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSearch(false)} />
          <div className="relative w-full max-w-2xl bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Search Channels</h3>
              <button
                onClick={() => setShowSearch(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSearch} className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for channels or number..."
                  className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-primary focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Search
                </button>
              </div>

              {/* Live Results Dropdown */}
              {(isSearching || searchResults.length > 0) && searchQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <ul>
                      {searchResults.map((channel) => (
                        <li key={channel.uuid}>
                          <SearchResultItem 
                            channel={channel} 
                            onClick={() => handleResultClick(channel.uuid)} 
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-slate-400">
                      No channels found.
                    </div>
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

function NavButton({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  const { focusProps } = useTVFocus({
    onEnter: () => router.push(href),
    className: "text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium"
  });

  return (
    <Link href={href} {...focusProps}>
      {label}
    </Link>
  );
}

// Helper for View Mode Toggle Button with TV Focus
function ViewModeToggle() {
    const { mode, toggleMode } = useViewMode();
    const { focusProps, isFocused } = useTVFocus({
        onEnter: toggleMode,
        className: "flex items-center gap-2 p-2 md:px-4 md:py-2 rounded-full border border-slate-700 bg-slate-800/50 text-slate-300 hover:text-white transition-all outline-none"
    });

    return (
        <button
            onClick={toggleMode}
            {...focusProps}
            className={`${focusProps.className} ${isFocused ? 'ring-2 ring-primary bg-slate-800 text-white scale-105 shadow-lg' : ''}`}
            title={`Switch to ${mode === 'OTT' ? 'Classic' : 'OTT'} Mode`}
        >
            {mode === 'OTT' ? <LayoutGrid size={18} /> : <Monitor size={18} />}
            <span className="hidden md:inline text-sm font-medium">{mode === 'OTT' ? 'Classic' : 'OTT'}</span>
        </button>
    );
}

function FullScreenToggle() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => console.error(e));
        } else {
            document.exitFullscreen().catch(e => console.error(e));
        }
    };

    const { focusProps, isFocused } = useTVFocus({
        onEnter: toggleFullscreen,
        className: "p-2 text-slate-400 hover:text-white transition-colors outline-none rounded-full"
    });

    return (
        <button
            onClick={toggleFullscreen}
            {...focusProps}
            className={`${focusProps.className} ${isFocused ? 'ring-2 ring-primary bg-slate-800 text-white' : ''}`}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
    );
}

function SearchResultItem({ channel, onClick }: { channel: Channel; onClick: () => void }) {
  const { focusProps, isFocused } = useTVFocus({
    onEnter: onClick,
    className: "w-full flex items-center gap-3 p-3 hover:bg-slate-700 transition-colors text-left focus:outline-none"
  });

  return (
    <button
      onClick={onClick}
      {...focusProps}
      className={`${focusProps.className} ${isFocused ? 'bg-slate-700 ring-2 ring-primary z-10' : ''}`}
    >
      <div className="w-12 h-8 bg-slate-900 rounded overflow-hidden flex-shrink-0">
        {channel.thumbnail_url ? (
          <img src={channel.thumbnail_url} alt={channel.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">IMG</div>
        )}
      </div>
      <div>
        <p className="text-white font-medium text-sm">
          {channel.channel_number ? (
            <span className="text-primary font-bold mr-2">CH {channel.channel_number}</span>
          ) : null}
          {channel.name}
        </p>
        <p className="text-slate-400 text-xs">{channel.language?.name}</p>
      </div>
    </button>
  );
}
