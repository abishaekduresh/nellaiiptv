'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [debug, setDebug] = useState<Record<string, any> | null>(null);
  const isDev = process.env.NEXT_PUBLIC_APP_ENV === 'development';

  // No token in URL
  if (!token) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-8 rounded-lg text-center space-y-3">
        <XCircle size={36} className="mx-auto" />
        <p className="font-medium">Invalid or missing reset link.</p>
        <Link href="/forgot-password" className="inline-block text-sm text-primary hover:text-cyan-400 transition-colors">
          Request a new reset link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');
    setDebug(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (isDev && data.debug) setDebug(data.debug);

      if (data.status) {
        setStatus('success');
        setMessage(data.message);
        setTimeout(() => router.push('/login'), 2500);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to reset password.');
      }
    } catch {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-6 py-8 rounded-lg text-center space-y-3">
        <CheckCircle size={36} className="mx-auto" />
        <p className="font-medium">{message}</p>
        <p className="text-sm text-slate-400">Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === 'error' && (
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {message}
          </div>
          {message.includes('expired') && (
            <div className="text-center mt-2">
              <Link href="/forgot-password" className="inline-block w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors border border-slate-700">
                Back to Forgot Password
              </Link>
            </div>
          )}
          {isDev && debug && (
            <div className="bg-slate-800 border border-yellow-500/40 rounded-lg p-4">
              <p className="text-xs font-mono text-yellow-400 mb-2">DEV — debug info</p>
              <pre className="text-xs text-slate-300 whitespace-pre-wrap break-all">{JSON.stringify(debug, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 pr-11 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            required
            minLength={8}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 pr-11 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="mt-1.5 text-xs text-red-400">Passwords do not match</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin mr-2" size={20} />
            Updating...
          </>
        ) : (
          'Set New Password'
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <Link
          href="/login"
          className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Login
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Set New Password</h1>
          <p className="text-slate-400">Choose a strong password for your account</p>
        </div>

        <Suspense fallback={<div className="text-slate-400 text-center">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
