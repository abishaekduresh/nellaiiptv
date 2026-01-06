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
    const token = localStorage.getItem('admin_token');
    
    if (!token) {
        router.push('/admin');
    }
  }, [router]);

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

      <main className="md:ml-64 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
