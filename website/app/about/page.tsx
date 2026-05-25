import type { Metadata } from 'next';
import { Tv, Target, Star, Users, Globe, Zap, Shield, Heart, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Nellai IPTV — Tamil Live TV Streaming Platform',
  description: 'Learn about Nellai IPTV — our mission to bring 200+ Tamil live TV channels, local news, and cultural content to viewers worldwide with HD quality and zero buffering.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">

      {/* Hero */}
      <div className="relative pt-16 pb-14 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/8 blur-[120px] rounded-full" />
        </div>
        <div className="relative z-10 animate-fade-up">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl mb-5">
            <Tv size={26} className="text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
            About <span className="text-primary">Nellai IPTV</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Your premier destination for live Tamil television streaming — bringing culture, news, and entertainment home to every screen, anywhere in the world.
          </p>
        </div>
      </div>

      <div className="container-custom max-w-4xl px-4 space-y-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-up">
          {[
            { value: '200+', label: 'Live Channels' },
            { value: '24/7', label: 'Availability' },
            { value: 'HD',   label: 'Stream Quality' },
            { value: 'Free', label: 'Basic Access' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center p-5 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
              <div className="text-2xl sm:text-3xl font-black text-primary mb-1">{value}</div>
              <div className="text-slate-400 text-xs sm:text-sm">{label}</div>
            </div>
          ))}
        </div>

        {/* Who We Are */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
              <Target size={17} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold">Who We Are</h2>
          </div>
          <div className="space-y-3 text-slate-400 leading-relaxed">
            <p>
              Nellai IPTV is a Tamil-focused live streaming platform built to serve the global Tamil diaspora and local viewers across Tamil Nadu. Founded with the belief that language and culture should never be limited by geography, we deliver over 200 curated live TV channels directly to your browser, smartphone, or Smart TV — no cable box required.
            </p>
            <p>
              Our platform specialises in district-level Tamil news, spiritual and devotional channels, entertainment, sports, and family programming. Whether you are in Chennai, London, Toronto, or Singapore, Nellai IPTV ensures you stay connected to your culture in real time.
            </p>
          </div>
        </div>

        {/* Our Mission */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Heart size={17} className="text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold">Our Mission</h2>
          </div>
          <div className="space-y-3 text-slate-400 leading-relaxed">
            <p>
              We are dedicated to preserving and promoting Tamil culture through accessible, high-quality streaming services. Traditional cable television has always been expensive, region-locked, and inconvenient. We built Nellai IPTV to remove those barriers.
            </p>
            <p>
              Our mission is simple: give every Tamil-speaking person on the planet a reliable, affordable, and ad-light way to watch the channels they love — in HD, with zero buffering, and available on any device they already own.
            </p>
          </div>
        </div>

        {/* What We Offer */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-7">
          <h2 className="text-xl font-bold mb-6">What We Offer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Tv,     title: 'Live Tamil Channels',        desc: 'Over 200 curated channels including news, entertainment, devotional, and regional programming broadcast live 24/7.' },
              { icon: Star,   title: 'HD & Full-HD Streams',       desc: 'Crystal-clear 1080p video quality across all devices — web browsers, Android TV, Fire Stick, and Smart TVs.' },
              { icon: Zap,    title: 'Zero-Buffer CDN',            desc: 'Our global content delivery network ensures smooth, lag-free playback even on slower 4G mobile connections.' },
              { icon: Globe,  title: 'Multi-Device Access',        desc: 'Watch on your phone, laptop, tablet, or Smart TV. One account works everywhere, with no extra fees.' },
              { icon: Users,  title: 'Community Ratings',          desc: 'Rate your favourite channels, leave reviews, and browse recommendations from thousands of Tamil viewers worldwide.' },
              { icon: Shield, title: 'Secure & Private',           desc: 'Your account and viewing data are protected with industry-standard encryption. We never sell your personal information.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                <div className="w-9 h-9 bg-primary/10 border border-primary/15 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={16} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm mb-1">{title}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Categories */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-7">
          <h2 className="text-xl font-bold mb-4">Channel Categories</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-5">
            Our channel library spans every category a Tamil viewer could need — from breaking news and political coverage to devotional content, movies, and children's programming.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Tamil News', 'District News', 'Nellai News', 'Devotional', 'Entertainment',
              'Tamil Movies', 'Sports', 'Kids & Family', 'Music', 'Regional Tamil',
              'Malayalam', 'Telugu', 'Hindi GEC', 'International Tamil',
            ].map(cat => (
              <span key={cat} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-slate-300 text-xs font-medium">
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-7">
          <h2 className="text-xl font-bold mb-6">How It Works</h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Create a Free Account', desc: 'Sign up with your email address in under 30 seconds. No credit card required for basic access.' },
              { step: '2', title: 'Browse 200+ Channels',  desc: 'Explore our full channel directory, filter by category, language, or region, and add favourites to your personal list.' },
              { step: '3', title: 'Stream Instantly',       desc: 'Click any channel to start watching live in your browser or the Nellai IPTV Android app — HD playback begins immediately.' },
              { step: '4', title: 'Upgrade for Premium',    desc: 'Unlock ad-free viewing, priority streams, and exclusive channels with an affordable monthly or annual subscription.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 font-black text-primary text-sm">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm mb-1">{title}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Our Platform */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Users size={17} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-bold">Our Platform & Technology</h2>
          </div>
          <div className="space-y-3 text-slate-400 leading-relaxed">
            <p>
              Nellai IPTV is built on modern web technology — a Next.js 14 frontend with server-side rendering for fast page loads, and a robust PHP backend API handling authentication, subscriptions, and stream management. All streams are delivered over HLS (HTTP Live Streaming), the industry standard that works natively on iOS, Android, Smart TVs, and modern web browsers.
            </p>
            <p>
              We also offer a Universal Stream Player at <Link href="/player" className="text-primary hover:underline">/player</Link> — a free browser-based tool to play any HLS, DASH, or MP4 stream URL with real-time diagnostic stats. No download or account required.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-7">
          <h2 className="text-xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {[
              {
                q: 'Is Nellai IPTV free to use?',
                a: 'Yes — basic access is completely free. You can watch a wide selection of live channels after creating a free account. Premium plans unlock additional channels, ad-free viewing, and higher quality streams.',
              },
              {
                q: 'Which devices are supported?',
                a: 'Nellai IPTV works on any modern web browser (Chrome, Firefox, Safari, Edge), Android phones and tablets via our dedicated app, Android TV, and Fire Stick. Smart TV support is available through the browser or IPTV player app.',
              },
              {
                q: 'Do I need a cable or satellite subscription?',
                a: 'No. Nellai IPTV is a standalone over-the-top (OTT) service that streams directly over your internet connection. No cable box, dish, or set-top box is needed.',
              },
              {
                q: 'Can I watch from outside India?',
                a: 'Yes. Nellai IPTV is designed for the global Tamil diaspora. Our CDN delivers streams to viewers in the UK, USA, Canada, UAE, Australia, Singapore, and worldwide.',
              },
              {
                q: 'How many channels are available?',
                a: 'We currently offer over 200 curated live channels across news, entertainment, devotional, sports, movies, kids, and regional categories. New channels are added regularly.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-slate-800/60 pb-5 last:border-0 last:pb-0">
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle size={15} className="text-primary mt-0.5 shrink-0" />
                  <p className="font-semibold text-white text-sm">{q}</p>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed pl-5">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary/10 via-slate-900 to-purple-900/10 border border-primary/20 rounded-2xl p-7 text-center">
          <h2 className="text-xl font-bold mb-2">Ready to Start Watching?</h2>
          <p className="text-slate-400 text-sm mb-5 max-w-md mx-auto">
            Join thousands of Tamil viewers worldwide. Create your free account and stream 200+ live channels instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-cyan-500 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 text-sm"
            >
              Get Started Free <ArrowRight size={14} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all text-sm"
            >
              Contact Us
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
