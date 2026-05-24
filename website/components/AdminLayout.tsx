'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Menu, Activity } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('admin_token') || useAuthStore.getState().token;
    if (token && !localStorage.getItem('admin_token')) {
      localStorage.setItem('admin_token', token);
    }

    if (!token) {
      if (window.location.pathname.startsWith('/reseller')) {
        router.push('/login');
      } else {
        router.push('/admin');
      }
    } else if (!user) {
      const authStorage = localStorage.getItem('auth-storage');
      let isReseller = false;

      if (window.location.pathname.startsWith('/reseller')) {
        isReseller = true;
      } else if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          isReseller = parsed?.state?.user?.role === 'reseller';
        } catch (e) {}
      }

      import('@/lib/adminApi').then(({ default: adminApi }) => {
        const profileEndpoint = isReseller ? '/customers/profile' : '/admin/profile';
        adminApi.get(profileEndpoint)
          .then(res => {
            if (res.data?.data) {
              useAuthStore.getState().setAuth(token, res.data.data, true);
            }
          })
          .catch((err) => {
            if (err.response?.status === 401) {
              localStorage.removeItem('admin_token');
              router.push(window.location.pathname.startsWith('/reseller') ? '/login' : '/admin');
            }
          });
      });
    }
  }, [router, user]);

  if (!mounted) return null;

  const roleLabel = user?.role === 'reseller' ? 'Reseller Panel' : 'Admin Panel';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Activity size={15} className="text-primary" />
          </div>
          <span className="font-bold text-white">{roleLabel}</span>
        </div>
      </header>

      <main className="md:ml-72 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
}
