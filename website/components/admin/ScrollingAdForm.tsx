'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface ScrollingAdFormProps {
  adUuid: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ScrollingAdForm({ adUuid, onSuccess, onCancel }: ScrollingAdFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    text_content: '',
    repeat_count: 3,
    scroll_speed: 50,
    status: 'active',
  });

  useEffect(() => {
    if (adUuid) {
      fetchAd();
    }
  }, [adUuid]);

  const fetchAd = async () => {
    try {
      const res = await adminApi.get(`/admin/scrolling-ads/${adUuid}`);
      setFormData(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch ad details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (adUuid) {
        await adminApi.put(`/admin/scrolling-ads/${adUuid}`, formData);
        toast.success('Ad updated successfully');
      } else {
        await adminApi.post('/admin/scrolling-ads', formData);
        toast.success('Ad created successfully');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save ad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Ad Text Content *
        </label>
        <textarea
          required
          value={formData.text_content}
          onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
          className="w-full bg-background border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors h-24 resize-none"
          placeholder="Enter scrolling text..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Repeat Count *
          </label>
          <input
            type="number"
            required
            min="1"
            max="20"
            value={formData.repeat_count}
            onChange={(e) => setFormData({ ...formData, repeat_count: parseInt(e.target.value) || 3 })}
            className="w-full bg-background border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">Times to scroll before next ad</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Scroll Speed (px/sec) *
          </label>
          <input
            type="number"
            required
            min="10"
            max="500"
            value={(formData as any).scroll_speed ?? 50}
            onChange={(e) => setFormData({ ...formData, scroll_speed: parseInt(e.target.value) || 50 } as any)}
            className="w-full bg-background border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">Lower = slower, Higher = faster</p>
        </div>

        <div>
           <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
           <select
             value={formData.status}
             onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
             className="w-full bg-background border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
           >
             <option value="active">Active</option>
             <option value="inactive">Inactive</option>
           </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-text-secondary hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Ad'}
        </button>
      </div>
    </form>
  );
}
