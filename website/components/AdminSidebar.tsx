'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Tv, Settings, LogOut, Users, Shield, BookOpen,
  CreditCard, Mail, MessageSquare, BarChart2, ChevronDown, ThumbsUp,
  Server, Megaphone, Film, Hash, X, Radio, Monitor, Building2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const menuItems = [
  { title: 'Dashboard',     icon: LayoutDashboard, href: '/admin/dashboard' },
  {
    title: 'Channels', icon: Tv, href: '#',
    children: [
      { title: 'All Channels',     href: '/admin/channels' },
      { title: 'Channel Numbers',  href: '/admin/channels/renumber' },
    ],
  },
  {
    title: 'Stream Servers', icon: Server, href: '#',
    children: [
      { title: 'All Servers', href: '/admin/stream-servers' },
      { title: 'Add Server',  href: '/admin/stream-servers/create' },
      { title: 'Streams',     href: '/admin/streams' },
      { title: 'Monitoring',  href: '/admin/monitoring' },
    ],
  },
  { title: 'Viewer Sessions', icon: Monitor,   href: '/admin/viewer-sessions' },
  { title: 'Tenants',         icon: Building2, href: '/admin/tenants' },
  { title: 'Scrolling Ads',  icon: Megaphone,    href: '/admin/scrolling-ads' },
  { title: 'Visual Ads',     icon: Film,         href: '/admin/visual-ads' },
  {
    title: 'Reports', icon: BarChart2, href: '#',
    children: [
      { title: 'Channel Views', href: '/admin/reports/channel-views' },
    ],
  },
  { title: 'Customers',    icon: Users,        href: '/admin/customers' },
  { title: 'Comments',     icon: MessageSquare, href: '/admin/comments' },
  { title: 'Messages',     icon: Mail,          href: '/admin/contacts' },
  { title: 'Feedback',     icon: ThumbsUp,      href: '/admin/feedback' },
  { title: 'Transactions', icon: CreditCard,    href: '/admin/transactions' },
  { title: 'API Keys',     icon: Shield,        href: '/admin/api-keys' },
  { title: 'API Docs',     icon: BookOpen,      href: '/admin/api-docs' },
  { title: 'Plans',        icon: Hash,          href: '/admin/plans' },
  { title: 'Settings',     icon: Settings,      href: '/admin/settings' },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Channels: true,
    'Stream Servers': true,
    Reports: true,
  });

  useEffect(() => {
    onClose();
  }, [pathname]);

  const toggleMenu = (title: string) =>
    setOpenMenus(prev => ({ ...prev, [title]: !prev[title] }));

  const handleLogout = () => {
    logout();
    router.push('/admin');
  };

  const filteredItems = menuItems.filter(item => {
    if (user?.role === 'reseller') return ['Dashboard', 'Plans', 'Customers'].includes(item.title);
    return true;
  });

  const resolveHref = (item: (typeof menuItems)[0]) => {
    if (user?.role === 'reseller') {
      if (item.title === 'Dashboard') return '/reseller';
      if (item.title === 'Customers') return '/reseller/customers';
      if (item.title === 'Plans') return '/reseller/plans';
    }
    return item.href;
  };

  const isItemActive = (href: string) =>
    href !== '#' && (pathname === href || (href.length > 10 && pathname.startsWith(href)));

  const roleLabel = user?.role === 'reseller' ? 'Reseller Panel' : 'Admin Panel';
  const userName = (user as any)?.name || (user as any)?.username || 'Admin';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed left-0 top-0 h-screen w-72 z-50 flex flex-col
        bg-slate-900 border-r border-slate-800
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>

        {/* Header */}
        <div className="relative px-5 py-5 border-b border-slate-800 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent pointer-events-none" />
          <div className="flex items-center justify-between relative">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 transition-opacity group-hover:opacity-80">
                <Image
                  src="/assets/logos/Nellai IPTV logo 512x512px.webp"
                  alt="Nellai IPTV"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="text-white font-bold text-base leading-tight group-hover:text-primary transition-colors">Nellai IPTV</div>
                <div className="text-xs text-primary font-medium">{roleLabel}</div>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* User chip */}
        <div className="px-4 py-3 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/50 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/40 to-cyan-600/40 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{userName}</p>
              <p className="text-slate-500 text-xs capitalize">{user?.role || 'admin'}</p>
            </div>
            <span className="ml-auto w-2 h-2 rounded-full bg-green-400 shrink-0" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const href = resolveHref(item);
            const hasChildren = !!item.children?.length;

            if (hasChildren) {
              const expanded = openMenus[item.title];
              const childActive = item.children!.some(c => pathname === c.href);

              return (
                <div key={item.title}>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      childActive
                        ? 'text-primary bg-primary/10'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="flex-1 text-left">{item.title}</span>
                    <ChevronDown
                      size={15}
                      className={`shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <div className={`overflow-hidden transition-all duration-200 ${expanded ? 'max-h-56' : 'max-h-0'}`}>
                    <div className="ml-6 mt-0.5 pl-3 border-l border-slate-800 space-y-0.5 pb-1">
                      {item.children!.map(child => {
                        const active = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`block px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                              active
                                ? 'text-primary bg-primary/10 font-semibold'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                            }`}
                          >
                            {child.title}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            const active = isItemActive(href);
            return (
              <Link
                key={item.href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'text-primary bg-primary/10 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {active && <span className="absolute left-0 w-0.5 h-6 bg-primary rounded-r-full" />}
                <Icon size={18} className="shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-slate-800 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
