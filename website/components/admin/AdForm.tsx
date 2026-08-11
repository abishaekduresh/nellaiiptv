'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';

interface AdFormProps {
  adUuid: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const TYPES = ['banner', 'inline', 'video'] as const;

export default function AdForm({ adUuid, onSuccess, onCancel }: AdFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'banner' as (typeof TYPES)[number],
    media_url: '',
    redirect_url: '',
    run_time_sec: 10,
    idle_time_sec: 0,
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (adUuid) {
      (async () => {
        try {
          const res = await adminApi.get(`/admin/ads/${adUuid}`);
          const a = res.data.data;
          setFormData({
            title: a.title ?? '',
            type: a.type ?? 'banner',
            media_url: a.media_url ?? '',
            redirect_url: a.redirect_url ?? '',
            run_time_sec: a.run_time_sec ?? 10,
            idle_time_sec: a.idle_time_sec ?? 0,
            status: a.status ?? 'active',
          });
        } catch {
          toast.error('Failed to fetch ad details');
        }
      })();
    }
  }, [adUuid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (adUuid) {
        await adminApi.put(`/admin/ads/${adUuid}`, formData);
        toast.success('Ad updated successfully');
      } else {
        await adminApi.post('/admin/ads', formData);
        toast.success('Ad created successfully');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save ad');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">Title *</label>
        <input
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={inputCls}
          placeholder="Ad title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">Media URL *</label>
        <input
          required
          type="url"
          value={formData.media_url}
          onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
          className={inputCls}
          placeholder="https://…/banner.gif"
        />
        {formData.media_url && (
          <div className="mt-2 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 max-h-40 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={formData.media_url}
              alt="Ad preview"
              className="max-h-40 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">
          Redirect URL <span className="text-xs text-gray-500">(optional)</span>
        </label>
        <input
          type="url"
          value={formData.redirect_url}
          onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
          className={inputCls}
          placeholder="https://…"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as (typeof TYPES)[number] })}
            className={`${inputCls} appearance-none capitalize`}
          >
            {TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Run (sec)</label>
          <input
            type="number"
            min="1"
            max="600"
            value={formData.run_time_sec}
            onChange={(e) => setFormData({ ...formData, run_time_sec: parseInt(e.target.value) || 10 })}
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Idle (sec)</label>
          <input
            type="number"
            min="0"
            max="600"
            value={formData.idle_time_sec}
            onChange={(e) => setFormData({ ...formData, idle_time_sec: parseInt(e.target.value) || 0 })}
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
            className={`${inputCls} appearance-none`}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
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
