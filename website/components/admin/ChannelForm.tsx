'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import adminApi from '@/lib/adminApi';
import toast from 'react-hot-toast';
import { Monitor, Smartphone, Tv, Star, Crown, Activity } from 'lucide-react';

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
    logo_url: '',
    state_id: '',
    district_id: '',
    language_id: '',
    category_id: '',
    is_featured: false,
    is_premium: false,
    allowed_platforms: 'web,android,ios,tv',
    status: 'active',
    user_agent: '',
    referer: '',
    proprietor_name: '',
    proprietor_phone: '',
    proprietor_email: '',
    proprietor_address: '',
    ...initialData,
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [phoneError, setPhoneError] = useState<string>('');

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [statesRes, languagesRes, categoriesRes] = await Promise.all([
          adminApi.get('/admin/states'),
          adminApi.get('/admin/languages', { params: { status: 'all' } }),
          adminApi.get('/admin/categories', { params: { status: 'all' } })
        ]);
        
        setStates(statesRes.data.data);

        // Sort Languages
        const langs = languagesRes.data.data;
        langs.sort((a: any, b: any) => (a.order_number ?? 999) - (b.order_number ?? 999));
        setLanguages(langs);

        // Sort Categories
        const cats = categoriesRes.data.data;
        cats.sort((a: any, b: any) => (a.order_number ?? 999) - (b.order_number ?? 999));
        setCategories(cats);

        // Fetch districts if state is already selected (editing mode)
        if (initialData?.state_id) {
            try {
                const districtsRes = await adminApi.get(`/admin/districts?state_id=${initialData.state_id}`);
                setDistricts(districtsRes.data.data);
            } catch (err) {
                console.error('Failed to fetch initial districts', err);
            }
        }

        // Auto-fetch next channel number for new channels
        if (!isEditing && !initialData?.channel_number) {
            try {
                const nextNumRes = await adminApi.get('/admin/channels/next-number');
                if (nextNumRes.data?.data?.next_number) {
                    setFormData((prev: any) => ({ ...prev, channel_number: nextNumRes.data.data.next_number.toString() }));
                }
            } catch (err) {
                console.error('Failed to fetch next channel number', err);
            }
        }
      } catch (error) {
        console.error('Failed to fetch form options', error);
        toast.error('Failed to load form options');
      }
    };

    fetchFormData();
  }, [initialData]);

  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateId = e.target.value;
    setFormData({ ...formData, state_id: stateId, district_id: '' });
    
    if (stateId) {
      try {
        const res = await adminApi.get(`/admin/districts?state_id=${stateId}`);
        setDistricts(res.data.data);
      } catch (error) {
        console.error('Failed to fetch districts', error);
        toast.error('Failed to load districts');
      }
    } else {
      setDistricts([]);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone || phone.trim() === '') {
      return true; // Empty is valid (optional field)
    }
    
    // Remove spaces, hyphens, and parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Indian phone number patterns:
    // 1. 10 digits: 9876543210
    // 2. With +91: +919876543210
    // 3. With 91: 919876543210
    // 4. With country code and space: +91 9876543210
    
    const patterns = [
      /^[6-9]\d{9}$/,           // 10 digits starting with 6-9
      /^\+91[6-9]\d{9}$/,       // +91 followed by 10 digits
      /^91[6-9]\d{9}$/,         // 91 followed by 10 digits
      /^0[6-9]\d{9}$/,          // 0 followed by 10 digits (landline format)
    ];
    
    return patterns.some(pattern => pattern.test(cleaned));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number if provided
    if (formData.proprietor_phone && !validatePhoneNumber(formData.proprietor_phone)) {
      toast.error('Invalid phone number format. Please enter a valid Indian phone number (10 digits, optionally with +91 prefix)');
      return;
    }
    
    setLoading(true);
    
    // Create FormData for upload
    const data = new FormData();
    Object.keys(formData).forEach(key => {
        // Exclude URLs from formData if we are uploading new files, 
        // OR simply include them and let backend ignore if file is present.
        // But cleaner to just append everything.
        if (key === 'thumbnail_url' && thumbnailFile) return; // Don't send old URL if new file
        if (key === 'logo_url' && logoFile) return;

        data.append(key, (formData as any)[key]);
    });

    if (thumbnailFile) {
        data.append('thumbnail', thumbnailFile);
    }
    if (logoFile) {
        data.append('logo', logoFile);
    }
    
    // For update (PUT) with files, PHP sometimes has issues with PUT + Multipart.
    // Standard workaround: POST with `_method: PUT`
    if (isEditing) {
        data.append('_method', 'PUT');
    }

    try {
      if (isEditing) {
        // Use POST with _method=PUT for file uploads in PHP
        await adminApi.post(`/admin/channels/${initialData.uuid}`, data);
        toast.success('Channel updated successfully');
      } else {
        await adminApi.post('/admin/channels', data);
        toast.success('Channel created successfully');
        router.push('/admin/channels');
      }
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to save channel';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'logo') => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (type === 'thumbnail') {
              setThumbnailFile(file);
              // Create local preview
              setFormData({ ...formData, thumbnail_url: URL.createObjectURL(file) });
          } else {
              setLogoFile(file);
              setFormData({ ...formData, logo_url: URL.createObjectURL(file) });
          }
      }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name and Number fields exist here, skipping for brevity in replacement... */}
        {/* Actually I need to replace the whole block to insert fields correctly */}
        
        {/* RE-INSERTING Name/Number/HLS Fields so I don't break them */}
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

        {/* THUMBNAIL UPLOAD */}
        <div>
          <label className="block text-text-secondary mb-2">Thumbnail (Card Image)</label>
          <div className="flex gap-4 items-center">
              {formData.thumbnail_url && (
                  <img src={formData.thumbnail_url} alt="Preview" className="w-16 h-16 object-cover rounded-md border border-gray-700" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'thumbnail')}
                className="w-full bg-background border border-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
              />
          </div>
          <p className="text-xs text-gray-500 mt-1">Displayed on channel grid.</p>
        </div>

        {/* LOGO UPLOAD */}
        <div>
          <label className="block text-text-secondary mb-2">Channel Logo</label>
          <div className="flex gap-4 items-center">
              {formData.logo_url && (
                  <img src={formData.logo_url} alt="Logo Preview" className="w-16 h-16 object-contain rounded-md border border-gray-700 bg-gray-900" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'logo')}
                className="w-full bg-background border border-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
              />
          </div>
           <p className="text-xs text-gray-500 mt-1">Official logo of the channel.</p>
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

        {/* Proprietor Details Section */}
        <div className="md:col-span-2">
          <h3 className="text-xl font-semibold text-white mb-4 mt-4 pb-2 border-b border-gray-800">Channel Proprietor Details</h3>
        </div>

        <div>
            <label className="block text-text-secondary mb-2">Proprietor Name</label>
            <input
                type="text"
                value={formData.proprietor_name || ''}
                onChange={(e) => setFormData({ ...formData, proprietor_name: e.target.value })}
                className="w-full bg-background border border-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
                placeholder="Owner/Proprietor Name"
            />
        </div>

        <div>
            <label className="block text-text-secondary mb-2">Proprietor Phone</label>
            <input
                type="tel"
                value={formData.proprietor_phone || ''}
                onChange={(e) => {
                  setFormData({ ...formData, proprietor_phone: e.target.value });
                  // Clear error when user starts typing
                  if (phoneError) setPhoneError('');
                }}
                onBlur={(e) => {
                  const phone = e.target.value;
                  if (phone && !validatePhoneNumber(phone)) {
                    setPhoneError('Invalid phone number format');
                  } else {
                    setPhoneError('');
                  }
                }}
                className={`w-full bg-background border ${
                  phoneError 
                    ? 'border-red-500' 
                    : formData.proprietor_phone && validatePhoneNumber(formData.proprietor_phone)
                    ? 'border-green-500'
                    : 'border-gray-800'
                } text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary`}
                placeholder="+91 9876543210"
            />
            {phoneError && (
              <p className="text-red-400 text-sm mt-1">{phoneError}</p>
            )}
            {!phoneError && formData.proprietor_phone && validatePhoneNumber(formData.proprietor_phone) && (
              <p className="text-green-400 text-sm mt-1">✓ Valid phone number</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Formats: 9876543210, +91 9876543210, or 91 9876543210
            </p>
        </div>

        <div>
            <label className="block text-text-secondary mb-2">Proprietor Email</label>
            <input
                type="email"
                value={formData.proprietor_email || ''}
                onChange={(e) => setFormData({ ...formData, proprietor_email: e.target.value })}
                className="w-full bg-background border border-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
                placeholder="owner@example.com"
            />
        </div>

        <div>
            <label className="block text-text-secondary mb-2">Proprietor Address</label>
            <textarea
                value={formData.proprietor_address || ''}
                onChange={(e) => setFormData({ ...formData, proprietor_address: e.target.value })}
                className="w-full bg-background border border-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
                placeholder="Full address of the channel owner"
                rows={3}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
                onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                className={`cursor-pointer rounded-xl border-2 p-6 flex flex-col items-center gap-3 transition-all duration-200 group text-center ${
                    formData.is_featured 
                    ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.1)]' 
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
                }`}
            >
                <div className={`p-3 rounded-full mb-1 ${formData.is_featured ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                    <Star size={24} fill={formData.is_featured ? "currentColor" : "none"} />
                </div>
                <div>
                    <h4 className={`font-bold text-sm ${formData.is_featured ? 'text-white' : 'text-slate-400'}`}>Featured Channel</h4>
                    <p className="text-xs text-slate-500 mt-1">Highlight on home page</p>
                </div>
                <div className={`mt-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.is_featured ? 'border-yellow-500' : 'border-slate-600'}`}>
                    {formData.is_featured && <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />}
                </div>
            </div>

            <div 
                onClick={() => setFormData({ ...formData, is_premium: !formData.is_premium })}
                className={`cursor-pointer rounded-xl border-2 p-6 flex flex-col items-center gap-3 transition-all duration-200 group text-center ${
                    formData.is_premium 
                    ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.1)]' 
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
                }`}
            >
                <div className={`p-3 rounded-full mb-1 ${formData.is_premium ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Crown size={24} fill={formData.is_premium ? "currentColor" : "none"} />
                </div>
                <div>
                    <h4 className={`font-bold text-sm ${formData.is_premium ? 'text-white' : 'text-slate-400'}`}>Premium Channel</h4>
                    <p className="text-xs text-slate-500 mt-1">Requires subscription</p>
                </div>
                <div className={`mt-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.is_premium ? 'border-purple-500' : 'border-slate-600'}`}>
                    {formData.is_premium && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                </div>
            </div>

            <div 
                onClick={() => setFormData({ ...formData, status: formData.status === 'active' ? 'inactive' : 'active' })}
                className={`cursor-pointer rounded-xl border-2 p-6 flex flex-col items-center gap-3 transition-all duration-200 group text-center ${
                    formData.status === 'active' 
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
                }`}
            >
                <div className={`p-3 rounded-full mb-1 ${formData.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Activity size={24} />
                </div>
                <div>
                    <h4 className={`font-bold text-sm ${formData.status === 'active' ? 'text-white' : 'text-slate-400'}`}>Active Status</h4>
                    <p className="text-xs text-slate-500 mt-1">{formData.status === 'active' ? 'Channel is live' : 'Channel is offline'}</p>
                </div>
                <div className={`mt-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.status === 'active' ? 'border-emerald-500' : 'border-slate-600'}`}>
                    {formData.status === 'active' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                </div>
            </div>
        </div>

        {/* Platform Restrictions */}
        <div className="md:col-span-2">
             <label className="block text-text-secondary mb-4 font-semibold">Allowed Platforms</label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                     { id: 'web', label: 'Web (OTT)', icon: Monitor },
                     { id: 'tv', label: 'TV (Classic)', icon: Tv },
                     { id: 'android', label: 'Android', icon: Smartphone },
                     { id: 'ios', label: 'iOS', icon: Smartphone },
                 ].map((platform) => {
                     const isSelected = formData.allowed_platforms.includes(platform.id);
                     return (
                         <div
                             key={platform.id}
                             onClick={() => {
                                 let current = formData.allowed_platforms ? formData.allowed_platforms.split(',').filter(Boolean) : [];
                                 if (!isSelected) {
                                     current.push(platform.id);
                                 } else {
                                     current = current.filter((p: string) => p !== platform.id);
                                 }
                                 setFormData({ ...formData, allowed_platforms: current.join(',') });
                             }}
                             className={`cursor-pointer rounded-xl border-2 p-6 flex flex-col items-center gap-4 transition-all duration-200 group ${
                                 isSelected 
                                 ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                                 : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
                             }`}
                         >
                             <platform.icon 
                                 size={32} 
                                 className={`transition-colors duration-200 ${isSelected ? 'text-primary' : 'text-slate-500 group-hover:text-slate-400'}`} 
                             />
                             <span className={`font-bold text-sm tracking-wide ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                 {platform.label}
                             </span>
                             
                             {/* Radio/Checkbox Indicator */}
                             <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                                 isSelected ? 'border-primary' : 'border-slate-600 group-hover:border-slate-500'
                             }`}>
                                 {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm" />}
                             </div>
                         </div>
                     );
                 })}
             </div>
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
