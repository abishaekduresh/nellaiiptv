'use client';

import { useEffect, useState } from 'react';
import { X, Eye, Star } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import adminApi from '@/lib/adminApi';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsData {
  channel: {
    name: string;
    logo: string;
    total_views: string;
    raw_views: number;
    avg_rating: number;
  };
  chart_data: { date: string; count: number }[];
}

interface Props {
  uuid: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChannelAnalyticsModal({ uuid, isOpen, onClose }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && uuid) {
      fetchAnalytics();
    } else {
      setData(null);
    }
  }, [isOpen, uuid]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/admin/channels/${uuid}/analytics`);
      setData(res.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
      toast.error('Failed to load analytics');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const chartData = {
    labels: data?.chart_data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Daily Views',
        data: data?.chart_data.map(d => d.count),
        backgroundColor: '#10b981', // Emerald 500
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#334155',
        },
        ticks: {
          color: '#94a3b8',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#94a3b8',
          maxRotation: 45,
          minRotation: 45
        },
      },
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-[#1e293b]/50">
          <div className="flex items-center gap-4">
             {loading ? (
                 <div className="h-12 w-12 bg-gray-800 rounded animate-pulse" />
             ) : (
                data?.channel.logo ? (
                    <img src={data.channel.logo} alt="Logo" className="w-12 h-12 rounded object-cover bg-gray-800" />
                ) : (
                    <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center text-xs">No Img</div>
                )
             )}
             <div>
                <h2 className="text-xl font-bold text-white">
                    {loading ? 'Loading...' : data?.channel.name}
                </h2>
                <p className="text-sm text-slate-400">Channel Analytics</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-primary animate-pulse">Loading Analytics...</div>
                </div>
            ) : data ? (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-[#1e293b] p-4 rounded-xl border border-gray-800">
                            <div className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                                <Eye size={16} /> Total Views
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {data.channel.total_views}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                Raw: {data.channel.raw_views}
                            </div>
                        </div>

                        <div className="bg-[#1e293b] p-4 rounded-xl border border-gray-800">
                             <div className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                                <Star size={16} className="text-yellow-500" /> Avg Rating
                            </div>
                             <div className="text-2xl font-bold text-white">
                                {data.channel.avg_rating} <span className="text-sm text-slate-500 font-normal">/ 5.0</span>
                            </div>
                        </div>

                        <div className="bg-[#1e293b] p-4 rounded-xl border border-gray-800">
                            <div className="text-slate-400 text-sm mb-1">
                                30-Day Trend
                            </div>
                            <div className={`text-xl font-bold ${
                                (data.chart_data[data.chart_data.length-1]?.count || 0) > (data.chart_data[0]?.count || 0) 
                                ? 'text-green-400' : 'text-slate-300'
                            }`}>
                                {data.chart_data.reduce((acc, curr) => acc + curr.count, 0)} <span className="text-sm text-slate-500 font-normal">views this month</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-800 h-[400px]">
                        <h3 className="text-lg font-semibold text-white mb-4">Views Overview (Last 30 Days)</h3>
                        <div className="relative h-full pb-8">
                             <Bar data={chartData} options={chartOptions} />
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center text-slate-500">No data available</div>
            )}
        </div>

      </div>
    </div>
  );
}
