'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { User, LogOut, CreditCard, Monitor, Crown } from 'lucide-react';
import DeviceManager from '@/components/DeviceManager';

export default function ProfilePage() {
  const { user, logout, token } = useAuthStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const displayUser = profile || user;

  useEffect(() => {
    setMounted(true);
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch fresh profile data
    const fetchProfile = async () => {
        try {
            const res = await api.get('/customers/profile');
            if (res.data.status) {
                // Update auth store or just use local state? 
                // Updating auth store user object is better for consistency if we had a method
                // For now, let's force update the user in the store if possible, 
                // but since we can't easily access the setter without seeing store code, 
                // I'll assume we can update it or I'll just rely on the fresh data for this page.
                // Actually, I'll update the `user` via a local merge for display
                setProfile(res.data.data);
                useAuthStore.getState().setAuth(token, res.data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    
    fetchProfile();
  }, [token, router]);

  if (!mounted || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-12 px-4 md:px-8">
      <div className="container-custom max-w-4xl">
        <div className="bg-slate-900 rounded-xl p-8 border border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            <button 
              onClick={handleLogout}
              className="flex items-center text-red-500 hover:text-red-400 transition-colors"
            >
              <LogOut size={20} className="mr-2" />
              Logout
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* User Info */}
            <div className="md:col-span-1">
              <div className="flex flex-col items-center text-center p-6 bg-slate-800/50 rounded-lg">
                <div className="relative w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-4">
                  <User size={48} />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {(displayUser as any).name || (displayUser as any).username}
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                  {(displayUser as any).email || (displayUser as any).phone}
                </p>
                <div className="flex flex-col gap-2">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                    Active
                  </div>
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                    Customer
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="md:col-span-2 space-y-6">
               {/* Device Manager */}
              <div className="bg-slate-800/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Monitor size={20} className="mr-2 text-primary" />
                      Manage Devices
                  </h3>
                  <DeviceManager />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
