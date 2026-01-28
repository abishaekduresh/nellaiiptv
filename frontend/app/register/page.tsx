'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTVFocus } from '@/hooks/useTVFocus';

export default function RegisterPage() {
  const router = useRouter();
  const { token, setAuth } = useAuthStore((state) => ({ token: state.token, setAuth: state.setAuth }));
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: 0 });
  const [userCaptcha, setUserCaptcha] = useState('');

  useEffect(() => {
    if (token) {
      router.push('/');
    }
  }, [token, router]);

  const { focusProps, isFocused } = useTVFocus({
      className: "w-full bg-primary hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center mt-6 disabled:opacity-50 disabled:cursor-not-allowed",
      focusClassName: "ring-4 ring-white scale-105 shadow-xl"
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1, num2, answer: num1 + num2 });
    setUserCaptcha('');
  };

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Name validation
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    
    // Phone validation (exactly 10 digits)
    if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Captcha validation
    if (parseInt(userCaptcha) !== captcha.answer) {
      newErrors.captcha = 'Incorrect verification code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
        toast.error('Please fix the errors in the form');
        return;
    }

    setLoading(true);

    try {
      const response = await api.post('/customers/register', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        // Send captcha details mostly for logging/verification if needed, 
        // effectively we trust the frontend captcha for this simple implementation
        // or we could send the numbers and answer to backend for double check but stateless 
        // backend would need signed tokens. For now, frontend gatekeeping is sufficient 
        // as per the request scope, unless we want to implement sessions.
      });

      if (response.data.status) {
        // Auto-login functionality
        if (response.data.data && response.data.data.token) {
           const { token, user } = response.data.data;
           setAuth(token, user, false);
           toast.success('Account created! Welcome to Nellai IPTV.');
           router.push('/');
        } else {
            // Fallback if no token returned (though service is defined to return it)
            toast.success('Registration successful! Please sign in.');
            router.push('/login');
        }
      } else {
        toast.error(response.data.message || 'Registration failed');
        generateCaptcha(); // Regenerate on failure
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'An error occurred during registration');
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400">Join Nellai IPTV today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  className={`w-full bg-slate-800 border ${errors.name ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  className={`w-full bg-slate-800 border ${errors.email ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
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
                      className={`w-full bg-slate-800 border ${errors.captcha ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary`}
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
                  {errors.captcha && <p className="text-red-500 text-xs mt-1">{errors.captcha}</p>}
               </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  className={`w-full bg-slate-800 border ${errors.phone ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                  placeholder="10-digit number"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // Only allow numbers
                    if (val.length <= 10) setFormData({ ...formData, phone: val });
                  }}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  className={`w-full bg-slate-800 border ${errors.password ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                <input
                  type="password"
                  className={`w-full bg-slate-800 border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
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
                Creating Account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-cyan-400 font-medium transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
