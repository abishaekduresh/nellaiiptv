'use client';


import { useEffect, useState } from 'react';
import adminApi from '@/lib/adminApi';
import toast from 'react-hot-toast';
import { Save, Lock, Image, Hammer, Monitor, Smartphone, Tv, LayoutGrid } from 'lucide-react';
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
    setSettings(settings.map(s => s.setting_key === key ? { ...s, setting_value: value } : s));
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
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">System Settings</h1>
      
      <div className="bg-background-card p-6 rounded-lg border border-gray-800 max-w-4xl">
        <div className="space-y-6">
          {settings.length === 0 ? (
            <p className="text-text-secondary">No settings found.</p>
          ) : (
            settings.map((setting) => (
              <div key={setting.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="text-text-secondary font-medium capitalize">
                  {setting.setting_key.replace(/_/g, ' ')}
                </label>
                <div className="md:col-span-3 flex gap-4">
                  <textarea
                    value={setting.setting_value}
                    onChange={(e) => handleUpdate(setting.setting_key, e.target.value)}
                    className="flex-1 bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => handleSave(setting.setting_key, setting.setting_value)}
                    disabled={saving}
                    className="bg-primary hover:bg-primary-dark text-white p-2 rounded-lg transition-colors"
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

      {/* Branding Settings */}
      <h2 className="text-2xl font-bold text-white mt-12 mb-6 flex items-center gap-2">
        <Image className="text-primary" />
        Branding Settings
      </h2>
      <div className="bg-background-card p-6 rounded-lg border border-gray-800 max-w-4xl mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <label className="text-text-secondary font-medium">Application Logo</label>
              <div className="md:col-span-3">
                  <div className="flex items-center gap-4">
                      {settings.find(s => s.setting_key === 'logo_url') && (
                          <div className="w-16 h-16 bg-slate-900 rounded-lg border border-gray-700 overflow-hidden">
                              <img 
                                  src={settings.find(s => s.setting_key === 'logo_url')?.setting_value} 
                                  alt="Current Logo" 
                                  className="w-full h-full object-contain"
                              />
                          </div>
                      )}
                      
                      <label className={`bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg cursor-pointer transition-colors ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {uploadingLogo ? 'Uploading...' : 'Upload New Logo'}
                          <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleLogoUpload} 
                              disabled={uploadingLogo}
                          />
                      </label>
                      <p className="text-xs text-slate-500">
                          Recommended: 512x512 PNG/WEBP
                      </p>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mt-6 pt-6 border-t border-gray-800">
              <label className="text-text-secondary font-medium">Player Overlay Logo (PNG)</label>
              <div className="md:col-span-3">
                  <div className="flex items-center gap-4">
                      {settings.find(s => s.setting_key === 'app_logo_png_path') && (
                          <div className="w-16 h-16 bg-slate-900 rounded-lg border border-gray-700 overflow-hidden flex items-center justify-center">
                              <img 
                                  src={settings.find(s => s.setting_key === 'app_logo_png_path')?.setting_value} 
                                  alt="App Logo PNG" 
                                  className="w-full h-full object-contain p-2"
                              />
                          </div>
                      )}
                      
                      <label className={`bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg cursor-pointer transition-colors ${uploadingPngLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {uploadingPngLogo ? 'Uploading...' : 'Upload PNG Logo'}
                          <input 
                              type="file" 
                              accept="image/png" 
                              className="hidden" 
                              onChange={handlePngLogoUpload} 
                              disabled={uploadingPngLogo}
                          />
                      </label>
                      <p className="text-xs text-slate-500">
                          Required: Transparent PNG
                      </p>
                  </div>
              </div>
          </div>
      </div>

      {/* Maintenance Mode */}
      <h2 className="text-2xl font-bold text-white mt-12 mb-6 flex items-center gap-2">
        <Hammer className="text-primary" />
        Maintenance Mode
      </h2>
      <div className="bg-background-card p-6 rounded-lg border border-gray-800 max-w-4xl mb-12">
        <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-gray-700">
                <div>
                    <h3 className="font-semibold text-white">Enable Maintenance Mode</h3>
                    <p className="text-sm text-slate-400">Restrict public access to the application. Admins can still login.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.find(s => s.setting_key === 'maintenance_mode')?.setting_value === '1'}
                        onChange={(e) => {
                            const newValue = e.target.checked ? '1' : '0';
                            handleUpdate('maintenance_mode', newValue); // Optimistic immediate update
                            handleSave('maintenance_mode', newValue); // Background save
                        }} 
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="text-text-secondary font-medium">Screen Title</label>
                <div className="md:col-span-3 flex gap-4">
                     <input
                        type="text"
                        value={settings.find(s => s.setting_key === 'maintenance_title')?.setting_value || ''}
                        onChange={(e) => handleUpdate('maintenance_title', e.target.value)}
                        placeholder="e.g., Under Maintenance"
                        className="flex-1 bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                    />
                     <button
                        onClick={() => handleSave('maintenance_title', settings.find(s => s.setting_key === 'maintenance_title')?.setting_value || '')}
                        disabled={saving}
                        className="bg-primary hover:bg-primary-dark text-white p-2 rounded-lg transition-colors"
                        title="Save"
                    >
                        <Save size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="text-text-secondary font-medium">Screen Message</label>
                <div className="md:col-span-3 flex gap-4">
                    <textarea
                        value={settings.find(s => s.setting_key === 'maintenance_message')?.setting_value || ''}
                        onChange={(e) => handleUpdate('maintenance_message', e.target.value)}
                        placeholder="e.g., We are currently upgrading our system..."
                        className="flex-1 bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                    />
                      <button
                        onClick={() => handleSave('maintenance_message', settings.find(s => s.setting_key === 'maintenance_message')?.setting_value || '')}
                        disabled={saving}
                        className="bg-primary hover:bg-primary-dark text-white p-2 rounded-lg transition-colors"
                        title="Save"
                    >
                        <Save size={20} />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Display Settings */}
      <h2 className="text-2xl font-bold text-white mt-12 mb-6 flex items-center gap-2">
        <LayoutGrid className="text-primary" />
        Display Settings
      </h2>
      <div className="bg-background-card p-6 rounded-lg border border-gray-800 max-w-4xl mb-12">
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                <label className="text-text-secondary font-medium pt-2">Top Trending Visibility</label>
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
                                <label key={platform.id} className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-primary/10 border-primary text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                                    <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={isChecked}
                                        onChange={(e) => {
                                            const newPlatforms = e.target.checked 
                                                ? [...platforms, platform.id]
                                                : platforms.filter(p => p !== platform.id);
                                            
                                            // Ensure unique and save as string
                                            const uniquePlatforms = Array.from(new Set(newPlatforms)).join(',');
                                            handleSave('top_trending_platforms', uniquePlatforms);
                                            handleUpdate('top_trending_platforms', uniquePlatforms);
                                        }}
                                    />
                                    <platform.icon size={24} className={isChecked ? 'text-primary' : 'text-slate-500'} />
                                    <span className="font-bold text-sm">{platform.label}</span>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isChecked ? 'bg-primary border-primary' : 'border-slate-600'}`}>
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

      {/* Password Change Section */}
        <>
          <h2 className="text-2xl font-bold text-white mt-12 mb-6 flex items-center gap-2">
            <Lock className="text-primary" />
            Security Settings
          </h2>
          <div className="bg-background-card p-6 rounded-lg border border-gray-800 max-w-4xl">
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="text-text-secondary font-medium">Current Password</label>
                <div className="md:col-span-3">
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Enter current password"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="text-text-secondary font-medium">New Password</label>
                <div className="md:col-span-3">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Enter new password (min 6 chars)"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="text-text-secondary font-medium">Confirm Password</label>
                <div className="md:col-span-3">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </>
    </div>
  );
}
