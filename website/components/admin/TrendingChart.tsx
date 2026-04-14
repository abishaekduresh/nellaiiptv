'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import adminApi from '@/lib/adminApi';
import { Filter, Loader2 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TrendingChart() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  
  // Filters
  const [categories, setCategories] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  useEffect(() => {
     fetchMetadata();
  }, []);

  useEffect(() => {
    fetchData();
  }, [limit, selectedCategory, selectedLanguage]);

  const fetchMetadata = async () => {
      try {
          const [catRes, langRes] = await Promise.all([
              adminApi.get('/categories'), // Uses /api via proxy/rewrite? Wait adminApi base is public/api?
              // adminApi defined in lib/adminApi.ts uses process.env.NEXT_PUBLIC_API_URL || 'http://localhost/public/api'
              // My routes defined in api.php (Geo) are public (under /api)
              // So adminApi.get('/categories') should work if base is /api.
              adminApi.get('/languages')
          ]);
          if (catRes.data.status) setCategories(catRes.data.data);
          if (langRes.data.status) setLanguages(langRes.data.data);
      } catch (e) {
          console.error("Failed to fetch metadata", e);
      }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = `/admin/dashboard/trending?limit=${limit}`;
      if (selectedCategory !== 'all') query += `&category_uuid=${selectedCategory}`;
      if (selectedLanguage !== 'all') query += `&language_uuid=${selectedLanguage}`;

      const res = await adminApi.get(query);
      if (res.data.status) {
         setData(res.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Viewers Count',
        data: data?.data || [],
        backgroundColor: 'rgba(56, 189, 248, 0.5)', // Primary color (sky-400)
        borderColor: 'rgba(56, 189, 248, 1)',
        borderWidth: 1,
        fill: chartType === 'line', // Fill area for line chart
        tension: 0.4, // Smooth curve
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Important for fitting container
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#94a3b8' } // slate-400
      },
      title: {
        display: false,
      },
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: { color: '#334155' }, // slate-700
            ticks: { color: '#94a3b8' }
        },
        x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
        }
    }
  };

  return (
    <div className="bg-background-card p-6 rounded-lg border border-gray-800 flex flex-col h-full min-h-[400px]">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-6 gap-4">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Filter className="text-primary" size={20} />
                    Trending Channels
                </h2>
                <p className="text-sm text-text-secondary">Most viewed channels analytics</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {/* Category Filter */}
                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-sm text-white px-2 py-1.5 rounded focus:outline-none focus:bg-white/5 border-r border-slate-700/50"
                    style={{ maxWidth: '120px' }}
                >
                    <option value="all" className="bg-slate-800 text-white">All Categories</option>
                    {categories.map((cat: any) => (
                        <option key={cat.uuid} value={cat.uuid} className="bg-slate-800 text-white">{cat.name}</option>
                    ))}
                </select>

                {/* Language Filter */}
                <select 
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="bg-transparent text-sm text-white px-2 py-1.5 rounded focus:outline-none focus:bg-white/5 border-r border-slate-700/50"
                    style={{ maxWidth: '120px' }}
                >
                    <option value="all" className="bg-slate-800 text-white">All Languages</option>
                    {languages.map((lang: any) => (
                        <option key={lang.uuid} value={lang.uuid} className="bg-slate-800 text-white">{lang.name}</option>
                    ))}
                </select>

                <select 
                    value={limit} 
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="bg-transparent text-sm text-white px-3 py-1.5 rounded focus:outline-none focus:bg-white/5"
                >
                    <option value={5} className="bg-slate-800 text-white">Top 5</option>
                    <option value={10} className="bg-slate-800 text-white">Top 10</option>
                    <option value={20} className="bg-slate-800 text-white">Top 20</option>
                </select>
                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                <button 
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${chartType === 'bar' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    BAR
                </button>
                <button 
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${chartType === 'line' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    LINE
                </button>
            </div>
        </div>

        <div className="flex-1 relative w-full h-full min-h-[300px]">
            {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10 rounded-lg">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : null}
            
            {data && data.labels.length > 0 ? (
                chartType === 'bar' 
                    ? <Bar options={options} data={chartData} /> 
                    : <Line options={options} data={chartData} />
            ) : (
                !loading && (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        No trending data available
                    </div>
                )
            )}
        </div>
    </div>
  );
}
