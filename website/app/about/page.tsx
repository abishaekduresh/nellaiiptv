import { Tv, Target, Star, Users, Globe, Zap } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const stats = [
    { value: '200+', label: 'Live Channels' },
    { value: '24/7', label: 'Availability' },
    { value: '50k+', label: 'Viewers' },
    { value: 'HD',   label: 'Quality' },
  ];

  const offerings = [
    { icon: Tv,     text: 'Live streaming of popular Tamil channels'   },
    { icon: Star,   text: 'High-definition video quality'              },
    { icon: Zap,    text: '24/7 access to your favourite content'      },
    { icon: Globe,  text: 'Multi-device support — web, Android & TV'  },
    { icon: Users,  text: 'Community ratings and channel comments'     },
    { icon: Target, text: 'Regular content curation and updates'       },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">

      {/* Hero */}
      <div className="relative pt-16 pb-14 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/8 blur-[120px] rounded-full" />
        </div>
        <div className="relative z-10 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl mb-5">
            <Tv size={26} className="text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
            About <span className="text-primary">Nellai IPTV</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-base md:text-lg leading-relaxed">
            Your premier destination for live Tamil television streaming,
            bringing culture home to every screen.
          </p>
        </div>
      </div>

      <div className="container-custom max-w-4xl px-4 space-y-6">

        {/* Stats row */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-up"
          style={{ animationDelay: '0.15s' }}
        >
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center p-5 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
              <div className="text-2xl sm:text-3xl font-black text-primary mb-1">{value}</div>
              <div className="text-slate-400 text-xs sm:text-sm">{label}</div>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7 animate-fade-up"
          style={{ animationDelay: '0.22s' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
              <Target size={17} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold">Our Mission</h2>
          </div>
          <p className="text-slate-400 leading-relaxed">
            We are dedicated to bringing the best Tamil entertainment, news, and cultural content to viewers
            around the world. Our mission is to preserve and promote Tamil culture through accessible,
            high-quality streaming services — without the complexity of traditional cable television.
          </p>
        </div>

        {/* What we offer */}
        <div
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-7 animate-fade-up"
          style={{ animationDelay: '0.3s' }}
        >
          <h2 className="text-xl font-bold mb-5">What We Offer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {offerings.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 border border-primary/15 rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-primary" />
                </div>
                <p className="text-slate-400 text-sm leading-relaxed pt-1">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-7 animate-fade-up"
          style={{ animationDelay: '0.38s' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Users size={17} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-bold">Our Team</h2>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Nellai IPTV is powered by a dedicated team of technology professionals and content
            curators who are passionate about Tamil culture and entertainment. We continuously
            work to improve quality, add new channels, and ensure the best possible viewing experience.
          </p>
        </div>

        {/* CTA */}
        <div
          className="text-center py-2 animate-fade-up"
          style={{ animationDelay: '0.46s' }}
        >
          <p className="text-slate-500 text-sm mb-4">
            Have questions or suggestions?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            Get in Touch →
          </Link>
        </div>
      </div>
    </div>
  );
}
