'use client';

import { useState, useEffect } from 'react';
import adminApi from '@/lib/adminApi';
import { toast } from 'react-hot-toast';
import { Key, Plus, Trash2, Edit2, Copy, Shield, Calendar, CheckCircle, AlertCircle, X } from 'lucide-react';

interface ApiKey {
  id: number;
  uuid: string;
  key_string: string;
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'expired' | 'deleted';
  allowed_platforms: string;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

const defaultForm = { title: '', description: '', status: 'active', allowed_platforms: ['web', 'android', 'ios', 'tv'] as string[], expires_at: '' };

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [formData, setFormData] = useState(defaultForm);

  const fetchKeys = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.get('/admin/api-keys');
      if (res.data.status) setKeys(res.data.data);
    } catch {
      toast.error('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingKey) {
        await adminApi.put(`/admin/api-keys/${editingKey.uuid}`, formData);
        toast.success('API Key updated');
      } else {
        await adminApi.post('/admin/api-keys', formData);
        toast.success('API Key created');
      }
      setIsModalOpen(false);
      fetchKeys();
      setFormData(defaultForm);
      setEditingKey(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Delete this API Key?')) return;
    try {
      await adminApi.delete(`/admin/api-keys/${uuid}`);
      toast.success('API Key deleted');
      fetchKeys();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete key');
    }
  };

  const openEdit = (key: ApiKey) => {
    setEditingKey(key);
    setFormData({
      title: key.title, description: key.description || '', status: key.status,
      allowed_platforms: key.allowed_platforms ? key.allowed_platforms.split(',') : ['web', 'android', 'ios', 'tv'],
      expires_at: key.expires_at ? key.expires_at.slice(0, 16) : '',
    });
    setIsModalOpen(true);
  };

  const copyKey = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  const inputClass = "w-full bg-slate-800 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-slate-600";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">API Keys</h1>
          <p className="text-slate-400 text-sm mt-1">Manage access keys for apps and integrations</p>
        </div>
        <button onClick={() => { setFormData(defaultForm); setEditingKey(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5">
          <Plus size={16} /> Generate Key
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.12s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                {['Details', 'Key', 'Status', 'Platforms', 'Expires', 'Last Used', ''].map((h, i) => (
                  <th key={i} className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm">Loading keys...</span>
                  </div>
                </td></tr>
              ) : keys.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Key size={32} className="opacity-30" />
                    <span className="text-sm">No API keys found</span>
                  </div>
                </td></tr>
              ) : keys.map(key => (
                <tr key={key.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-white font-medium">{key.title}</p>
                    {key.description && <p className="text-slate-500 text-xs mt-0.5">{key.description}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 bg-slate-800 px-2.5 py-1.5 rounded-lg w-fit font-mono text-xs text-slate-300 border border-slate-700">
                      <Shield size={11} className="text-primary shrink-0" />
                      {key.key_string.substring(0, 8)}…{key.key_string.slice(-4)}
                      <button onClick={() => copyKey(key.key_string)} className="hover:text-primary text-slate-500 transition-colors" title="Copy">
                        <Copy size={11} />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      key.status === 'active' ? 'bg-green-500/15 text-green-400'
                      : key.status === 'expired' ? 'bg-orange-500/15 text-orange-400'
                      : 'bg-slate-500/15 text-slate-400'
                    }`}>
                      {key.status === 'active' ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                      {key.status.charAt(0).toUpperCase() + key.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {(key.allowed_platforms || 'web').split(',').map(p => (
                        <span key={p} className="text-[10px] uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {key.expires_at ? (
                      <div className={`flex items-center gap-1 text-xs ${new Date(key.expires_at) < new Date() ? 'text-red-400' : 'text-slate-400'}`}>
                        <Calendar size={11} />
                        {new Date(key.expires_at).toLocaleDateString()}
                      </div>
                    ) : <span className="text-slate-500 text-xs">Never</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">
                    {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : <span className="text-slate-600 italic">Never</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(key)}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(key.uuid)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-bold text-white">{editingKey ? 'Edit API Key' : 'Generate New Key'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Key Title</label>
                <input type="text" required placeholder="e.g. Mobile App Production" className={inputClass}
                  value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <textarea rows={2} placeholder="Internal notes..." className={`${inputClass} resize-none`}
                  value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Allowed Platforms</label>
                <div className="grid grid-cols-2 gap-2">
                  {['web', 'android', 'ios', 'tv'].map(platform => (
                    <label key={platform} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      formData.allowed_platforms.includes(platform) ? 'bg-primary/10 border-primary/30 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}>
                      <input type="checkbox" className="hidden" checked={formData.allowed_platforms.includes(platform)}
                        onChange={e => {
                          const list = e.target.checked
                            ? [...formData.allowed_platforms, platform]
                            : formData.allowed_platforms.filter(p => p !== platform);
                          setFormData({ ...formData, allowed_platforms: list });
                        }} />
                      <span className="text-sm capitalize">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                  <select className={inputClass} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Expiry</label>
                  <input type="datetime-local" className={inputClass} value={formData.expires_at}
                    onChange={e => setFormData({ ...formData, expires_at: e.target.value })} style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all text-sm font-medium">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-primary hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25">
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
