'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';
import Modal from '@/components/ui/Modal';
import ScrollingAdForm from '@/components/admin/ScrollingAdForm';

export interface ScrollingAd {
  uuid: string;
  text_content: string;
  repeat_count: number;
  scroll_speed: number;
  status: 'active' | 'inactive';
  created_at?: string;
}

export default function ScrollingAdsPage() {
  const [ads, setAds] = useState<ScrollingAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<string | null>(null);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/scrolling-ads');
      setAds(res.data.data);
    } catch {
      toast.error('Failed to load scrolling ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  const handleDelete = async (uuid: string) => {
    if (!confirm('Delete this ad?')) return;
    try {
      await adminApi.delete(`/admin/scrolling-ads/${uuid}`);
      toast.success('Ad deleted');
      fetchAds();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Scrolling Ads</h1>
          <p className="text-slate-400 text-sm mt-1">Manage ticker-style announcement banners</p>
        </div>
        <button
          onClick={() => { setSelectedAd(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
        >
          <Plus size={16} /> Add Ad
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 animate-fade-up">
          <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : ads.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-slate-500 animate-fade-up">
          <Megaphone size={32} className="opacity-30" />
          <p className="text-sm">No scrolling ads found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '0.12s' }}>
          {ads.map(ad => (
            <div key={ad.uuid} className="group bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 relative transition-all duration-300 hover:-translate-y-0.5">
              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setSelectedAd(ad.uuid); setIsModalOpen(true); }}
                  className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                  <Edit size={14} />
                </button>
                <button onClick={() => handleDelete(ad.uuid)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Ticker preview */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center shrink-0">
                  <Megaphone size={14} className="text-primary" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ad.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-slate-500/15 text-slate-400'}`}>
                  {ad.status}
                </span>
              </div>

              <p className="text-white text-sm font-medium line-clamp-3 mb-4 pr-14">{ad.text_content}</p>

              <div className="space-y-1.5 text-xs text-slate-400 pt-3 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Repeat</span>
                  <span className="text-white font-medium">{ad.repeat_count}×</span>
                </div>
                {ad.created_at && (
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span className="text-white">{new Date(ad.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedAd ? 'Edit Scrolling Ad' : 'Create Scrolling Ad'}>
        <ScrollingAdForm adUuid={selectedAd} onSuccess={() => { setIsModalOpen(false); fetchAds(); }} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
