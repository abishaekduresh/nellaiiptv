'use client';

import { useState, useEffect } from 'react';
import adminApi from '@/lib/adminApi';
import { toast } from 'react-hot-toast';
import { 
  Key, Plus, Trash2, Edit2, Copy, Shield, Calendar, 
  CheckCircle, XCircle, AlertCircle, RefreshCw 
} from 'lucide-react';

interface ApiKey {
  id: number;
  uuid: string;
  key_string: string;
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'expired' | 'deleted';
  allowed_platforms: string; // Comma separated
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active',
    allowed_platforms: [] as string[],
    expires_at: ''
  });

  const fetchKeys = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.get('/admin/api-keys');
      if (res.data.status) {
        setKeys(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingKey) {
        await adminApi.put(`/admin/api-keys/${editingKey.uuid}`, formData);
        toast.success('API Key updated successfully');
      } else {
        await adminApi.post('/admin/api-keys', formData);
        toast.success('API Key created successfully');
      }
      setIsModalOpen(false);
      fetchKeys();
      resetForm();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Operation failed';
      toast.error(msg);
      console.error('API Key Error:', error);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this API Key?')) return;
    try {
      await adminApi.delete(`/admin/api-keys/${uuid}`);
      toast.success('API Key deleted');
      fetchKeys();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to delete key';
      toast.error(msg);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', status: 'active', allowed_platforms: ['web', 'android', 'ios', 'tv'], expires_at: '' });
    setEditingKey(null);
  };

  const openEdit = (key: ApiKey) => {
    setEditingKey(key);
    setFormData({
      title: key.title,
      description: key.description || '',
      status: key.status,
      allowed_platforms: key.allowed_platforms ? key.allowed_platforms.split(',') : ['web', 'android', 'ios', 'tv'],
      expires_at: key.expires_at ? key.expires_at.slice(0, 16) : '' // Format for datetime-local
    });
    setIsModalOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('API Key copied to clipboard');
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Key className="w-8 h-8 text-primary" /> API Key Management
          </h1>
          <p className="text-text-secondary mt-1">Manage access keys for third-party apps and integrations</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Generate New Key
        </button>
      </div>

      <div className="bg-background-card rounded-lg border border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-800/50 text-text-secondary text-sm uppercase border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Details</th>
                <th className="px-6 py-4 font-semibold">Key</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Platforms</th>
                <th className="px-6 py-4 font-semibold">Expires</th>
                <th className="px-6 py-4 font-semibold">Last Used</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-text-secondary">Loading keys...</td></tr>
              ) : keys.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-text-secondary">No API keys found. Create one to get started.</td></tr>
              ) : (
                keys.map((key) => (
                  <tr key={key.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{key.title}</div>
                      {key.description && <div className="text-xs text-text-secondary mt-0.5">{key.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded text-xs font-mono text-gray-300 w-fit border border-gray-800">
                        <Shield className="w-3 h-3 text-primary" />
                        {key.key_string.substring(0, 10)}...{key.key_string.substring(key.key_string.length - 4)}
                        <button onClick={() => copyToClipboard(key.key_string)} className="hover:text-primary ml-1 text-gray-400" title="Copy Key">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        key.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        key.status === 'expired' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {key.status === 'active' && <CheckCircle className="w-3 h-3" />}
                        {key.status === 'expired' && <AlertCircle className="w-3 h-3" />}
                        {key.status.charAt(0).toUpperCase() + key.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(key.allowed_platforms || 'web,android,ios,tv').split(',').map((p) => (
                           <span key={p} className="text-[10px] uppercase bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded border border-gray-600">{p}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {key.expires_at ? (
                        <div className={`flex items-center gap-1 ${new Date(key.expires_at) < new Date() ? 'text-red-400 font-medium' : ''}`}>
                           <Calendar className="w-3 h-3" />
                           {new Date(key.expires_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : <span className="text-gray-500 italic">Never</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(key)} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 p-2 rounded transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(key.uuid)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-background-card border border-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
              <h3 className="font-bold text-lg text-white">
                {editingKey ? 'Edit API Key' : 'Generate New API Key'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Key Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Mobile App v2 Production"
                  className="w-full px-3 py-2 bg-background border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-white placeholder-gray-600"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description (Optional)</label>
                <textarea 
                  rows={2}
                  placeholder="Internal notes..."
                  className="w-full px-3 py-2 bg-background border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-white placeholder-gray-600"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Allowed Platforms</label>
                <div className="grid grid-cols-2 gap-2">
                  {['web', 'android', 'ios', 'tv'].map((platform) => (
                    <label key={platform} className="flex items-center space-x-2 bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-700 transition">
                      <input
                        type="checkbox"
                        className="rounded border-gray-600 text-primary focus:ring-primary/20 bg-gray-900"
                        checked={formData.allowed_platforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, allowed_platforms: [...formData.allowed_platforms, platform]});
                          } else {
                            setFormData({...formData, allowed_platforms: formData.allowed_platforms.filter(p => p !== platform)});
                          }
                        }}
                      />
                      <span className="text-sm text-white capitalize">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                  <select 
                    className="w-full px-3 py-2 bg-background border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-white"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Expiry Date</label>
                  <input 
                    type="datetime-local" 
                    className="w-full px-3 py-2 bg-background border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-white dark-date-input"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                    style={{ colorScheme: 'dark' }} 
                  />
                  <div className="text-xs text-gray-500 mt-1">Leave empty for no expiry</div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-text-secondary hover:bg-gray-800 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-sm transition-colors font-medium text-sm flex items-center gap-2"
                >
                  {editingKey ? 'Save Changes' : 'Generate Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
