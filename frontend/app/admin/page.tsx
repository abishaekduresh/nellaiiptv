'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost/public/api',
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, isAdmin, token } = useAuthStore();

  useEffect(() => {
    if (token && isAdmin) {
      router.push('/admin/dashboard');
    }
  }, [token, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await adminApi.post('/admin/login', { username, password });
      const { access_token, user } = res.data.data;
      localStorage.setItem('admin_token', access_token);
      setAuth(access_token, user, true);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="bg-background-card rounded-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Admin Login</h1>
        <p className="text-text-secondary text-center mb-6">Nellai IPTV Administration</p>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-background text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter admin username"
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter admin password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary hover:bg-secondary-dark disabled:bg-gray-600 text-background font-semibold py-3 rounded-lg transition"
          >
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>

        <p className="text-text-secondary text-center mt-4">
          <Link href="/" className="text-primary hover:text-primary-light">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
