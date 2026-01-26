import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

const Footer = () => {
  const [logoUrl, setLogoUrl] = useState('/icon.jpg');

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await api.get('/settings/public');
        if (response.data.status) {
          const logo = response.data.data.logo_url;
          if (logo) setLogoUrl(logo);
        }
      } catch (e) { /* ignore */ }
    };
    fetchLogo();
  }, []);

  return (
    <footer className="bg-slate-950 border-t border-slate-900 mt-auto relative overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="container-custom py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-6 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg group-hover:shadow-primary/50 transition-all duration-300">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tighter">
                Nellai <span className="text-primary italic">IPTV</span>
              </h3>
            </Link>
            <p className="text-slate-400 mb-8 max-w-md leading-relaxed">
              The premier digital streaming service specifically tailored for the Tamil-speaking audience globally. 
              High-quality television, news, and entertainment at your fingertips.
            </p>
            <div className="flex space-x-4">
              {/* Optional Social Icons */}
               <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all cursor-pointer">
                  <span className="text-lg">f</span>
               </div>
               <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all cursor-pointer">
                  <span className="text-lg">𝕏</span>
               </div>
               <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all cursor-pointer">
                  <span className="text-lg">ig</span>
               </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Quick Links</h4>
            <ul className="space-y-3 text-slate-400 font-medium">
              <li><Link href="/" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Home</Link></li>
              <li><Link href="/channels" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Watch TV</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Help Center</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Legal</h4>
            <ul className="space-y-3 text-slate-400 font-medium">
              <li><Link href="/privacy" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-900 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} Nellai IPTV. Premium Streaming Experience.</p>
          <div className="flex gap-6">
             <span>v2.1.0</span>
             <span>Region: International</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
