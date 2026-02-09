'use client';

import { useState } from 'react';
import { X, Download, FileSpreadsheet, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';
import { Category, Language, State as GeoState } from '@/types';

interface ExportChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: any;
  categories: Category[];
  languages: Language[];
  states: GeoState[];
}

const AVAILABLE_COLUMNS = [
  { id: 'id', label: 'ID' },
  { id: 'uuid', label: 'UUID' },
  { id: 'name', label: 'Name' },
  { id: 'channel_number', label: 'Channel Number' },
  { id: 'category', label: 'Category' },
  { id: 'language', label: 'Language' },
  { id: 'state', label: 'State' },
  { id: 'district', label: 'District' },
  { id: 'status', label: 'Status' },
  { id: 'views', label: 'Total Views' },
  { id: 'is_premium', label: 'Premium' },
  { id: 'is_featured', label: 'Featured' },
  { id: 'created_at', label: 'Created At' },
  { id: 'hls_url', label: 'Stream URL' },
];

export default function ExportChannelsModal({ 
  isOpen, 
  onClose, 
  currentFilters,
  categories,
  languages,
  states 
}: ExportChannelsModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'name', 'channel_number', 'category', 'language', 'state', 'status', 'views'
  ]);
  const [isExporting, setIsExporting] = useState(false);

  // Filter State (Internal to Modal)
  const [filters, setFilters] = useState({
    search: currentFilters?.search || '',
    category_id: currentFilters?.category_id || '',
    language_id: currentFilters?.language_id || '',
    state_id: currentFilters?.state_id || '',
    status: currentFilters?.status || ''
  });

  if (!isOpen) return null;

  const toggleColumn = (columnId: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleSelectAll = () => {
    if (selectedColumns.length === AVAILABLE_COLUMNS.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(AVAILABLE_COLUMNS.map(col => col.id));
    }
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error('Please select at least one column');
      return;
    }

    setIsExporting(true);
    try {
      // Construct Query Params
      const params = new URLSearchParams();
      
      // Add Filters from Modal State
      if (filters.search) params.append('search', filters.search);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.language_id) params.append('language_id', filters.language_id);
      if (filters.state_id) params.append('state_id', filters.state_id);
      if (filters.status) params.append('status', filters.status);
      
      // Add Columns
      params.append('columns', selectedColumns.join(','));
      
      // Use adminApi to handle Auth and Base URL automatically
      const response = await adminApi.get(`/admin/channels/export?${params.toString()}`, {
          responseType: 'blob'
      });

      // Create Blob from response data
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Extract filename from header if possible, or generate default
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'channels_export.csv';
      if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match && match[1]) fileName = match[1];
      }
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Export completed successfully');
      onClose();

    } catch (error) {
      console.error('Export Error:', error);
      toast.error('Failed to export channels');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-background-card border border-gray-800 rounded-xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
             <div className="bg-green-500/10 p-2 rounded-lg">
                <FileSpreadsheet className="text-green-500" size={24} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-white">Export Channels</h2>
                <p className="text-sm text-text-secondary">Filter data and select columns for CSV export</p>
             </div>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Filters Section */}
            <div className="mb-8">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full"></span>
                    Filter Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by name..." 
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="w-full bg-background border border-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-primary text-sm"
                        />
                    </div>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="bg-background border border-gray-800 text-text-secondary rounded-lg px-3 py-2 focus:outline-none focus:border-primary text-sm"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <select
                        value={filters.category_id}
                        onChange={(e) => setFilters({...filters, category_id: e.target.value})}
                        className="bg-background border border-gray-800 text-text-secondary rounded-lg px-3 py-2 focus:outline-none focus:border-primary text-sm"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    <select
                        value={filters.language_id}
                        onChange={(e) => setFilters({...filters, language_id: e.target.value})}
                        className="bg-background border border-gray-800 text-text-secondary rounded-lg px-3 py-2 focus:outline-none focus:border-primary text-sm"
                    >
                        <option value="">All Languages</option>
                        {languages.map((lang) => (
                            <option key={lang.id} value={lang.id}>{lang.name}</option>
                        ))}
                    </select>

                    <select
                        value={filters.state_id}
                        onChange={(e) => setFilters({...filters, state_id: e.target.value})}
                        className="bg-background border border-gray-800 text-text-secondary rounded-lg px-3 py-2 focus:outline-none focus:border-primary text-sm"
                    >
                        <option value="">All States</option>
                        {states.map((state) => (
                            <option key={state.id} value={state.id}>{state.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Columns Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary rounded-full"></span>
                        Select Columns
                    </h3>
                    <button 
                        onClick={handleSelectAll}
                        className="text-xs text-primary hover:text-primary-dark font-medium"
                    >
                        {selectedColumns.length === AVAILABLE_COLUMNS.length ? 'Deselect All' : 'Select All'}
                    </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_COLUMNS.map((col) => (
                        <label 
                            key={col.id} 
                            className={`
                                flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                ${selectedColumns.includes(col.id) 
                                    ? 'bg-primary/10 border-primary/50' 
                                    : 'bg-background border-gray-800 hover:border-gray-700'}
                            `}
                        >
                            <div className={`
                                w-4 h-4 rounded border flex items-center justify-center
                                ${selectedColumns.includes(col.id)
                                    ? 'bg-primary border-primary'
                                    : 'border-gray-600'}
                            `}>
                                {selectedColumns.includes(col.id) && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <input 
                                type="checkbox" 
                                className="hidden"
                                checked={selectedColumns.includes(col.id)}
                                onChange={() => toggleColumn(col.id)}
                            />
                            <span className={`text-sm ${selectedColumns.includes(col.id) ? 'text-white' : 'text-text-secondary'}`}>
                                {col.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex justify-end gap-3 bg-gray-900/30 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedColumns.length === 0}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-green-900/20 transition-all"
          >
            {isExporting ? (
                <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Exporting...</span>
                </>
            ) : (
                <>
                    <Download size={18} />
                    <span>Download CSV</span>
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
