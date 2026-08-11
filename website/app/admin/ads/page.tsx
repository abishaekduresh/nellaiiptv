'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ImageIcon, Eye, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';
import Modal from '@/components/ui/Modal';
import AdForm from '@/components/admin/AdForm';

interface Ad {
  uuid: string;
  title: string;
  type: 'banner' | 'inline' | 'video';
  media_url: string;
  redirect_url?: string | null;
  run_time_sec: number;
  idle_time_sec: number;
  impressions: number;
  status: 'active' | 'inactive';
  created_at?: string;
}

const typeStyle: Record<string, string> = {
  banner: 'bg-blue-500/15 text-blue-400',
  inline: 'bg-purple-500/15 text-purple-400',
  video: 'bg-pink-500/15 text-pink-400',
};

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<string | null>(null);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/ads');
      const data = res.data?.data;
      setAds(Array.isArray(data) ? data : []);
    } catch {
      setAds([]);
      toast.error('Failed to load ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  const handleDelete = async (uuid: string) => {
    if (!confirm('Delete this ad?')) return;
    try {
      await adminApi.delete(`/admin/ads/${uuid}`);
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
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Banner Ads</h1>
          <p className="text-slate-400 text-sm mt-1">Manage banner / inline / video promo ads</p>
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
          <ImageIcon size={32} className="opacity-30" />
          <p className="text-sm">No ads found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '0.12s' }}>
          {ads.map(ad => (
            <div key={ad.uuid} className="group bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden relative transition-all duration-300 hover:-translate-y-0.5">
              {/* Media preview */}
              <div className="relative h-36 bg-slate-950 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ad.media_url}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${typeStyle[ad.type] ?? 'bg-slate-500/15 text-slate-400'}`}>{ad.type}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ad.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-slate-500/15 text-slate-400'}`}>{ad.status}</span>
                </div>
                {/* Actions */}
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setSelectedAd(ad.uuid); setIsModalOpen(true); }}
                    className="p-1.5 rounded-lg bg-blue-500/20 backdrop-blur text-blue-300 hover:bg-blue-500/30 transition-colors">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(ad.uuid)}
                    className="p-1.5 rounded-lg bg-red-500/20 backdrop-blur text-red-300 hover:bg-red-500/30 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <p className="text-white text-sm font-semibold truncate mb-2">{ad.title}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Eye size={12} /> {Number(ad.impressions ?? 0).toLocaleString()}</span>
                  <span>{ad.run_time_sec}s run · {ad.idle_time_sec}s idle</span>
                </div>
                {ad.redirect_url && (
                  <a href={ad.redirect_url} target="_blank" rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-cyan-400 truncate">
                    <ExternalLink size={11} className="shrink-0" /> <span className="truncate">{ad.redirect_url}</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedAd ? 'Edit Ad' : 'Create Ad'}>
        <AdForm adUuid={selectedAd} onSuccess={() => { setIsModalOpen(false); fetchAds(); }} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
