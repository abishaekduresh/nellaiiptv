'use client';


import { useEffect, useState } from 'react';
import adminApi from '@/lib/adminApi';
import toast from 'react-hot-toast';
import { Save, Lock, Image, Hammer, Monitor, Smartphone, Tv, LayoutGrid, Mail } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface Setting {
  id: number;
  setting_key: string;
  setting_value: string;
  created_at: string;
  updated_at: string;
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setChangingPassword(true);
    try {
      await adminApi.post('/admin/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      toast.success('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('logo', file);

      setUploadingLogo(true);
      try {
          const res = await adminApi.post('/admin/settings/logo', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          if (res.data.status) {
              toast.success('Logo updated successfully');
               // Update local state if needed, or refresh settings
              // We might want to force a window reload or update a global context to reflect the new logo immediately
              window.location.reload(); 
          }
      } catch (error: any) {
          toast.error(error.response?.data?.message || 'Failed to upload logo');
      } finally {
          setUploadingLogo(false);
      }
  };

  const [uploadingPngLogo, setUploadingPngLogo] = useState(false);
  const handlePngLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.type !== 'image/png') {
        toast.error('Only PNG files are allowed');
        return;
      }

      const formData = new FormData();
      formData.append('logo', file);

      setUploadingPngLogo(true);
      try {
          const res = await adminApi.post('/admin/settings/logo-png', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          if (res.data.status) {
              toast.success('PNG Logo updated successfully');
              window.location.reload(); 
          }
      } catch (error: any) {
          toast.error(error.response?.data?.message || 'Failed to upload logo');
      } finally {
          setUploadingPngLogo(false);
      }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await adminApi.get('/admin/settings');
        // Structure depends on what Setting::all()->toArray() returns.
        // Assuming it returns [ {setting_key: '...'}, ... ] directly inside res.data.data
        let settingsData = res.data.data;
        
        // Smart Fix: Sanitize logo_url if present
        settingsData = settingsData.map((s: Setting) => {
            if ((s.setting_key === 'logo_url' || s.setting_key === 'app_logo_png_path') && s.setting_value) {
                let url = s.setting_value;
                if (url.includes('/uploads/')) {
                     if (url.includes('localhost') || url.includes('127.0.0.1')) {
                         const match = url.match(/\/uploads\/.*$/);
                         if (match) url = match[0];
                     }
                }
                return { ...s, setting_value: url };
            }
            return s;
        });

        setSettings(settingsData);
      } catch (error) {
        console.error('Failed to fetch settings', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    // Optimistic update
    const existing = settings.find(s => s.setting_key === key);
    if (existing) {
        setSettings(settings.map(s => s.setting_key === key ? { ...s, setting_value: value } : s));
    } else {
        // Create temporary local setting object for optimistic UI
        const newSetting: Setting = {
            id: Date.now(), // temporary ID
            setting_key: key,
            setting_value: value,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        setSettings([...settings, newSetting]);
    }
  };

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    try {
      await adminApi.put(`/admin/settings/${key}`, { value });
      toast.success(`Setting '${key.replace(/_/g, ' ')}' updated`);
    } catch (error) {
      toast.error(`Failed to update '${key.replace(/_/g, ' ')}'`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">System Settings</h1>
        <p className="text-slate-400">Manage your application configuration, branding, and platform availability</p>
      </div>
      
      {/* General Settings */}
      <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 shadow-2xl mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Save className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">General Settings</h2>
            <p className="text-sm text-slate-400">Configure basic application settings</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {settings.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                <Save className="text-slate-600" size={32} />
              </div>
              <p className="text-slate-400">No settings found.</p>
            </div>
          ) : (
            settings.map((setting) => (
              <div key={setting.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 transition-all">
                <label className="text-slate-300 font-semibold capitalize">
                  {setting.setting_key.replace(/_/g, ' ')}
                </label>
                <div className="md:col-span-3 flex gap-3">
                  <textarea
                    value={setting.setting_value}
                    onChange={(e) => handleUpdate(setting.setting_key, e.target.value)}
                    className="flex-1 bg-slate-900/60 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    rows={2}
                  />
                  <button
                    onClick={() => handleSave(setting.setting_key, setting.setting_value)}
                    disabled={saving}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                    title="Save"
                  >
                    <Save size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 backdrop-blur-sm p-8 rounded-2xl border border-emerald-700/30 shadow-2xl mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <div className="text-2xl text-emerald-400">₹</div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Payment Gateway Settings</h2>
            <p className="text-sm text-slate-400">Configure payment providers for transactions</p>
          </div>
        </div>
        
        <div className="space-y-4">
            
            {/* Razorpay */}
            <div className="flex items-center justify-between p-5 bg-slate-800/60 rounded-xl border border-slate-700/40 hover:border-emerald-500/30 transition-all group">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                        <span className="text-2xl">💳</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-lg">Razorpay</h3>
                        <p className="text-sm text-slate-400">Accept payments via Razorpay. Keys must be configured in .env.</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.find(s => s.setting_key === 'gateway_razorpay_enabled')?.setting_value === '1'}
                        onChange={(e) => {
                            const newValue = e.target.checked ? '1' : '0';
                            handleUpdate('gateway_razorpay_enabled', newValue);
                            handleSave('gateway_razorpay_enabled', newValue);
                        }} 
                    />
                    <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-lg"></div>
                </label>
            </div>

            {/* Cashfree */}
            <div className="flex items-center justify-between p-5 bg-slate-800/60 rounded-xl border border-slate-700/40 hover:border-emerald-500/30 transition-all group">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-all">
                        <span className="text-2xl">💰</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-lg">Cashfree</h3>
                        <p className="text-sm text-slate-400">Accept payments via Cashfree. Keys must be configured in .env.</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.find(s => s.setting_key === 'gateway_cashfree_enabled')?.setting_value === '1'}
                        onChange={(e) => {
                            const newValue = e.target.checked ? '1' : '0';
                            handleUpdate('gateway_cashfree_enabled', newValue);
                            handleSave('gateway_cashfree_enabled', newValue);
                        }} 
                    />
                    <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-lg"></div>
                </label>
            </div>

        </div>
      </div>

      {/* Branding Settings */}
      <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 backdrop-blur-sm p-8 rounded-2xl border border-purple-700/30 shadow-2xl mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Image className="text-purple-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Branding Settings</h2>
            <p className="text-sm text-slate-400">Customize your application logos and branding</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-5 bg-slate-800/60 rounded-xl border border-slate-700/40">
              <label className="text-slate-300 font-semibold">Application Logo</label>
              <div className="md:col-span-3">
                  <div className="flex items-center gap-4">
                      {settings.find(s => s.setting_key === 'logo_url') && (
                          <div className="w-20 h-20 bg-slate-900 rounded-xl border-2 border-purple-500/30 overflow-hidden shadow-lg">
                              <img 
                                  src={settings.find(s => s.setting_key === 'logo_url')?.setting_value} 
                                  alt="Current Logo" 
                                  className="w-full h-full object-contain p-2"
                              />
                          </div>
                      )}
                      
                      <div className="flex-1">
                          <label className={`inline-block bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20 ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              {uploadingLogo ? 'Uploading...' : '📤 Upload New Logo'}
                              <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={handleLogoUpload} 
                                  disabled={uploadingLogo}
                              />
                          </label>
                          <p className="text-xs text-slate-500 mt-2">
                              Recommended: 512x512 PNG/WEBP
                          </p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-5 bg-slate-800/60 rounded-xl border border-slate-700/40">
              <label className="text-slate-300 font-semibold">Player Overlay Logo</label>
              <div className="md:col-span-3">
                  <div className="flex items-center gap-4">
                      {settings.find(s => s.setting_key === 'app_logo_png_path') && (
                          <div className="w-20 h-20 bg-slate-900 rounded-xl border-2 border-purple-500/30 overflow-hidden flex items-center justify-center shadow-lg">
                              <img 
                                  src={settings.find(s => s.setting_key === 'app_logo_png_path')?.setting_value} 
                                  alt="App Logo PNG" 
                                  className="w-full h-full object-contain p-2"
                              />
                          </div>
                      )}
                      
                       <div className="flex-1">
                          <label className={`inline-block bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20 ${uploadingPngLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              {uploadingPngLogo ? 'Uploading...' : '📤 Upload PNG Logo'}
                              <input 
                                  type="file" 
                                  accept="image/png"
                                  className="hidden" 
                                  onChange={handlePngLogoUpload} 
                                  disabled={uploadingPngLogo}
                              />
                          </label>
                          <p className="text-xs text-slate-500 mt-2">
                              Required: Transparent PNG
                          </p>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 backdrop-blur-sm p-8 rounded-2xl border border-orange-700/30 shadow-2xl mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Hammer className="text-orange-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Maintenance Mode</h2>
            <p className="text-sm text-slate-400">Control public access during maintenance periods</p>
          </div>
        </div>
        
        <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-slate-800/60 rounded-xl border border-slate-700/40 hover:border-orange-500/30 transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <span className="text-2xl">🚧</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-lg">Enable Maintenance Mode</h3>
                        <p className="text-sm text-slate-400">Restrict public access. Admins can still login.</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.find(s => s.setting_key === 'maintenance_mode')?.setting_value === '1'}
                        onChange={(e) => {
                            const newValue = e.target.checked ? '1' : '0';
                            handleUpdate('maintenance_mode', newValue);
                            handleSave('maintenance_mode', newValue);
                        }} 
                    />
                    <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500 shadow-lg"></div>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-5 bg-slate-800/60 rounded-xl border border-slate-700/40">
                <label className="text-slate-300 font-semibold">Screen Title</label>
                <div className="md:col-span-3 flex gap-3">
                     <input
                        type="text"
                        value={settings.find(s => s.setting_key === 'maintenance_title')?.setting_value || ''}
                        onChange={(e) => handleUpdate('maintenance_title', e.target.value)}
                        placeholder="e.g., Under Maintenance"
                        className="flex-1 bg-slate-900/60 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                     <button
                        onClick={() => handleSave('maintenance_title', settings.find(s => s.setting_key === 'maintenance_title')?.setting_value || '')}
                        disabled={saving}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20"
                        title="Save"
                    >
                        <Save size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-5 bg-slate-800/60 rounded-xl border border-slate-700/40">
                <label className="text-slate-300 font-semibold">Screen Message</label>
                <div className="md:col-span-3 flex gap-3">
                    <textarea
                        value={settings.find(s => s.setting_key === 'maintenance_message')?.setting_value || ''}
                        onChange={(e) => handleUpdate('maintenance_message', e.target.value)}
                        placeholder="e.g., We are currently upgrading our system..."
                        rows={3}
                        className="flex-1 bg-slate-900/60 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                    />
                      <button
                        onClick={() => handleSave('maintenance_message', settings.find(s => s.setting_key === 'maintenance_message')?.setting_value || '')}
                        disabled={saving}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20"
                        title="Save"
                    >
                        <Save size={20} />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 backdrop-blur-sm p-8 rounded-2xl border border-cyan-700/30 shadow-2xl mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <LayoutGrid className="text-cyan-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Display Settings</h2>
            <p className="text-sm text-slate-400">Configure visibility and display options across platforms</p>
          </div>
        </div>
        
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start p-5 bg-slate-800/60 rounded-xl border border-slate-700/40">
                <label className="text-slate-300 font-semibold pt-2">Top Trending Visibility</label>
                <div className="md:col-span-3">
                    <p className="text-sm text-slate-400 mb-4">Select platforms where the "Top Trending" section should be visible.</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { id: 'tv', label: 'TV (Classic)', icon: Tv },
                            { id: 'android', label: 'Android', icon: Smartphone },
                            { id: 'ios', label: 'iOS', icon: Smartphone },
                        ].map((platform) => {
                            const platformsStr = settings.find(s => s.setting_key === 'top_trending_platforms')?.setting_value || 'web,android,ios,tv';
                            const platforms = platformsStr.split(',').map(s => s.trim());
                            const isChecked = platforms.includes(platform.id);

                            return (
                                <label key={platform.id} className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-cyan-500/10 border-cyan-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                                    <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={isChecked}
                                        onChange={(e) => {
                                            const newPlatforms = e.target.checked 
                                                ? [...platforms, platform.id]
                                                : platforms.filter(p => p !== platform.id);
                                            
                                            const uniquePlatforms = Array.from(new Set(newPlatforms)).join(',');
                                            handleSave('top_trending_platforms', uniquePlatforms);
                                            handleUpdate('top_trending_platforms', uniquePlatforms);
                                        }}
                                    />
                                    <platform.icon size={24} className={isChecked ? 'text-cyan-400' : 'text-slate-500'} />
                                    <span className="font-bold text-sm">{platform.label}</span>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isChecked ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'}`}>
                                        {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* Platform Availability Settings */}
      <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 backdrop-blur-sm p-8 rounded-2xl border border-red-700/30 shadow-2xl mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <Monitor className="text-red-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Platform Availability Settings</h2>
            <p className="text-sm text-slate-400">Control channel availability across different platforms</p>
          </div>
        </div>
        
        <div className="space-y-6">
            {/* Global Block All Channels */}
            <div className="flex items-center justify-between p-5 bg-red-900/30 rounded-xl border border-red-700/60 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <span className="text-2xl">🚫</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                          Block All Channels (Emergency)
                        </h3>
                        <p className="text-sm text-slate-400">Temporarily disable all channels across all platforms. Use this for maintenance or emergencies.</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.find(s => s.setting_key === 'block_all_channels')?.setting_value === '1'}
                        onChange={(e) => {
                            const newValue = e.target.checked ? '1' : '0';
                            handleUpdate('block_all_channels', newValue);
                            handleSave('block_all_channels', newValue);
                        }} 
                    />
                    <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600 shadow-lg"></div>
                </label>
            </div>

            {/* Individual Platform Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start pt-6 border-t border-red-700/30">
                <label className="text-slate-300 font-semibold pt-2">Disable Specific Platforms</label>
                <div className="md:col-span-3">
                    <p className="text-sm text-slate-400 mb-4">Disable channels for specific platforms individually.</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { id: 'web', label: 'Website', icon: Monitor },
                            { id: 'android', label: 'Android', icon: Smartphone },
                            { id: 'ios', label: 'iOS', icon: Smartphone },
                            { id: 'tv', label: 'TV', icon: Tv },
                        ].map((platform) => {
                            const disabledPlatformsStr = settings.find(s => s.setting_key === 'disabled_platforms')?.setting_value || '';
                            const disabledPlatforms = disabledPlatformsStr.split(',').map(s => s.trim()).filter(Boolean);
                            const isDisabled = disabledPlatforms.includes(platform.id);

                            return (
                                <label key={platform.id} className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isDisabled ? 'bg-red-500/10 border-red-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                                    <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={isDisabled}
                                        onChange={(e) => {
                                            const newDisabledPlatforms = e.target.checked 
                                                ? [...disabledPlatforms, platform.id]
                                                : disabledPlatforms.filter(p => p !== platform.id);
                                            
                                            const uniquePlatforms = Array.from(new Set(newDisabledPlatforms)).join(',');
                                            handleSave('disabled_platforms', uniquePlatforms);
                                            handleUpdate('disabled_platforms', uniquePlatforms);
                                        }}
                                    />
                                    <platform.icon size={24} className={isDisabled ? 'text-red-500' : 'text-slate-500'} />
                                    <span className="font-bold text-sm">{platform.label}</span>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isDisabled ? 'bg-red-500 border-red-500' : 'border-slate-600'}`}>
                                        {isDisabled && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* Contact Settings */}
      <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 backdrop-blur-sm p-8 rounded-2xl border border-blue-700/30 shadow-2xl mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Mail className="text-blue-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Contact Settings</h2>
            <p className="text-sm text-slate-400">Configure webhook URL for contact form submissions</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-5 bg-slate-800/60 rounded-xl border border-slate-700/40">
          <label className="text-slate-300 font-semibold">Webhook URL</label>
          <div className="md:col-span-3 flex gap-3">
            <input
              type="url"
              value={settings.find(s => s.setting_key === 'contact_webhook_url')?.setting_value || ''}
              onChange={(e) => handleUpdate('contact_webhook_url', e.target.value)}
              placeholder="https://example.com/webhook"
              className="flex-1 bg-slate-900/60 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button
              onClick={() => handleSave('contact_webhook_url', settings.find(s => s.setting_key === 'contact_webhook_url')?.setting_value || '')}
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
              title="Save"
            >
              <Save size={20} />
            </button>
          </div>
          <p className="md:col-start-2 md:col-span-3 text-xs text-slate-500">
            Optional: Enter a URL to receive POST requests when new contact messages are submitted.
          </p>
        </div>
      </div>

      {/* Password Change Section */}
        <>
          <div className="bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 backdrop-blur-sm p-8 rounded-2xl border border-indigo-700/30 shadow-2xl mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Lock className="text-indigo-400" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Security Settings</h2>
                <p className="text-sm text-slate-400">Update your admin password and security preferences</p>
              </div>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-5 bg-slate-800/60 rounded-xl border border-slate-700/40">
                <label className="text-slate-300 font-semibold">Current Password</label>
                <div className="md:col-span-3">
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="Enter current password"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-5 bg-slate-800/60 rounded-xl border border-slate-700/40">
                <label className="text-slate-300 font-semibold">New Password</label>
                <div className="md:col-span-3">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="Enter new password (min 6 chars)"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-5 bg-slate-800/60 rounded-xl border border-slate-700/40">
                <label className="text-slate-300 font-semibold">Confirm Password</label>
                <div className="md:col-span-3">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="Confirm new password"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 font-semibold"
                >
                  {changingPassword ? 'Updating...' : '🔒 Update Password'}
                </button>
              </div>
            </form>
          </div>
        </>
    </div>
  );
}
