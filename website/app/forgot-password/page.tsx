'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: 0 });
  const [userCaptcha, setUserCaptcha] = useState('');

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1, num2, answer: num1 + num2 });
    setUserCaptcha('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (parseInt(userCaptcha) !== captcha.answer) {
      setStatus('error');
      setMessage('Incorrect verification code. Please try again.');
      generateCaptcha();
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const res = await api.post('/customers/forgot-password', {
        email: email.trim().toLowerCase()
      });

      if (res.data.status) {
        setStatus('success');
        setMessage(res.data.message || 'Password reset link has been sent to your email.');
      } else {
        setStatus('error');
        setMessage(res.data.message || 'Failed to send reset email.');
        generateCaptcha();
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'An error occurred. Please try again.');
      generateCaptcha();
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
                The link expires in <strong className="text-slate-300">1 hour</strong>. Check your spam folder if you don't see it.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {status === 'error' && (
              <div className="space-y-2">
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {message}
                </div>
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

            {/* Captcha */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <label className="block text-sm font-medium text-slate-300 mb-2">Security Check</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded text-white font-mono text-lg border border-slate-600">
                  <span>{captcha.num1}</span>
                  <span>+</span>
                  <span>{captcha.num2}</span>
                  <span>=</span>
                </div>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="?"
                  value={userCaptcha}
                  onChange={(e) => setUserCaptcha(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={generateCaptcha}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                  title="Refresh Captcha"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
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
