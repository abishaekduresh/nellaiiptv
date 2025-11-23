'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Users, Tv, BarChart3, Settings } from 'lucide-react';

const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api',
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ channels: 0, customers: 0, activeChannels: 0 });
  const [channels, setChannels] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    Promise.all([
      adminApi.get('/admin/channels?per_page=10'),
      adminApi.get('/admin/customers?per_page=10'),
    ]).then(([channelsRes, customersRes]) => {
      const channelData = channelsRes.data.data?.data || [];
      const customerData = customersRes.data.data?.data || [];
      
      setChannels(channelData);
      setCustomers(customerData);
      setStats({
        channels: channelsRes.data.data?.total || channelData.length,
        customers: customersRes.data.data?.total || customerData.length,
        activeChannels: channelData.filter((c: any) => c.status === 'active').length,
      });
      setLoading(false);
    }).catch(() => {
      router.push('/admin');
    });
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-background-card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Total Channels</p>
              <p className="text-3xl font-bold text-white">{stats.channels}</p>
            </div>
            <Tv size={40} className="text-primary" />
          </div>
        </div>

        <div className="bg-background-card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Total Customers</p>
              <p className="text-3xl font-bold text-white">{stats.customers}</p>
            </div>
            <Users size={40} className="text-secondary" />
          </div>
        </div>

        <div className="bg-background-card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary mb-1">Active Channels</p>
              <p className="text-3xl font-bold text-white">{stats.activeChannels}</p>
            </div>
            <BarChart3 size={40} className="text-green-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-background-card p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Recent Channels</h2>
          <div className="space-y-3">
            {channels.map((channel) => (
              <div key={channel.uuid} className="flex items-center justify-between border-b border-gray-700 pb-3">
                <div>
                  <p className="text-white font-semibold">{channel.name}</p>
                  <p className="text-sm text-text-secondary">
                    {channel.state?.name} • {channel.viewers_count} viewers
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteChannel(channel.uuid)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-background-card p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Recent Customers</h2>
          <div className="space-y-3">
            {customers.map((customer) => (
              <div key={customer.uuid} className="flex items-center justify-between border-b border-gray-700 pb-3">
                <div>
                  <p className="text-white font-semibold">{customer.name}</p>
                  <p className="text-sm text-text-secondary">{customer.phone}</p>
                </div>
                <button
                  onClick={() => handleToggleCustomerStatus(customer.uuid, customer.status)}
                  className={`text-sm px-3 py-1 rounded ${
                    customer.status === 'active'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {customer.status}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
