'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import { useAuthStore } from '@/stores/authStore';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth, user, isAdmin, token } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token && isAdmin) router.push('/admin/dashboard');
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
      router.push(user?.role === 'reseller' ? '/reseller' : '/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-primary/6 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/4 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 overflow-hidden">
            <Image
              src="/assets/logos/Nellai IPTV logo 512x512px.webp"
              alt="Nellai IPTV"
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Nellai IPTV</h1>
          <p className="text-slate-400 text-sm mt-1">Administration Portal</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-7 backdrop-blur">
          <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-6">Sign in to your admin account</p>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-5 text-sm">
              <Lock size={15} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  placeholder="Enter username"
                  className="w-full bg-slate-800 text-white pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-slate-600 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full bg-slate-800 text-white pl-10 pr-11 py-3 rounded-xl border border-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-slate-600 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 text-sm mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-slate-500 text-sm">
          <Link href="/" className="text-primary hover:text-cyan-400 transition-colors">
            ← Back to Website
          </Link>
        </p>
      </div>
    </div>
  );
}
