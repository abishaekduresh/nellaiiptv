'use client';

import Link from 'next/link';
import { Play, Shield, Tv, Zap, Globe, Heart, Star, Users } from 'lucide-react';
import { useTVFocus } from '@/hooks/useTVFocus';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import api from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();

  /* Redirect if Open Access is Enabled */
  useEffect(() => {
      api.get('/settings/public').then(res => {
          if (res.data.status && res.data.data.is_open_access && !user) {
              router.push('/channels');
          }
      }).catch(() => {});
  }, [user, router]);

  const { focusProps: watchFocus, isFocused: isWatchFocused } = useTVFocus({
    onEnter: () => router.push('/channels'),
    className: "w-full sm:w-auto px-8 py-4 bg-primary hover:bg-cyan-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 group outline-none"
  });

  const { focusProps: registerFocus, isFocused: isRegisterFocused } = useTVFocus({
    onEnter: () => router.push('/register'),
    className: "w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white rounded-xl font-bold text-lg transition-all outline-none"
  });

  const { focusProps: trialFocus, isFocused: isTrialFocused } = useTVFocus({
    onEnter: () => router.push('/channels'),
    className: "inline-flex items-center gap-3 px-10 py-5 bg-primary hover:bg-cyan-600 text-white rounded-2xl font-black text-xl shadow-2xl shadow-primary/40 transition-all hover:-translate-y-1 outline-none"
  });

  return (
    <div className="bg-slate-950 text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-32 px-4">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full opacity-30"></div>
        </div>
        
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold mb-6 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              LIVE & ON-DEMAND
          </div>
          <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
            Nellai <span className="text-primary italic">IPTV</span> <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
               Premium Tamil Live Channels
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl mb-10 leading-relaxed">
            Experience the best of Tamil entertainment. Watch 200+ high-quality live TV channels, 
            exclusive movies, and local Tamil news 24/7 across all your devices.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              {...watchFocus}
              className={`${watchFocus.className} ${isWatchFocused ? 'ring-4 ring-white shadow-primary/40 scale-105' : ''}`}
            >
              <Play size={22} fill="currentColor" className="group-hover:scale-110 transition-transform" />
              Watch Now
            </button>
            {!user && (
              <button 
                {...registerFocus}
                className={`${registerFocus.className} ${isRegisterFocused ? 'ring-4 ring-white bg-slate-800 scale-105' : ''}`}
              >
                Create Account
              </button>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <a
              href="https://play.google.com/store/apps/details?id=com.nellaiiptv"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/assets/icons/get_it_on_google_playstore.webp"
                alt="Get it on Google Play"
                className="h-12 w-auto hover:opacity-80 transition-opacity"
              />
            </a>
          </div>

          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-slate-500 opacity-60">
              <div className="flex items-center gap-2"><Tv size={18} /> HD Quality</div>
              <div className="flex items-center gap-2"><Shield size={18} /> Ad-Free Option</div>
              <div className="flex items-center gap-2"><Globe size={18} /> Global Access</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-900/40 border-y border-slate-900">
        <div className="container-custom">
           <div className="text-center mb-16">
              <h2 className="text-primary font-bold text-sm tracking-[0.2em] uppercase mb-3">Why Choose Us</h2>
              <h3 className="text-3xl md:text-4xl font-bold">The Ultimate Streaming Experience</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  icon: Zap, 
                  title: "Fast Streaming", 
                  desc: "Optimized server architecture for buffer-free playback even on low bandwidth networks." 
                },
                { 
                  icon: Heart, 
                  title: "Favorite Channels", 
                  desc: "Save your preferred channels and access them instantly with our personalized dashboard." 
                },
                { 
                  icon: Star, 
                  title: "Crystal Clear HD", 
                  desc: "Watch your favorite shows in crisp high definition quality across web, android, and TV." 
                },
                { 
                  icon: Users, 
                  title: "Community Driven", 
                  desc: "Participate in channel ratings and comments to help others discover quality content." 
                },
                { 
                  icon: Globe, 
                  title: "Multiple Platforms", 
                  desc: "Native support for Android, iOS, Windows, and Smart TVs for a unified experience." 
                },
                { 
                  icon: Tv, 
                  title: "Local News", 
                  desc: "Stay updated with dedicated regional and local news channels from across Tamil Nadu." 
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-primary/30 hover:bg-slate-900 transition-all group">
                   <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                      <feature.icon size={24} />
                   </div>
                   <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
                   <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Universal Player Promo Section */}
      <section className="py-20 px-4">
        <div className="container-custom">
          <div className="rounded-3xl border border-slate-800 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
            <div className="grid md:grid-cols-2">

              {/* Left — text */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-bold mb-5 w-fit">
                  FREE TOOL
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                  Universal<br />
                  <span className="text-primary">Stream Player</span>
                </h2>
                <p className="text-slate-400 leading-relaxed mb-6 text-sm md:text-base">
                  Test any HLS, DASH, or MP4 stream directly in your browser — no install, no sign-up.
                  Paste a URL and hit play. Supports live streams, adaptive quality, and real-time stats.
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {['HLS (.m3u8)', 'DASH (.mpd)', 'MP4 / WebM', 'Live Streams', 'ABR Quality'].map(t => (
                    <span key={t} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-300 text-xs font-medium">{t}</span>
                  ))}
                </div>
                <Link
                  href="/player"
                  className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded-xl transition-colors w-fit text-sm"
                >
                  <Play size={16} fill="currentColor" />
                  Open Player
                </Link>
              </div>

              {/* Right — mock player */}
              <div className="relative min-h-[280px] md:min-h-0 bg-black border-t md:border-t-0 md:border-l border-slate-800 flex flex-col overflow-hidden">
                {/* Fake video area */}
                <div className="flex-1 flex items-center justify-center relative bg-gradient-to-br from-slate-900 to-black">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.07)_0%,transparent_70%)]" />
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center z-10">
                    <Play size={26} className="text-white ml-1" fill="currentColor" />
                  </div>
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded text-[10px] font-bold">HLS</span>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-600 rounded text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  {/* Stats badge */}
                  <div className="absolute top-3 right-3 bg-black/70 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[10px] font-mono space-y-0.5">
                    <div className="flex gap-3 justify-between"><span className="text-slate-400">Resolution</span><span className="text-green-400">1920×1080</span></div>
                    <div className="flex gap-3 justify-between"><span className="text-slate-400">Buffer</span><span className="text-green-400">12.4s</span></div>
                    <div className="flex gap-3 justify-between"><span className="text-slate-400">Bandwidth</span><span className="text-green-400">4,250 kbps</span></div>
                  </div>
                </div>
                {/* Fake controls */}
                <div className="px-4 pb-3 pt-2 bg-black/90 flex flex-col gap-2">
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full w-2/5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-slate-800" />
                    <div className="w-5 h-5 rounded bg-slate-800" />
                    <div className="w-5 h-5 rounded bg-slate-800" />
                    <div className="h-1 w-14 bg-slate-800 rounded" />
                    <div className="flex-1" />
                    <div className="w-14 h-5 rounded bg-slate-800" />
                    <div className="w-16 h-5 rounded bg-slate-800" />
                    <div className="w-5 h-5 rounded bg-slate-800" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* About SEO Section */}
      <section className="py-20 px-4">
        <div className="container-custom max-w-4xl">
           <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-8 md:p-12 border border-slate-800 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full"></div>
              
              <h2 className="text-3xl font-bold mb-6">About Nellai IPTV</h2>
              <div className="space-y-4 text-slate-300 leading-relaxed text-lg">
                <p>
                  Nellai IPTV is the premier digital streaming service specifically tailored for the Tamil-speaking audience globally. 
                  Our mission is to bring high-quality Tamil television, news, and entertainment to every home without the complexity of traditional cable.
                </p>
                <p>
                  Whether you are looking for <strong>Tamil Live TV</strong>, spiritual channels, local district news, or high-energy Tamil movies, 
                  our platform provides a seamless <strong>IPTV</strong> experience. We specialize in <strong>Nellai News</strong>, <strong>Tamil Nadu Local Channels</strong>, 
                  and a curated list of international Tamil media.
                </p>
                <p>
                  With advanced features like <strong>Video on Demand</strong>, <strong>TV Guide</strong>, and multi-device synchronization, 
                  Nellai IPTV ensures you never miss a moment of your favorite content. Join thousands of users who trust us for their daily dose of Tamil culture and entertainment.
                </p>
              </div>
              
              <div className="mt-10 flex flex-wrap gap-2">
                 {['Tamil Live TV', 'Nellai IPTV', 'Streaming HD', 'Malayalam Channels', 'Telugu TV', 'Live News', 'OTT Tamil'].map(tag => (
                   <span key={tag} className="px-3 py-1 bg-slate-800 text-slate-400 rounded-md text-xs font-medium border border-slate-700">#{tag}</span>
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* CTA Section */}
      {/*!user && (
        <section className="py-20 bg-primary/5">
          <div className="container-custom text-center">
              <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">
                 Ready to start watching?
              </h2>
              <button 
                {...trialFocus}
                className={`${trialFocus.className} ${isTrialFocused ? 'ring-4 ring-white shadow-primary/60 scale-105 -translate-y-1' : ''}`}
              >
                Start Free Trial
                <Zap size={24} fill="currentColor" />
              </button>
              <p className="mt-6 text-slate-500 text-sm">No credit card required for initial access</p>
          </div>
        </section>
      )*/}
    </div>
  )
}
