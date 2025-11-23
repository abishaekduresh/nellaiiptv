'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await api.post('/customers/forgot-password', { email });
      
      if (response.data.status) {
        setStatus('success');
        setMessage('Password reset instructions have been sent to your email.');
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Failed to send reset email.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
          <p className="text-slate-400">Enter your email to reset your password</p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-6 py-8 rounded-lg text-center">
            <p className="mb-4">{message}</p>
            <p className="text-sm text-slate-400">
              Check your email inbox and spam folder.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
