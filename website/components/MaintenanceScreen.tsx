import { AlertTriangle } from 'lucide-react';

interface MaintenanceScreenProps {
  title?: string;
  message?: string;
}

export default function MaintenanceScreen({ 
  title = "Under Maintenance", 
  message = "We are currently upgrading our system. Please check back later." 
}: MaintenanceScreenProps) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 z-[9999]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-yellow-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">
          {title}
        </h1>
        
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
          {message}
        </p>

        <div className="text-xs text-slate-600">
           Administrator Access Only
        </div>
        
        {/* Optional: Hidden or subtle login link for admins if needed */}
      </div>
    </div>
  );
}
