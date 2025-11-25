'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function DisclaimerModal({ isOpen, onClose }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-800">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Disclaimer</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4 text-slate-300">
          <p>
            Welcome to Nellai IPTV. By accessing and using this service, you agree to the following terms:
          </p>
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Content Disclaimer</h3>
            <p>NELLAI IPTV is a platform that aggregates and provides access to publicly available IPTV streams. We do not host, own, or control any of the content broadcasted through the channels available on our platform. All content is the sole responsibility of the respective channel owners or content providers.<br/>
              <br/>NELLAI IPTV does not assume any responsibility or liability for any copyrighted materials, infringement claims, or legal issues arising from the content streamed by third-party channels. Users and content owners are advised to ensure compliance with applicable copyright laws in their respective jurisdictions.<br/>
              <br/>By using our service, you acknowledge and agree that NELLAI IPTV is not responsible for the legality, accuracy, or nature of the content provided by third-party sources.</p>
            
            {/* <h3 className="text-lg font-semibold text-white">Age Restriction</h3>
            <p>This service is intended for users aged 18 and above. By proceeding, you confirm that you are of legal age.</p>
            
            <h3 className="text-lg font-semibold text-white">Copyright Notice</h3>
            <p>All trademarks and copyrights belong to their respective owners. If you believe any content infringes on your copyright, please contact us immediately.</p> */}
            
            <h3 className="text-lg font-semibold text-white">Service Availability</h3>
            <p>We strive to provide uninterrupted service but cannot guarantee 100% uptime. Channels may be temporarily unavailable due to maintenance or technical issues.</p>
          </div>
          
          <button
            onClick={onClose}
            className="w-full bg-primary hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium transition-colors mt-6"
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
}
