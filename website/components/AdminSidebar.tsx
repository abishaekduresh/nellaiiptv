'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Tv, Settings, LogOut, Users, Shield, BookOpen, CreditCard, Mail, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
  },
  {
    title: 'Channels',
    icon: Tv,
    href: '/admin/channels',
  },
  {
    title: 'Customers',
    icon: Users,
    href: '/admin/customers', // Assuming this route might exist or will be added later
  },
  {
    title: 'Comments',
    icon: MessageSquare,
    href: '/admin/comments',
  },
  {
    title: 'Messages',
    icon: Mail,
    href: '/admin/contacts',
  },
  {
    title: 'Transactions',
    icon: CreditCard,
    href: '/admin/transactions',
  },
  {
    title: 'API Keys',
    icon: Shield,
    href: '/admin/api-keys',
  },
  {
    title: 'API Docs',
    icon: BookOpen,
    href: '/admin/api-docs',
  },
  {
    title: 'Plans',
    icon: Settings,
    href: '/admin/plans',
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/admin/settings',
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/admin');
  };

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    // For resellers, show only Dashboard, Plans, and Customers
    if (user?.role === 'reseller') {
      return ['Dashboard', 'Plans', 'Customers'].includes(item.title);
    }
    // For admins, show everything
    return true;
  });

  // Update menu item hrefs for resellers
  const getMenuItemHref = (item: typeof menuItems[0]) => {
    if (user?.role === 'reseller') {
      if (item.title === 'Dashboard') return '/reseller';
      if (item.title === 'Customers') return '/reseller/customers';
      if (item.title === 'Plans') return '/reseller/plans';
    }
    return item.href;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed left-0 top-0 h-screen w-64 bg-background-card border-r border-gray-800 flex flex-col z-50 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-primary">Nellai IPTV</h1>
            <p className="text-xs text-text-secondary mt-1">
              {user?.role === 'reseller' ? 'Reseller Panel' : 'Admin Panel'}
            </p>
          </div>
          {/* Close button for mobile can be added here if needed, but overlay click works too */}
        </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const href = getMenuItemHref(item);
          // Exact match for active state to prevent multiple highlights
          const isActive = pathname === href || (href !== '/admin/dashboard' && href !== '/reseller' && pathname.startsWith(href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
    </>
  );
}
