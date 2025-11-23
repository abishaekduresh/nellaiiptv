'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { User, LogOut, CreditCard, Clock } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, token } = useAuthStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  if (!mounted || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 md:px-8">
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
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-4">
                  <User size={48} />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {(user as any).name || (user as any).username}
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                  {(user as any).email || (user as any).phone}
                </p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                  Active
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Subscription */}
              <div className="bg-slate-800/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <CreditCard size={20} className="mr-2 text-primary" />
                  Subscription Details
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                    <span className="text-slate-400">Plan</span>
                    <span className="text-white font-medium">Free Monthly</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                    <span className="text-slate-400">Status</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Expires On</span>
                    <span className="text-white">Jan 01, 2027</span>
                  </div>
                </div>
              </div>

              {/* Watch History (Placeholder) */}
              {/* <div className="bg-slate-800/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Clock size={20} className="mr-2 text-primary" />
                  Recent Activity
                </h3>
                <p className="text-slate-500 text-sm">
                  No recent watch history available.
                </p>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
