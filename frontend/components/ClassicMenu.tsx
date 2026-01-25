'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useTVFocus } from '@/hooks/useTVFocus';
import { 
    X, LogIn, UserPlus, Info, Mail, User, LogOut, Monitor, Home 
} from 'lucide-react';

interface ClassicMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClassicMenu({ isOpen, onClose }: ClassicMenuProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const menuItems = [
    { label: 'Home', icon: Home, action: () => handleNavigation('/') },
    ...(!user ? [
      { label: 'Login', icon: LogIn, action: () => handleNavigation('/login') },
      { label: 'Register', icon: UserPlus, action: () => handleNavigation('/register') },
    ] : [
      { label: 'My Profile', icon: User, action: () => handleNavigation('/profile') },
      { label: 'Devices', icon: Monitor, action: () => handleNavigation('/devices') },
    ]),
    { label: 'About Us', icon: Info, action: () => handleNavigation('/about') },
    { label: 'Contact', icon: Mail, action: () => handleNavigation('/contact') },
    ...(user ? [
        { label: 'Sign Out', icon: LogOut, action: () => { logout(); onClose(); }, color: 'text-red-400' }
    ] : [])
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Side Menu */}
      <div className={`
        fixed top-0 left-0 h-full w-72 lg:w-80 bg-slate-900 border-r border-slate-800 
        transform transition-transform duration-300 ease-out z-[101] shadow-2xl flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex flex-col">
                <h2 className="text-xl font-bold text-white tracking-tight">Menu</h2>
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Nellai IPTV</span>
            </div>
            <MenuCloseButton onClick={onClose} />
        </div>

        {/* User Info (if logged in) */}
        {user && (
            <div className="p-6 bg-slate-800/20 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20">
                        {((user as any).username || (user as any).name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-white truncate">{(user as any).username || (user as any).name}</span>
                        <span className="text-[10px] text-slate-500 truncate">{user.email || (user as any).phone}</span>
                    </div>
                </div>
            </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
            {menuItems.map((item, index) => (
                <MenuItem 
                    key={index} 
                    {...item} 
                    onClose={onClose} // Pass for key handling if needed
                />
            ))}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/30">
            <p className="text-[10px] text-slate-600 text-center font-medium">
                © 2026 Nellai IPTV<br/>All Rights Reserved
            </p>
        </div>
      </div>
    </>
  );
}

function MenuItem({ label, icon: Icon, action, color = 'text-slate-300' }: any) {
    const { focusProps, isFocused } = useTVFocus({
        onEnter: action,
        className: `w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative`
    });

    return (
        <button
            {...focusProps}
            onClick={action}
            className={`
                ${focusProps.className}
                ${isFocused ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : `hover:bg-slate-800/50 ${color}`}
            `}
        >
            <div className={`
                p-2 rounded-lg transition-colors
                ${isFocused ? 'bg-white/20' : 'bg-slate-800 text-slate-400 group-hover:text-white'}
            `}>
                <Icon size={18} />
            </div>
            <span className="font-semibold text-sm tracking-wide">{label}</span>
            {isFocused && (
                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
        </button>
    );
}

function MenuCloseButton({ onClick }: { onClick: () => void }) {
    const { focusProps, isFocused } = useTVFocus({
        onEnter: onClick,
        className: `p-2 rounded-lg transition-all duration-200`
    });

    return (
        <button
            {...focusProps}
            onClick={onClick}
            className={`
                ${focusProps.className}
                ${isFocused ? 'bg-white text-slate-900 scale-110 shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}
            `}
        >
            <X size={20} />
        </button>
    );
}
