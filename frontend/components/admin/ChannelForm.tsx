'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import adminApi from '@/lib/adminApi';
import toast from 'react-hot-toast';

interface ChannelFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export default function ChannelForm({ initialData, isEditing = false }: ChannelFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    channel_number: '',
    hls_url: '',
    thumbnail_url: '',
    state_id: '',
    district_id: '',
    language_id: '',
    category_id: '',
    is_featured: false,
    is_premium: false,
    status: 'active',
    user_agent: '',
    referer: '',
    ...initialData,
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [statesRes, languagesRes, categoriesRes, districtsRes] = await Promise.all([
          adminApi.get('/states'),
          adminApi.get('/languages'),
          adminApi.get('/categories'),
          initialData?.state_id ? adminApi.get(`/districts?state_id=${initialData.state_id}`) : Promise.resolve({ data: { data: [] } })
        ]);

        setStates(statesRes.data.data);
        setLanguages(languagesRes.data.data);
        setCategories(categoriesRes.data.data);
        if (initialData?.state_id) {
             setDistricts(districtsRes.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch metadata', error);
        toast.error('Failed to load form data');
      }
    };
    fetchMetadata();
  }, [initialData]);

  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateId = e.target.value;
    setFormData({ ...formData, state_id: stateId, district_id: '' });
    
    if (stateId) {
      try {
        const res = await adminApi.get(`/districts?state_id=${stateId}`);
        setDistricts(res.data.data);
      } catch (error) {
        console.error('Failed to fetch districts', error);
        toast.error('Failed to load districts');
      }
    } else {
      setDistricts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await adminApi.put(`/admin/channels/${initialData.uuid}`, formData);
        toast.success('Channel updated successfully');
      } else {
        await adminApi.post('/admin/channels', formData);
        toast.success('Channel created successfully');
        router.push('/admin/channels');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to save channel';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-text-secondary mb-2">Channel Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-background border border-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
            placeholder="e.g. Sun TV"
          />
        </div>

        <div>
          <label className="block text-text-secondary mb-2">Channel Number</label>
          <input
            type="text"
            value={formData.channel_number}
            onChange={(e) => setFormData({ ...formData, channel_number: e.target.value })}
            className="w-full bg-background border border-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
            placeholder="e.g. 101"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-text-secondary mb-2">Stream URL (HLS)</label>
          <input
            type="url"
            required
            value={formData.hls_url}
            onChange={(e) => setFormData({ ...formData, hls_url: e.target.value })}
            className="w-full bg-background border border-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
            placeholder="https://example.com/stream.m3u8"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-text-secondary mb-2">Thumbnail URL</label>
          <input
            type="url"
            value={formData.thumbnail_url}
            onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
            className="w-full bg-background border border-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div>
          <label className="block text-text-secondary mb-2">Category</label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full bg-background border border-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-text-secondary mb-2">Language</label>
          <select
            value={formData.language_id}
            onChange={(e) => setFormData({ ...formData, language_id: e.target.value })}
            className="w-full bg-background border border-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="">Select Language</option>
            {languages.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-text-secondary mb-2">State</label>
          <select
            value={formData.state_id}
            onChange={handleStateChange}
            className="w-full bg-background border border-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="">Select State</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-text-secondary mb-2">District</label>
          <select
            value={formData.district_id}
            onChange={(e) => setFormData({ ...formData, district_id: e.target.value })}
            className="w-full bg-background border border-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
            disabled={!districts.length}
          >
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
            <label className="block text-text-secondary mb-2">User Agent (Optional)</label>
            <input
                type="text"
                value={formData.user_agent || ''}
                onChange={(e) => setFormData({ ...formData, user_agent: e.target.value })}
                className="w-full bg-background border border-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
                placeholder="Custom User Agent"
            />
        </div>

        <div>
            <label className="block text-text-secondary mb-2">Referer (Optional)</label>
            <input
                type="text"
                value={formData.referer || ''}
                onChange={(e) => setFormData({ ...formData, referer: e.target.value })}
                className="w-full bg-background border border-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
                placeholder="Custom Referer"
            />
        </div>

        <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-800 bg-background text-primary focus:ring-primary"
                />
                <span className="text-white">Featured Channel</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={formData.is_premium}
                    onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-800 bg-background text-primary focus:ring-primary"
                />
                <span className="text-white">Premium Channel</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={formData.status === 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                    className="w-5 h-5 rounded border-gray-800 bg-background text-primary focus:ring-primary"
                />
                <span className="text-white">Active</span>
            </label>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : (isEditing ? 'Update Channel' : 'Create Channel')}
        </button>
      </div>
    </form>
  );
}
