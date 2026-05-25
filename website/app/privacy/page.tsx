import type { Metadata } from 'next';
import { Shield, Lock, Eye, Trash2, Bell, Mail } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Nellai IPTV',
  description: 'Read the Nellai IPTV Privacy Policy to understand how we collect, use, and protect your personal information when you use our Tamil live streaming service.',
};

export default function PrivacyPage() {
  const sections = [
    {
      icon: Eye,
      title: 'Information We Collect',
      content: 'We collect information that you provide directly to us, including:',
      list: ['Name and contact information', 'Account credentials', 'Payment information', 'Usage data and preferences'],
    },
    {
      icon: Shield,
      title: 'How We Use Your Information',
      content: 'We use the collected information for:',
      list: ['Providing and improving our services', 'Processing your transactions', 'Sending you updates and promotional content', 'Responding to your requests and inquiries'],
    },
    {
      icon: Lock,
      title: 'Data Security',
      content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
    },
    {
      icon: Bell,
      title: 'Third-Party Services',
      content: 'We may use third-party services that collect, monitor, and analyze data to improve our service functionality. These services are bound by their own privacy policies.',
    },
    {
      icon: Trash2,
      title: 'Your Rights',
      content: 'You have the right to:',
      list: ['Access your personal data', 'Request correction of your data', 'Request deletion of your data', 'Opt-out of marketing communications'],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">

      {/* Hero */}
      <div className="relative pt-16 pb-14 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 blur-[120px] rounded-full" />
        </div>
        <div className="relative z-10 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl mb-5">
            <Shield size={26} className="text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">Privacy Policy</h1>
          <p className="text-slate-400 max-w-lg mx-auto text-base md:text-lg">
            How we collect, use, and protect your personal information.
          </p>
          <p className="text-slate-600 text-sm mt-3">Last updated: May 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom max-w-3xl px-4">

        {/* Intro card */}
        <div
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-6 animate-fade-up"
          style={{ animationDelay: '0.15s' }}
        >
          <p className="text-slate-300 leading-relaxed text-base">
            At <strong className="text-white">Nellai IPTV</strong>, we respect your privacy and are committed to
            protecting your personal information. This policy explains what data we collect, why we collect it,
            and how you can control it.
          </p>
        </div>

        {/* Section cards */}
        <div className="space-y-4">
          {sections.map((s, i) => (
            <div
              key={s.title}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${0.2 + i * 0.07}s` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
                  <s.icon size={17} className="text-primary" />
                </div>
                <h2 className="text-lg font-bold text-white">{s.title}</h2>
              </div>
              <p className="text-slate-400 leading-relaxed text-sm mb-3">{s.content}</p>
              {s.list && (
                <ul className="space-y-1.5">
                  {s.list.map(item => (
                    <li key={item} className="flex items-start gap-2 text-slate-400 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Contact card */}
          <div
            className="bg-gradient-to-br from-primary/10 via-slate-900 to-slate-900 border border-primary/20 rounded-2xl p-6 animate-fade-up"
            style={{ animationDelay: `${0.2 + sections.length * 0.07}s` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
                <Mail size={17} className="text-primary" />
              </div>
              <h2 className="text-lg font-bold text-white">Questions?</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-3">
              If you have any questions about this Privacy Policy, please get in touch.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-cyan-300 transition-colors"
            >
              Visit our Contact page →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
