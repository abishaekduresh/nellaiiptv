'use client';

import Link from 'next/link';
import { useViewMode } from '@/context/ViewModeContext';

import { usePathname } from 'next/navigation';

const Footer = () => {
  const { mode } = useViewMode();
  const pathname = usePathname();

  if (mode === 'Classic' || pathname?.startsWith('/lite')) return null;

  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold text-primary mb-4">Nellai IPTV</h3>
            <p className="text-slate-400 mb-4 max-w-md">
              Experience the best in Tamil entertainment with Nellai IPTV. 
              Stream your favorite channels in high quality, anytime, anywhere.
            </p>
            <div className="flex space-x-4">
              {/* Social Media Icons could go here */}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/channels" className="hover:text-primary transition-colors">Channels</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Nellai IPTV. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
