'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

const isDev = process.env.NEXT_PUBLIC_APP_ENV === 'development';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [debug, setDebug] = useState<Record<string, any> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setMessage('');
    setDebug(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (isDev && data.debug) setDebug(data.debug);

      if (data.status) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to send reset email.');
      }
    } catch {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
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
          <p className="text-slate-400">Enter your email to receive a reset link</p>
        </div>

        {status === 'success' ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-6 py-8 rounded-lg text-center space-y-3">
              <Mail size={36} className="mx-auto" />
              <p className="font-medium">{message}</p>
              <p className="text-sm text-slate-400">
                The link expires in <strong className="text-slate-300">10 minutes</strong>. Check your spam folder if you don't see it.
              </p>
            </div>
            {isDev && debug && (
              <div className="bg-slate-800 border border-yellow-500/40 rounded-lg p-4">
                <p className="text-xs font-mono text-yellow-400 mb-2">DEV — debug info</p>
                <pre className="text-xs text-slate-300 whitespace-pre-wrap break-all">{JSON.stringify(debug, null, 2)}</pre>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {status === 'error' && (
              <div className="space-y-2">
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {message}
                </div>
                {isDev && debug && (
                  <div className="bg-slate-800 border border-yellow-500/40 rounded-lg p-4">
                    <p className="text-xs font-mono text-yellow-400 mb-2">DEV — debug info</p>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap break-all">{JSON.stringify(debug, null, 2)}</pre>
                  </div>
                )}
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
