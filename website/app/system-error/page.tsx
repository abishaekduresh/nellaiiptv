'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AlertTriangle, ServerCrash, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

function SystemErrorContent() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('message') || 'The application cannot connect to the server or database.';

  // Check if it's likely a database error (503) or a network error
  const isDatabaseError = errorMessage.toLowerCase().includes('database') || errorMessage.toLowerCase().includes('503');

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-red-900/20 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-900/20 blur-[100px] pointer-events-none"></div>
      </div>

      <div className="relative z-10 max-w-md w-full bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 relative">
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping opacity-75"></div>
            {isDatabaseError ? (
              <ServerCrash className="w-12 h-12 text-red-500" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-red-500" />
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {isDatabaseError ? 'System Offline' : 'Connection Lost'}
        </h1>
        
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 mb-8">
          <p className="text-gray-300 text-sm leading-relaxed">
            {errorMessage}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-red-900/20"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-6 text-gray-500 text-xs font-medium z-10">
        Nellai IPTV System Status
      </div>
    </div>
  );
}

export default function SystemErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    }>
      <SystemErrorContent />
    </Suspense>
  );
}
