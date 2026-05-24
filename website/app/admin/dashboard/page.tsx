'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Tv, BarChart3, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import adminApi from '@/lib/adminApi';
import TrendingChart from '@/components/admin/TrendingChart';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ channels: 0, customers: 0, activeChannels: 0 });
  const [channels, setChannels] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin'); return; }

    const userStr = localStorage.getItem('auth-storage');
    if (userStr) {
      try {
        const authData = JSON.parse(userStr);
        if (authData?.state?.user?.role === 'reseller') { router.push('/reseller'); return; }
      } catch (e) {}
    }

    const fetchData = async () => {
      try {
        const [channelsRes, customersRes, statsRes] = await Promise.all([
          adminApi.get('/admin/channels?per_page=5'),
          adminApi.get('/admin/customers?per_page=5'),
          adminApi.get('/admin/dashboard/stats'),
        ]);
        setChannels(channelsRes.data.data?.data || []);
        setCustomers(customersRes.data.data?.data || []);
        const s = statsRes.data.data;
        setStats({ channels: s.total_channels, customers: s.total_customers, activeChannels: s.active_channels });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const statCards = [
    {
      label: 'Total Channels',
      value: stats.channels,
      icon: Tv,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      href: '/admin/channels',
    },
    {
      label: 'Total Customers',
      value: stats.customers,
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      href: '/admin/customers',
    },
    {
      label: 'Active Channels',
      value: stats.activeChannels,
      icon: BarChart3,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      href: '/admin/channels',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of your Nellai IPTV platform</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '0.12s' }}>
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">{card.label}</p>
                  <p className="text-3xl font-black text-white">{card.value}</p>
                </div>
                <div className={`w-11 h-11 ${card.bg} border ${card.border} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon size={22} className={card.color} />
                </div>
              </div>
              <div className={`flex items-center gap-1 mt-3 text-xs ${card.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                <TrendingUp size={12} />
                <span>View details</span>
                <ArrowRight size={12} className="ml-auto" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-base font-bold text-white mb-4">Channel View Trends</h2>
        <div className="h-[400px]">
          <TrendingChart />
        </div>
      </div>

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-up" style={{ animationDelay: '0.28s' }}>

        {/* Recent Channels */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h2 className="font-bold text-white">Recent Channels</h2>
            <Link href="/admin/channels" className="text-primary text-xs hover:text-cyan-400 transition-colors flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-800/70">
            {channels.length === 0 ? (
              <p className="px-5 py-6 text-slate-500 text-sm text-center">No channels found</p>
            ) : channels.map((ch) => (
              <div key={ch.uuid} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {ch.thumbnail_url ? (
                    <img src={ch.thumbnail_url} alt={ch.name} className="w-9 h-9 rounded-lg object-cover bg-slate-800 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                      <Tv size={14} className="text-slate-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{ch.name}</p>
                    <p className="text-slate-500 text-xs">{ch.state?.name || 'N/A'} · CH {ch.channel_number || '?'}</p>
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                  ch.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {ch.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Customers */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h2 className="font-bold text-white">Recent Customers</h2>
            <Link href="/admin/customers" className="text-primary text-xs hover:text-cyan-400 transition-colors flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-800/70">
            {customers.length === 0 ? (
              <p className="px-5 py-6 text-slate-500 text-sm text-center">No customers found</p>
            ) : customers.map((cu) => (
              <div key={cu.uuid} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 font-bold text-purple-400 text-sm">
                    {cu.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{cu.name}</p>
                    <p className="text-slate-500 text-xs">{cu.phone}</p>
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                  cu.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {cu.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
