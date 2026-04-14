'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, DollarSign, TrendingUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import WalletCard from '@/components/reseller/WalletCard';
import WalletHistory from '@/components/reseller/WalletHistory';

interface DashboardStats {
  totalCustomers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  recentCustomers: any[];
  walletBalance: number;
}

export default function ResellerDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    recentCustomers: [],
    walletBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshHistory, setRefreshHistory] = useState(0);

  useEffect(() => {
    // Check if user is reseller
    if (user?.role !== 'reseller') {
      router.push('/');
      return;
    }

    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch consolidated stats
      const statsRes = await api.get('/reseller/dashboard/stats');
      const data = statsRes.data.data;
      
      setStats((prev) => ({
        ...prev,
        totalCustomers: data.total_customers,
        activeSubscriptions: data.active_subscriptions,
        walletBalance: data.wallet_balance,
        recentCustomers: data.recent_customers,
        // Keep totalRevenue as 0 or calc if needed later
      }));

    } catch (error: any) {
      console.error('Failed to fetch dashboard data', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Reseller Dashboard</h1>
        <p className="text-text-secondary">Welcome back, {(user as any)?.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Customers */}
        <div className="bg-background-card rounded-lg border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Users className="text-blue-400" size={24} />
            </div>
          </div>
          <h3 className="text-text-secondary text-sm mb-1">Total Customers</h3>
          <p className="text-3xl font-bold text-white">{stats.totalCustomers}</p>
        </div>

        {/* Wallet Card */}
        <div className="h-full">
            <WalletCard 
                balance={stats.walletBalance} 
                onFundsAdded={() => {
                    fetchDashboardData(); // Refresh all data
                    setRefreshHistory(prev => prev + 1); // Trigger history refresh
                }} 
            />
        </div>

        {/* Device Limit */}
        <div className="bg-background-card rounded-lg border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Clock className="text-purple-400" size={24} />
            </div>
          </div>
          <h3 className="text-text-secondary text-sm mb-1">Your Device Limit</h3>
          <p className="text-3xl font-bold text-white">1</p>
          <p className="text-xs text-text-secondary mt-1">Reseller Account</p>
        </div>
      </div>

      {/* Wallet History */}
      <div className="mb-8">
        <WalletHistory refreshTrigger={refreshHistory} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Manage Customers */}
        <button
          onClick={() => router.push('/reseller/customers')}
          className="bg-primary hover:bg-primary/90 text-white p-6 rounded-lg transition-colors text-left"
        >
          <Users size={32} className="mb-3" />
          <h3 className="text-xl font-semibold mb-2">Manage Customers</h3>
          <p className="text-sm opacity-90">Search, create, and assign plans to your customers</p>
        </button>

        {/* View Profile */}
        <button
          onClick={() => router.push('/profile')}
          className="bg-background-card hover:bg-gray-800 border border-gray-800 text-white p-6 rounded-lg transition-colors text-left"
        >
          <DollarSign size={32} className="mb-3" />
          <h3 className="text-xl font-semibold mb-2">My Profile</h3>
          <p className="text-sm text-text-secondary">View and update your reseller account details</p>
        </button>
      </div>

      {/* Recent Customers */}
      {stats.recentCustomers.length > 0 && (
        <div className="bg-background-card rounded-lg border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Recent Customers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-800/50 text-text-secondary text-sm uppercase">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats.recentCustomers.map((customer: any) => (
                  <tr key={customer.uuid} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{customer.name}</div>
                      {customer.email && (
                        <div className="text-xs text-text-secondary">{customer.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{customer.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        customer.plan
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {customer.plan?.name || 'No Plan'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        customer.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-800 text-center">
            <button
              onClick={() => router.push('/reseller/customers')}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All Customers →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
