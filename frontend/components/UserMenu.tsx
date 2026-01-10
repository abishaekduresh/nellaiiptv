'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Crown } from 'lucide-react';

interface UserProps {
  user: {
    username?: string;
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
    plan?: any;
  };
}

const UserMenu = ({ user }: UserProps) => {
  const displayName = user.username || user.name || 'User';
  const displayEmail = user.email || user.phone || '';

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-slate-300 hover:text-white focus:outline-none"
      >
        <div className="relative w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
          {displayName.charAt(0).toUpperCase()}
          {((user as any).plan && (user as any).status === 'active') && (
            <div className="absolute -top-1 -right-1 bg-yellow-500 text-slate-900 rounded-full p-0.5 shadow-sm border border-slate-900" title="Premium">
                <Crown size={10} fill="currentColor" />
            </div>
          )}
        </div>
        <span className="hidden md:block">{displayName}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg py-1 z-50 border border-slate-700">
          <div className="px-4 py-2 border-b border-slate-700">
            <p className="text-sm text-white font-medium truncate">{displayName}</p>
            <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
          </div>
          
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            Profile
          </Link>
          
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
