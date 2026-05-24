import { AlertTriangle, Tv, Wrench, Info } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">

      {/* Hero */}
      <div className="relative pt-16 pb-14 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/6 blur-[120px] rounded-full" />
        </div>
        <div className="relative z-10 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl mb-5">
            <AlertTriangle size={26} className="text-yellow-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">Disclaimer</h1>
          <p className="text-slate-400 max-w-lg mx-auto text-base md:text-lg">
            Please read this disclaimer carefully before using Nellai IPTV.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom max-w-3xl px-4 space-y-5">

        {/* Content disclaimer */}
        <div
          className="bg-slate-900/60 border border-yellow-500/15 rounded-2xl p-6 animate-fade-up"
          style={{ animationDelay: '0.15s' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Tv size={17} className="text-yellow-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Content Disclaimer</h2>
          </div>
          <div className="space-y-3 text-slate-400 text-sm leading-relaxed">
            <p>
              <strong className="text-white">NELLAI IPTV</strong> is a platform that aggregates and provides access to publicly
              available IPTV streams. We do not host, own, or control any of the content broadcasted through
              the channels available on our platform. All content is the sole responsibility of the respective
              channel owners or content providers.
            </p>
            <p>
              NELLAI IPTV does not assume any responsibility or liability for any copyrighted materials,
              infringement claims, or legal issues arising from the content streamed by third-party channels.
              Users and content owners are advised to ensure compliance with applicable copyright laws in
              their respective jurisdictions.
            </p>
            <p>
              By using our service, you acknowledge and agree that NELLAI IPTV is not responsible for the
              legality, accuracy, or nature of the content provided by third-party sources.
            </p>
          </div>
        </div>

        {/* Service Availability */}
        <div
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 animate-fade-up"
          style={{ animationDelay: '0.25s' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
              <Wrench size={17} className="text-primary" />
            </div>
            <h2 className="text-lg font-bold text-white">Service Availability</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            We strive to provide uninterrupted service, but we cannot guarantee 100% uptime.
            Channels may be temporarily unavailable due to:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {['Scheduled maintenance', 'Technical difficulties', 'Third-party stream issues', 'Network disruptions'].map(item => (
              <div key={item} className="flex items-center gap-2 text-slate-400 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div
          className="flex items-start gap-3 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 animate-fade-up"
          style={{ animationDelay: '0.35s' }}
        >
          <Info size={17} className="text-slate-500 shrink-0 mt-0.5" />
          <p className="text-slate-500 text-sm leading-relaxed">
            This disclaimer is subject to change. Continued use of the service after modifications
            constitutes your acceptance of the updated disclaimer.
          </p>
        </div>
      </div>
    </div>
  );
}
