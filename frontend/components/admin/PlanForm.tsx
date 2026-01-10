'use client';

import { useState, useEffect } from 'react';
import adminApi from '@/lib/adminApi';
import toast from 'react-hot-toast';
import { SubscriptionPlan } from '@/types';

interface PlanFormProps {
  planUuid: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const PLATFORMS = ['web', 'android', 'ios', 'tv'];

export default function PlanForm({ planUuid, onSuccess, onCancel }: PlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '30',
    device_limit: '1',
    description: '',
    status: 'active',
    platform_access: [] as string[]
  });

  useEffect(() => {
    if (planUuid) {
      fetchPlan();
    }
  }, [planUuid]);

  const fetchPlan = async () => {
    try {
      const res = await adminApi.get(`/admin/plans/${planUuid}`);
      const plan = res.data.data;
      setFormData({
        name: plan.name,
        price: plan.price.toString(),
        duration: plan.duration.toString(),
        device_limit: plan.device_limit.toString(),
        description: plan.description || '',
        status: plan.status,
        platform_access: plan.platform_access || []
      });
    } catch (error) {
      toast.error('Failed to fetch plan details');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => {
        const current = prev.platform_access;
        if (current.includes(platform)) {
            return { ...prev, platform_access: current.filter(p => p !== platform) };
        } else {
            return { ...prev, platform_access: [...current, platform] };
        }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        device_limit: parseInt(formData.device_limit)
      };

      if (planUuid) {
        await adminApi.put(`/admin/plans/${planUuid}`, payload);
        toast.success('Plan updated successfully');
      } else {
        await adminApi.post('/admin/plans', payload);
        toast.success('Plan created successfully');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Plan Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full bg-background border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-primary"
          placeholder="e.g. Premium Monthly"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Price</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              step="0.01"
              className="w-full bg-background border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-primary"
              placeholder="e.g. 9.99"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Duration (days)</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
              className="w-full bg-background border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-primary"
              placeholder="e.g. 30"
            />
          </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Device Limit</label>
        <input
          type="number"
          name="device_limit"
          value={formData.device_limit}
          onChange={handleChange}
          required
          min="1"
          className="w-full bg-background border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Platform Access</label>
        <div className="flex flex-wrap gap-3">
            {PLATFORMS.map(platform => (
                <button
                    key={platform}
                    type="button"
                    onClick={() => handlePlatformToggle(platform)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                        formData.platform_access.includes(platform)
                            ? 'bg-primary text-white'
                            : 'bg-gray-800 text-text-secondary hover:bg-gray-700'
                    }`}
                >
                    {platform.toUpperCase()}
                </button>
            ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full bg-background border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-primary"
          placeholder="Plan features description..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full bg-background border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-primary"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-text-secondary hover:text-white transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : (planUuid ? 'Update Plan' : 'Create Plan')}
        </button>
      </div>
    </form>
  );
}
