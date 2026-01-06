'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Tv, BarChart3 } from 'lucide-react';
import adminApi from '@/lib/adminApi';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ channels: 0, customers: 0, activeChannels: 0 });
  const [channels, setChannels] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check token existence simply
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    const fetchData = async () => {
        try {
            const [channelsRes, customersRes, statsRes] = await Promise.all([
                adminApi.get('/admin/channels?per_page=5'),
                adminApi.get('/admin/customers?per_page=5'),
                adminApi.get('/admin/dashboard/stats'),
            ]);

            const channelData = channelsRes.data.data?.data || [];
            const customerData = customersRes.data.data?.data || [];
            const statsData = statsRes.data.data;
            
            setChannels(channelData);
            setCustomers(customerData);
            setStats({
                channels: statsData.total_channels,
                customers: statsData.total_customers,
                activeChannels: statsData.active_channels,
            });
        } catch (error) {
            console.error(error);
            // If 401, interceptor might handle, or we catch here
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [router]);

  const handleDeleteChannel = async (uuid: string) => {
    if (!confirm('Delete this channel?')) return;
    try {
      await adminApi.delete(`/admin/channels/${uuid}`);
      setChannels(channels.filter(c => c.uuid !== uuid));
    } catch (error) {
      alert('Failed to delete channel');
    }
  };

  const handleToggleCustomerStatus = async (uuid: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await adminApi.put(`/admin/customers/${uuid}`, { status: newStatus });
      setCustomers(customers.map(c => c.uuid === uuid ? { ...c, status: newStatus } : c));
    } catch (error) {
      alert('Failed to update customer status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-background-card p-6 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Total Channels</p>
              <p className="text-3xl font-bold text-white">{stats.channels}</p>
            </div>
            <div className="p-3 bg-primary/20 rounded-lg">
                <Tv size={32} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-background-card p-6 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Total Customers</p>
              <p className="text-3xl font-bold text-white">{stats.customers}</p>
            </div>
            <div className="p-3 bg-secondary/20 rounded-lg">
                <Users size={32} className="text-secondary" />
            </div>
          </div>
        </div>

        <div className="bg-background-card p-6 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Active Channels</p>
              <p className="text-3xl font-bold text-white">{stats.activeChannels}</p>
            </div>
             <div className="p-3 bg-green-500/20 rounded-lg">
                <BarChart3 size={32} className="text-green-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-background-card p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Recent Channels</h2>
          <div className="space-y-3">
            {channels.map((channel) => (
              <div key={channel.uuid} className="flex items-center justify-between border-b border-gray-800 pb-3 last:border-0">
                <div>
                  <p className="text-white font-semibold">{channel.name}</p>
                  <p className="text-sm text-text-secondary">
                    {channel.state?.name || 'N/A'} • {channel.channel_number || '?'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${channel.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {channel.status}
                    </span>
                </div>
              </div>
            ))}
            {channels.length === 0 && <p className="text-text-secondary text-sm">No channels found</p>}
          </div>
        </div>

        <div className="bg-background-card p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Recent Customers</h2>
          <div className="space-y-3">
            {customers.map((customer) => (
              <div key={customer.uuid} className="flex items-center justify-between border-b border-gray-800 pb-3 last:border-0">
                <div>
                  <p className="text-white font-semibold">{customer.name}</p>
                  <p className="text-sm text-text-secondary">{customer.phone}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded ${customer.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {customer.status}
                </span>
              </div>
            ))}
             {customers.length === 0 && <p className="text-text-secondary text-sm">No customers found</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
