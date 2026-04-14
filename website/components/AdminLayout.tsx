'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Menu } from 'lucide-react';
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
        // Hydrate store if we have an admin token but no user state (e.g. refresh)
        // Check if this is a reseller (customer) or admin (user)
        const authStorage = localStorage.getItem('auth-storage');
        let isReseller = false;
        
        if (window.location.pathname.startsWith('/reseller')) {
            isReseller = true;
        } else if (authStorage) {
            try {
                const parsed = JSON.parse(authStorage);
                isReseller = parsed?.state?.user?.role === 'reseller';
            } catch (e) {
                // Ignore parse errors
            }
        }
        
        import('@/lib/adminApi').then(({ default: adminApi }) => {
            // Resellers use customer profile, admins use admin profile
            const profileEndpoint = isReseller ? '/customers/profile' : '/admin/profile';
            
            adminApi.get(profileEndpoint)
                .then(res => {
                    if (res.data && res.data.data) {
                        useAuthStore.getState().setAuth(token, res.data.data, true);
                    }
                })
                .catch((err) => {
                    console.error("AdminLayout profile fetch error", err);
                    // Only invalid token (401) should trigger logout/redirect
                    if (err.response && err.response.status === 401) {
                         localStorage.removeItem('admin_token');
                         if (window.location.pathname.startsWith('/reseller')) {
                             router.push('/login');
                         } else {
                             router.push('/admin');
                         }
                    }
                });
        });
    }
  }, [router, user]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center p-4 border-b border-gray-800 bg-background-card sticky top-0 z-30">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 text-white hover:bg-gray-800 rounded-lg"
        >
          <Menu size={24} />
        </button>
        <h1 className="ml-4 font-bold text-lg">Admin Panel</h1>
      </div>

      <main className="md:ml-64 p-2 md:p-4">
        {children}
      </main>
    </div>
  );
}
