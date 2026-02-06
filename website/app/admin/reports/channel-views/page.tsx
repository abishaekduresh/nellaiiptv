'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Calendar, ArrowLeft, ChevronDown, Image } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import Link from 'next/link';
import html2canvas from 'html2canvas';

// Chart.js registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChannelViewStat {
    channel_name: string;
    channel_number: number;
    total_views: number;
}

interface SummaryStats {
    total_views: number;
    top_channel: string;
    start_date: string;
    end_date: string;
}

export default function ChannelViewsReportPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<any>(null);
    const [tableData, setTableData] = useState<ChannelViewStat[]>([]);
    const [summary, setSummary] = useState<SummaryStats | null>(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    const [channels, setChannels] = useState<any[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchedQueries, setSearchedQueries] = useState<Set<string>>(new Set());
    const [status, setStatus] = useState<string>('active');

    useEffect(() => {
        fetchChannels();
    }, []);

    useEffect(() => {
        fetchReport();
    }, [dateRange, selectedChannel, status]);

    // Debounced API search
    useEffect(() => {
        if (!searchTerm || searchTerm.length < 2) return;

        const timer = setTimeout(() => {
            // Check if we have local matches first
            const localMatches = channels.filter(channel => 
                channel.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                channel.channel_number.toString().includes(searchTerm)
            );

            // If no local matches and we haven't searched this query before, search via API
            const normalizedQuery = searchTerm.toLowerCase().trim();
            if (localMatches.length === 0 && !searchedQueries.has(normalizedQuery)) {
                searchChannelsAPI(searchTerm);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchTerm, channels, searchedQueries]);

    const fetchChannels = async () => {
        try {
            const res = await adminApi.get('/admin/channels'); // Fetch all for dropdown
            if (res.data?.data?.data) {
                setChannels(res.data.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch channels');
        }
    };

    const searchChannelsAPI = async (query: string) => {
        const normalizedQuery = query.toLowerCase().trim();
        
        // Mark this query as searched
        setSearchedQueries(prev => new Set(prev).add(normalizedQuery));
        
        setIsSearching(true);
        try {
            const res = await adminApi.get('/admin/channels', {
                params: { search: query }
            });
            if (res.data?.data?.data) {
                // Merge with existing channels, avoiding duplicates
                const newChannels = res.data.data.data;
                const existingIds = new Set(channels.map(c => c.id));
                const uniqueNew = newChannels.filter((c: any) => !existingIds.has(c.id));
                if (uniqueNew.length > 0) {
                    setChannels([...channels, ...uniqueNew]);
                }
            }
        } catch (error) {
            console.error('Failed to search channels');
        } finally {
            setIsSearching(false);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params: any = {
                start_date: dateRange.startDate,
                end_date: dateRange.endDate,
                status: status
            };
            if (selectedChannel) {
                params.channel_id = selectedChannel;
            }

            const res = await adminApi.get('/admin/reports/channel-views', { params });
            
            const { chart_data, table_data, summary } = res.data.data;
            
            setChartData({
                labels: chart_data.labels,
                datasets: chart_data.datasets.map((ds: any) => ({
                    ...ds,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }))
            });
            setTableData(table_data);
            setSummary(summary);
        } catch (error) {
            console.error('Failed to fetch report:', error);
            // Handle error (toast or alert)
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        if (!tableData.length) return;

        const headers = ['Channel Number', 'Channel Name', 'Total Views'];
        const csvContent = [
            headers.join(','),
            ...tableData.map(row => `${row.channel_number},"${row.channel_name}",${row.total_views}`)
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `channel_views_report_${dateRange.startDate}_${dateRange.endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadJPEG = async () => {
        const reportElement = document.getElementById('report-content');
        if (!reportElement) return;

        try {
            const canvas = await html2canvas(reportElement, {
                backgroundColor: '#0a0a0a',
                scale: 2, // Higher quality
                logging: false,
                useCORS: true
            });

            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `channel_views_report_${dateRange.startDate}_${dateRange.endDate}.jpeg`;
                    link.click();
                    URL.revokeObjectURL(url);
                }
            }, 'image/jpeg', 0.95);
        } catch (error) {
            console.error('Failed to generate JPEG:', error);
        }
    };

    const handleDateChange = (type: 'start' | 'end', value: string) => {
        setDateRange(prev => ({
            ...prev,
            [type === 'start' ? 'startDate' : 'endDate']: value
        }));
    };

    if (loading && !chartData) {
        return (
            <div className="flex items-center justify-center h-full min-h-[500px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }


    
    // ... (keep existing channels and other state)

    const filteredChannels = channels.filter(channel => 
        channel.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        channel.channel_number.toString().includes(searchTerm)
    );

    const handleSelectChannel = (channelId: string) => {
        setSelectedChannel(channelId);
        setIsDropdownOpen(false);
        setSearchTerm('');
    };

    const getSelectedChannelLabel = () => {
        if (!selectedChannel) return "All Channels";
        const channel = channels.find(c => c.id === Number(selectedChannel)); // Assuming ID is number from API but string in select
        // Check both types just in case
        const ch = channels.find(c => c.id == selectedChannel);
        return ch ? `${ch.channel_number} - ${ch.name}` : "All Channels";
    };

    return (
        <div className="container mx-auto pb-10 px-4 md:px-0" onClick={() => isDropdownOpen && setIsDropdownOpen(false)}>
            <div id="report-content">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                     <Link href="/admin/dashboard" className="inline-flex items-center text-sm text-text-secondary hover:text-white mb-2">
                        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Channel Views Report</h1>
                    <p className="text-text-secondary">Analytics and performance detailed report</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 relative">
                    {/* Searchable Dropdown */}
                    <div className="relative min-w-[250px]" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between bg-background-card border border-gray-800 text-white text-sm rounded-lg p-2.5 focus:outline-none focus:border-primary"
                        >
                            <span className="truncate">{getSelectedChannelLabel()}</span>
                            <ChevronDown size={16} className="text-text-secondary ml-2" />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-background-card border border-gray-800 rounded-lg shadow-xl z-50 max-h-60 flex flex-col">
                                <div className="p-2 border-b border-gray-800 sticky top-0 bg-background-card z-10">
                                    <input 
                                        type="text" 
                                        placeholder="Search channels..." 
                                        className="w-full bg-black/20 text-white text-sm p-2 rounded border border-gray-700 focus:outline-none focus:border-primary"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="overflow-y-auto flex-1">
                                    <button 
                                        onClick={() => handleSelectChannel('')}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors ${selectedChannel === '' ? 'text-primary bg-primary/10' : 'text-text-secondary'}`}
                                    >
                                        All Channels
                                    </button>
                                    {filteredChannels.length > 0 ? (
                                        filteredChannels.map((channel) => (
                                            <button 
                                                key={channel.id} 
                                                onClick={() => handleSelectChannel(channel.id)}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors ${selectedChannel == channel.id ? 'text-primary bg-primary/10' : 'text-text-secondary'}`}
                                            >
                                                <span className="font-mono opacity-70 mr-2">#{channel.channel_number}</span>
                                                {channel.name}
                                            </button>
                                        ))
                                    ) : isSearching ? (
                                        <div className="px-4 py-2 text-sm text-text-secondary italic flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                                            Searching...
                                        </div>
                                    ) : (
                                        <div className="px-4 py-2 text-sm text-text-secondary italic">No channels found</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="bg-background-card border border-gray-800 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="deleted">Deleted</option>
                    </select>

                    <div className="flex items-center gap-2 bg-background-card p-2 rounded-lg border border-gray-800">
                        <Calendar size={16} className="text-text-secondary" />
                        <input 
                            type="date" 
                            value={dateRange.startDate}
                            onChange={(e) => handleDateChange('start', e.target.value)}
                            className="bg-transparent text-white text-sm focus:outline-none"
                        />
                        <span className="text-text-secondary">-</span>
                        <input 
                            type="date" 
                            value={dateRange.endDate}
                            onChange={(e) => handleDateChange('end', e.target.value)}
                            className="bg-transparent text-white text-sm focus:outline-none"
                        />
                    </div>
                    
                    <button 
                        onClick={downloadJPEG}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                        <Image size={18} />
                        <span>Export JPEG</span>
                    </button>

                    <button 
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                    >
                        <Download size={18} />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 <div className="bg-background-card p-6 rounded-lg border border-gray-800">
                    <p className="text-text-secondary mb-1">Total Views</p>
                    <p className="text-3xl font-bold text-white">{summary?.total_views?.toLocaleString() || 0}</p>
                 </div>
                 <div className="bg-background-card p-6 rounded-lg border border-gray-800">
                    <p className="text-text-secondary mb-1">Top Performing Channel</p>
                    <p className="text-xl font-bold text-white truncate">{summary?.top_channel || 'N/A'}</p>
                 </div>
                 <div className="bg-background-card p-6 rounded-lg border border-gray-800">
                    <p className="text-text-secondary mb-1">Date Range</p>
                    <p className="text-lg font-bold text-white">{dateRange.startDate} to {dateRange.endDate}</p>
                 </div>
            </div>

            {/* Chart Section */}
            <div className="bg-background-card p-6 rounded-lg border border-gray-800 mb-8">
                <h2 className="text-xl font-bold text-white mb-6">Views Over Time</h2>
                <div className="h-[400px] w-full">
                    {chartData && (
                        <Line 
                            data={chartData} 
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false,
                                    },
                                    tooltip: {
                                        mode: 'index',
                                        intersect: false,
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: {
                                            color: 'rgba(255, 255, 255, 0.1)'
                                        },
                                        ticks: {
                                            color: '#9ca3af'
                                        }
                                    },
                                    x: {
                                        grid: {
                                            display: false
                                        },
                                        ticks: {
                                            color: '#9ca3af'
                                        }
                                    }
                                }
                            }} 
                        />
                    )}
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-background-card rounded-lg border border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Channel Performance Details</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-black/20">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Channel Name</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Channel Number</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Total Views</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {tableData.length > 0 ? (
                                tableData.map((channel, index) => (
                                    <tr key={index} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                            #{index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                            {channel.channel_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                            {channel.channel_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-right font-bold">
                                            {Number(channel.total_views).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">
                                        No data found for the selected period
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>
        </div>
    );
}
