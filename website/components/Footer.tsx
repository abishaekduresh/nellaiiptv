'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tv, Mail, MessageCircle, FileText, Shield, AlertTriangle, Home, CreditCard, Info } from 'lucide-react';
import api from '@/lib/api';

const Footer = () => {
  const [logoUrl, setLogoUrl] = useState('/icon.jpg');

  useEffect(() => {
    api.get('/settings/public').then(res => {
      if (res.data.status && res.data.data.logo_url) setLogoUrl(res.data.data.logo_url);
    }).catch(() => {});
  }, []);

  const quickLinks = [
    { href: '/',         label: 'Home',       icon: Home        },
    { href: '/channels', label: 'Watch TV',   icon: Tv          },
    { href: '/plans',    label: 'Plans',      icon: CreditCard  },
    { href: '/about',    label: 'About Us',   icon: Info        },
    { href: '/contact',  label: 'Contact',    icon: Mail        },
    { href: '/feedback', label: 'Feedback',   icon: MessageCircle },
  ];

  const legalLinks = [
    { href: '/privacy',    label: 'Privacy Policy',   icon: Shield       },
    { href: '/terms',      label: 'Terms of Service', icon: FileText     },
    { href: '/disclaimer', label: 'Disclaimer',       icon: AlertTriangle },
  ];

  return (
    <footer className="relative bg-slate-950 border-t border-slate-800/60 mt-auto overflow-hidden">

      {/* Subtle top glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Background orb */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -bottom-32 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-32 right-1/4 w-[300px] h-[300px] bg-purple-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="container-custom relative z-10 pt-14 pb-8">

        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-primary/40 transition-all duration-300 shadow-lg shadow-black/30">
                <Image src={logoUrl} alt="Nellai IPTV" width={40} height={40} className="w-full h-full object-cover" unoptimized />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Nellai <span className="text-primary italic">IPTV</span>
              </h3>
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
              The premier digital streaming service for the Tamil-speaking audience worldwide —
              bringing high-quality live TV, news, and entertainment to every screen.
            </p>

            {/* Play Store Badge */}
            <a
              href="https://play.google.com/store/apps/details?id=com.nellaiiptv"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-all duration-300 hover:-translate-y-1 hover:opacity-90 mb-8"
            >
              <Image
                src="/assets/icons/get_it_on_google_playstore.webp"
                alt="Get it on Google Play"
                width={160}
                height={48}
                className="h-12 w-auto"
              />
            </a>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { label: 'Facebook', char: 'f' },
                { label: 'X / Twitter', char: '𝕏' },
                { label: 'Instagram', char: 'ig' },
              ].map(({ label, char }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-slate-800 transition-all duration-200 text-sm font-bold"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-5">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-slate-400 hover:text-primary text-sm transition-all duration-200 group"
                  >
                    <Icon size={14} className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <span className="group-hover:translate-x-0.5 transition-transform">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-5">Legal</h4>
            <ul className="space-y-2.5">
              {legalLinks.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-slate-400 hover:text-primary text-sm transition-all duration-200 group"
                  >
                    <Icon size={14} className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <span className="group-hover:translate-x-0.5 transition-transform">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Mini contact block */}
            <div className="mt-8 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
              <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wide">Need Help?</p>
              <Link
                href="/contact"
                className="text-sm text-slate-300 hover:text-primary transition-colors flex items-center gap-1.5 group"
              >
                <Mail size={13} className="shrink-0" />
                <span>Contact Support</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Nellai IPTV. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-slate-600 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              All Systems Operational
            </span>
            <span>Region: International</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
