'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTVFocus } from '@/hooks/useTVFocus';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, setAuth, user } = useAuthStore((state) => ({ 
    token: state.token, 
    setAuth: state.setAuth,
    user: state.user 
  }));

  useEffect(() => {
    if (token && user) {
      // Redirect based on user role
      if (user.role === 'reseller') {
        router.push('/reseller');
      } else {
        router.push('/');
      }
    }
  }, [token, user, router]);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'session_expired') {
        toast.error('Session expired. Please login again.', { 
            duration: 5000,
            id: 'session-expired'
        });
        // Clean up URL
        router.replace('/login');
    }
  }, [searchParams, router]);

  const { focusProps, isFocused } = useTVFocus({
      className: "w-full bg-primary hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed",
      focusClassName: "ring-4 ring-white scale-105 shadow-xl"
  });

  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic platform detection helper:
      // Identifies the client environment (Web desktop, Mobile, or TV)
      // to enforce platform-specific subscription rules.
      const getPlatform = () => {
          if (typeof window === 'undefined') return 'web';
          const ua = window.navigator.userAgent.toLowerCase();
          if (ua.includes('smart-tv') || ua.includes('tizen') || ua.includes('webos') || ua.includes('android tv')) return 'tv';
          if (/android|iphone|ipad|ipod/.test(ua)) return 'mobile';
          return 'web';
      };

      const response = await api.post('/customers/login', {
        phone: formData.phone,
        password: formData.password,
      }, {
          headers: {
              'X-Client-Platform': getPlatform()
          }
      });

      if (response.data.status) {
        const { token, user } = response.data.data;
        setAuth(token, user, false);
        
        // Check if user is reseller and redirect to reseller panel
        if (user?.role === 'reseller') {
          // Set admin flag for resellers to access admin layout
          setAuth(token, user, true);
          localStorage.setItem('admin_token', token);
          router.push('/reseller');
        } else {
          // Handle regular customer redirection
          const redirectPath = searchParams.get('redirect') || '/';
          router.push(redirectPath);
        }
      } else {
        toast.error(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      const errorData = err.response?.data?.errors;
      if (errorData?.error === 'device_limit_reached') {
          // Handle device limit
          const tempToken = errorData.temp_token;
          useAuthStore.getState().setTempToken(tempToken);
          toast.error('Device limit reached. Please manage your devices.');
          router.push('/devices');
          return;
      }
      toast.error(err.response?.data?.message || 'Invalid phone or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-slate-400">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
          <input
            type="tel"
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <Link href="/forgot-password" className="text-sm text-primary hover:text-cyan-400 transition-colors">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        <button
          type="submit"
          {...focusProps}
          disabled={loading}
          className={`${focusProps.className} ${isFocused ? 'ring-4 ring-white scale-105 shadow-xl' : ''}`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" size={20} />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-400">
        Don't have an account?{' '}
        <Link href="/register" className="text-primary hover:text-cyan-400 font-medium transition-colors">
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
