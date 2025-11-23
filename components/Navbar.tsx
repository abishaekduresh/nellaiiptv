'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Settings, Search, X, Loader2 } from 'lucide-react';
import UserMenu from './UserMenu';
import api from '@/lib/api';
import { Channel } from '@/types';

export default function Navbar() {
  const { user, isAdmin } = useAuthStore();
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    if (searchQuery.trim().length > 1) {
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

  return (
    <>
      <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg group-hover:shadow-primary/50 transition-all duration-300">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Nellai <span className="text-primary">IPTV</span></span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium">
                Home
              </Link>
              <Link href="/channels" className="text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium">
                Channels
              </Link>
              <Link href="/about" className="text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium">
                About
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Icon (Mobile/Desktop) */}
              <button 
                onClick={() => setShowSearch(true)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <Search size={20} />
              </button>

              {user ? (
                <div className="flex items-center space-x-4">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center space-x-1 text-secondary hover:text-yellow-300 transition-colors px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20"
                    >
                      <Settings size={16} />
                      <span className="text-xs font-medium">Admin</span>
                    </Link>
                  )}
                  <UserMenu user={user as any} />
                </div>
              ) : (
                <div className="flex items-center space-x-3">
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
            </div>
          </div>
        </div>
      </nav>

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
                  placeholder="Search for channels..."
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
              {(isSearching || searchResults.length > 0) && searchQuery.length > 1 && (
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
                          <button
                            onClick={() => handleResultClick(channel.uuid)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-700 transition-colors text-left"
                          >
                            <div className="w-12 h-8 bg-slate-900 rounded overflow-hidden flex-shrink-0">
                              {channel.thumbnail_url ? (
                                <img src={channel.thumbnail_url} alt={channel.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">IMG</div>
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{channel.name}</p>
                              <p className="text-slate-400 text-xs">{channel.language?.name}</p>
                            </div>
                          </button>
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
