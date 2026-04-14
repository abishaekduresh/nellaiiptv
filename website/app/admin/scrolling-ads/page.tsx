'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
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
    } catch (error) {
      console.error('Failed to fetch ads', error);
      toast.error('Failed to load scrolling ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleCreate = () => {
    setSelectedAd(null);
    setIsModalOpen(true);
  };

  const handleEdit = (uuid: string) => {
    setSelectedAd(uuid);
    setIsModalOpen(true);
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    try {
      await adminApi.delete(`/admin/scrolling-ads/${uuid}`);
      toast.success('Ad deleted successfully');
      fetchAds();
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete ad');
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchAds();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Scrolling Ads</h1>
        <button
          onClick={handleCreate}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Ad
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="text-text-secondary">Loading...</div>
        ) : ads.length === 0 ? (
          <div className="text-text-secondary">No scrolling ads found. Create one!</div>
        ) : (
          ads.map((ad) => (
            <div key={ad.uuid} className="bg-background-card border border-gray-800 rounded-lg p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                     <button
                        onClick={() => handleEdit(ad.uuid)}
                        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 p-2 rounded transition-colors"
                        title="Edit"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(ad.uuid)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

              <div className="mb-4 text-left pr-16">
                <p className="text-lg font-medium text-white line-clamp-3">{ad.text_content}</p>
              </div>
              
              <div className="space-y-2 text-sm text-text-secondary mb-4 border-t border-gray-800 pt-4">
                  <div className="flex justify-between">
                      <span>Repeat Count</span>
                      <span className="text-white">{ad.repeat_count}x</span>
                  </div>
                  <div className="flex justify-between">
                      <span>Status</span>
                      <span className={ad.status === 'active' ? 'text-green-400 capitalize' : 'text-gray-400 capitalize'}>{ad.status}</span>
                  </div>
                  <div className="flex justify-between">
                      <span>Created</span>
                      <span className="text-white">{new Date(ad.created_at || '').toLocaleDateString()}</span>
                  </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedAd ? 'Edit Scrolling Ad' : 'Create Scrolling Ad'}
      >
        <ScrollingAdForm
          adUuid={selectedAd}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
