'use client';

import { useState } from 'react';
import { Mail, MapPin, Send, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post('/contact', formData);
      if (response.data.status) {
        toast.success(response.data.message || 'Message sent successfully!');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error(response.data.message || 'Failed to send message. Please try again.');
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
        toast.error(`Validation failed: ${errorMessages}`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contactInfo = [
    { icon: Mail,   title: 'Email',   value: 'nellaiiptv@gmail.com', delay: '0.25s' },
    { icon: MapPin, title: 'Address', value: 'Tirunelveli, Tamil Nadu, India', delay: '0.32s' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">

      {/* Hero */}
      <div className="relative pt-16 pb-14 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-primary/8 blur-[120px] rounded-full" />
        </div>
        <div className="relative z-10 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl mb-5">
            <MessageSquare size={26} className="text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">Contact Us</h1>
          <p className="text-slate-400 max-w-md mx-auto text-base md:text-lg">
            Have questions? We&apos;d love to hear from you.
          </p>
        </div>
      </div>

      <div className="container-custom max-w-5xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — info cards */}
          <div className="lg:col-span-1 space-y-4">
            {contactInfo.map(({ icon: Icon, title, value, delay }) => (
              <div
                key={title}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: delay }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1 text-sm">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{value}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Response time note */}
            <div
              className="bg-green-500/5 border border-green-500/15 rounded-2xl p-5 animate-fade-up"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-semibold">Typically replies within 24h</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                We aim to respond to all enquiries within one business day.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div
            className="lg:col-span-2 animate-fade-up"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7">
              <h2 className="text-xl font-bold text-white mb-6">Send us a message</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                      className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-slate-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email <span className="text-red-400">*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-slate-600 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Subject <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="What is this about?"
                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-slate-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Message <span className="text-red-400">*</span></label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Describe your question or issue in detail..."
                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all resize-none placeholder:text-slate-600 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 text-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    <>
                      <Send size={17} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
