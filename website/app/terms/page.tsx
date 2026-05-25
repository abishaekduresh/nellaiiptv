import type { Metadata } from 'next';
import { FileText, UserCheck, Ban, User, AlertTriangle, Scale, XCircle, RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service — Nellai IPTV',
  description: 'Read the Nellai IPTV Terms of Service. These terms govern your access to and use of our Tamil live TV streaming platform.',
};

export default function TermsPage() {
  const sections = [
    {
      icon: UserCheck,
      title: '1. Acceptance of Terms',
      content: 'By accessing and using this service, you accept and agree to be bound by the terms and conditions of this agreement. If you do not agree with any part of these terms, you may not use our service.',
    },
    {
      icon: FileText,
      title: '2. Use License',
      content: 'Permission is granted to temporarily access the content on Nellai IPTV for personal, non-commercial viewing only. This is a grant of licence, not a transfer of title.',
    },
    {
      icon: Ban,
      title: '3. Restrictions',
      content: 'You are specifically restricted from:',
      list: ['Republishing, selling, or sublicensing our content', 'Using the service in any unlawful manner', 'Engaging in any data mining or similar activities', 'Using the service to advertise or market without permission'],
    },
    {
      icon: User,
      title: '4. Account Responsibilities',
      content: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorised use.',
    },
    {
      icon: AlertTriangle,
      title: '5. Content Disclaimer',
      content: 'All content is provided by third-party sources. We do not guarantee the accuracy, completeness, or availability of any content at any given time.',
    },
    {
      icon: Scale,
      title: '6. Limitation of Liability',
      content: 'Nellai IPTV shall not be held liable for any indirect, consequential, or incidental damages arising from your use of the service, including loss of data or service interruptions.',
    },
    {
      icon: XCircle,
      title: '7. Termination',
      content: 'We reserve the right to terminate or suspend your account at any time without prior notice for conduct that we believe violates these Terms of Service or is otherwise harmful.',
    },
    {
      icon: RefreshCw,
      title: '8. Changes to Terms',
      content: 'We reserve the right to modify these terms at any time. We will notify users of significant changes. Continued use of the service after changes constitutes acceptance of the new terms.',
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
            <FileText size={26} className="text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">Terms of Service</h1>
          <p className="text-slate-400 max-w-lg mx-auto text-base md:text-lg">
            Please read these terms carefully before using Nellai IPTV.
          </p>
          <p className="text-slate-600 text-sm mt-3">Last updated: May 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom max-w-3xl px-4">

        {/* Intro */}
        <div
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-6 animate-fade-up"
          style={{ animationDelay: '0.15s' }}
        >
          <p className="text-slate-300 leading-relaxed text-base">
            These Terms of Service govern your use of the <strong className="text-white">Nellai IPTV</strong> platform.
            By using our service you agree to these terms in full. We recommend reading them carefully.
          </p>
        </div>

        {/* Terms grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {sections.map((s, i) => (
            <div
              key={s.title}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${0.2 + i * 0.06}s` }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center shrink-0">
                  <s.icon size={15} className="text-primary" />
                </div>
                <h2 className="text-sm font-bold text-white leading-tight">{s.title}</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{s.content}</p>
              {s.list && (
                <ul className="mt-2.5 space-y-1">
                  {s.list.map(item => (
                    <li key={item} className="flex items-start gap-2 text-slate-500 text-xs">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div
          className="text-center py-4 animate-fade-up"
          style={{ animationDelay: `${0.2 + sections.length * 0.06}s` }}
        >
          <p className="text-slate-600 text-sm">
            For questions about these terms,{' '}
            <a href="/contact" className="text-primary hover:text-cyan-300 transition-colors">contact us</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
