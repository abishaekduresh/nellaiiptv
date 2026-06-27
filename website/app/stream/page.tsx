"use client";

import Link from "next/link";
import {
  Radio,
  Zap,
  Shield,
  Globe,
  Monitor,
  Smartphone,
  RefreshCw,
  Users,
  BarChart3,
  Server,
  Lock,
  CheckCircle,
  ChevronRight,
  Play,
  Activity,
  Wifi,
  HardDrive,
  Star,
  ArrowRight,
  Eye,
  RotateCcw,
  TrendingUp,
  Layers,
  Phone,
  Mail,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCountUp(target: number, duration = 2000, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, started]);
  return count;
}

const monthlyPlans = [
  {
    name: "Basic",
    price: "499",
    highlight: null,
    color: "from-cyan-500/20 to-blue-500/20",
    border: "border-cyan-500/30",
    features: [
      "RTMP & SRT Ingest",
      "HLS Delivery",
      "Full HD 1080p",
      "3 Concurrent Viewers",
      "Basic Analytics",
      "Free Subdomain & SSL",
      "24/7 Support",
    ],
  },
  {
    name: "Standard",
    price: "799",
    highlight: null,
    color: "from-primary/20 to-cyan-600/20",
    border: "border-primary/30",
    features: [
      "RTMP & SRT Ingest",
      "HLS Delivery",
      "Full HD 1080p",
      "7 Concurrent Viewers",
      "Real-time Analytics",
      "Free Subdomain & SSL",
      "Stream Dashboard",
      "24/7 Support",
    ],
  },
  {
    name: "Pro",
    price: "999",
    highlight: "Popular",
    color: "from-yellow-500/20 to-orange-500/20",
    border: "border-yellow-500/40",
    features: [
      "RTMP & SRT Ingest",
      "HLS Delivery",
      "Full HD 1080p",
      "10 Concurrent Viewers",
      "Advanced Analytics",
      "Free Subdomain & SSL",
      "Stream Dashboard",
      "App Control Panel",
      "24/7 Priority Support",
    ],
  },
  {
    name: "Business",
    price: "1999",
    highlight: null,
    color: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/30",
    features: [
      "RTMP & SRT Ingest",
      "HLS Delivery",
      "Full HD 1080p",
      "21 Concurrent Viewers",
      "Advanced Analytics",
      "Free Subdomain & SSL",
      "Stream Dashboard",
      "App Control Panel",
      "Custom Branding",
      "24/7 Priority Support",
    ],
  },
];

const yearlyPlans = [
  {
    name: "Annual Basic",
    // bandwidth: "4 TB / Year",
    price: "10999",
    highlight: null,
    color: "from-primary/20 to-cyan-600/20",
    border: "border-primary/40",
    features: [
      "1 RTMP & SRT Ingest",
      "HLS(.m3u8), RTMP & SRT Delivery",
      "Full HD Stream",
      "Dedicated Server",
      "100Mbps NIC Port",
      "Unlimited Viewers*",
      "Stream Dashboard",
    ],
  },
  {
    name: "Annual Pro",
    // bandwidth: "8 TB / Year",
    price: "20999",
    highlight: "Most Popular",
    color: "from-yellow-500/20 to-orange-500/20",
    border: "border-yellow-500/40",
    features: [
      "Everything in Annual Basic",
      "2 RTMP & SRT Ingest",
      "Free Domain & SSL",
      "Advanced Analytics",
      "Real-time Analytics",
      "Priority CDN Routing*",
      "Dedicated Support",
    ],
  },
  {
    name: "Annual Business",
    // bandwidth: "16 TB / Year",
    price: "28999",
    highlight: null,
    color: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/30",
    features: [
      "Everything in Annual Pro",
      "3 RTMP & SRT Ingest",
      "200Mbps NIC Port",
      "SLA Guarantee",
      "Dedicated Support",
    ],
  },
];

const dashboardFeatures = [
  {
    icon: Eye,
    label: "Live Viewer Count",
    desc: "See exactly who's watching in real-time",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    icon: RotateCcw,
    label: "Restart Stream",
    desc: "One-click restart without losing viewers",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  {
    icon: Activity,
    label: "Health Monitoring",
    desc: "Live bitrate, FPS & connection health",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  {
    icon: BarChart3,
    label: "Analytics Dashboard",
    desc: "Detailed graphs on viewership & bandwidth",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    icon: Smartphone,
    label: "App Control",
    desc: "Manage everything from our Android app",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  {
    icon: TrendingUp,
    label: "Bandwidth Usage",
    desc: "Track usage with visual progress meters",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
];

const streamFeatures = [
  {
    icon: Radio,
    title: "RTMP & SRT Ingest",
    desc: "Broadcast from OBS, vMix, Wirecast or any encoder using industry-standard RTMP and low-latency SRT protocols.",
    color: "from-cyan-500/20 to-blue-500/20",
    border: "border-cyan-500/20",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
  },
  {
    icon: Zap,
    title: "HLS Delivery",
    desc: "Adaptive bitrate HLS playback delivers your stream to millions with buffer-free viewing on any device.",
    color: "from-yellow-500/20 to-orange-500/20",
    border: "border-yellow-500/20",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
  },
  {
    icon: Shield,
    title: "Free Domain & SSL",
    desc: "Every plan includes a free subdomain and SSL certificate — your stream is always secure and professional.",
    color: "from-green-500/20 to-emerald-500/20",
    border: "border-green-500/20",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-400",
  },
  {
    icon: Server,
    title: "Dedicated Servers",
    desc: "High-performance streaming servers with 99.9% uptime SLA and dedicated bandwidth — no sharing, no throttling.",
    color: "from-primary/20 to-blue-500/20",
    border: "border-primary/20",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Monitor,
    title: "Full HD Streaming",
    desc: "Crystal clear 1080p Full HD streams with support for high bitrate content and smooth playback.",
    color: "from-purple-500/20 to-indigo-500/20",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
  },
  {
    icon: Layers,
    title: "Multi-Protocol Support",
    desc: "Receive via RTMP/SRT and deliver via HLS, DASH, or direct RTMP — complete flexibility for any workflow.",
    color: "from-rose-500/20 to-pink-500/20",
    border: "border-rose-500/20",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
  },
];

export default function StreamPage() {
  const { ref: statsRef, inView: statsInView } = useInView(0.25);
  const { ref: featuresRef, inView: featuresInView } = useInView(0.1);
  const { ref: plansRef, inView: plansInView } = useInView(0.05);
  const { ref: dashRef, inView: dashInView } = useInView(0.1);
  const { ref: ctaRef, inView: ctaInView } = useInView(0.2);

  const streamCount = useCountUp(500, 1800, statsInView);
  const uptimeCount = useCountUp(99, 1500, statsInView);
  const clientCount = useCountUp(200, 2000, statsInView);

  const [activeMonthlyIdx, setActiveMonthlyIdx] = useState(2);
  const [activeYearlyIdx, setActiveYearlyIdx] = useState(1);
  const [viewerCount] = useState(1247);
  const [bitrateVal] = useState(4250);

  return (
    <div className="bg-slate-950 text-white overflow-hidden">
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-[100svh] flex items-center pt-20 pb-20 px-4">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="hero-orb-1 absolute top-1/4 left-1/5 w-[600px] h-[600px] bg-cyan-500/12 blur-[140px] rounded-full" />
          <div className="hero-orb-2 absolute bottom-1/3 right-1/5 w-[450px] h-[450px] bg-yellow-500/8 blur-[120px] rounded-full" />
          <div className="absolute top-2/3 left-2/3 w-[300px] h-[300px] bg-purple-600/8 blur-[100px] rounded-full" />
          <div className="hero-grid absolute inset-0" />
        </div>

        <div className="container-custom relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — text */}
            <div>
              <div
                className="animate-fade-up"
                style={{ animationDelay: "0.05s" }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-full text-yellow-400 text-xs font-black mb-6 uppercase tracking-wider">
                  <Star size={12} fill="currentColor" />
                  Special Offer — Live Now
                </div>
              </div>

              <h1
                className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight leading-[1.05] animate-fade-up"
                style={{ animationDelay: "0.12s" }}
              >
                <span className="block text-white">Nellai IPTV</span>
                <span className="block mt-1 text-primary italic">Stream</span>
                <span className="block mt-1 text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-400">
                  Professional Broadcasting
                </span>
              </h1>

              <p
                className="text-slate-400 text-base sm:text-lg mb-8 leading-relaxed max-w-lg animate-fade-up"
                style={{ animationDelay: "0.22s" }}
              >
                Broadcast live with{" "}
                <strong className="text-white">RTMP & SRT ingest</strong> and{" "}
                <strong className="text-white">HLS delivery</strong>. Full HD
                streaming with dedicated servers, free domain & SSL — and
                complete self-control from our dashboard & app.
              </p>

              <div
                className="flex flex-wrap gap-3 mb-10 animate-fade-up"
                style={{ animationDelay: "0.30s" }}
              >
                {[
                  {
                    label: "RTMP Ingest",
                    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5",
                  },
                  {
                    label: "SRT Support",
                    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5",
                  },
                  {
                    label: "HLS Delivery",
                    color:
                      "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
                  },
                  {
                    label: "Full HD",
                    color: "text-green-400 border-green-500/30 bg-green-500/5",
                  },
                  {
                    label: "Free SSL",
                    color:
                      "text-purple-400 border-purple-500/30 bg-purple-500/5",
                  },
                ].map((t) => (
                  <span
                    key={t.label}
                    className={`px-3 py-1 border rounded-full text-xs font-bold ${t.color}`}
                  >
                    {t.label}
                  </span>
                ))}
              </div>

              <div
                className="flex flex-col sm:flex-row gap-4 animate-fade-up"
                style={{ animationDelay: "0.38s" }}
              >
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-cyan-500 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-xl shadow-primary/30 hover:scale-105 hover:-translate-y-0.5 group"
                >
                  <Radio size={18} />
                  Get Started — ₹499/mo
                  <ChevronRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
                <Link
                  href="#plans"
                  className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
                >
                  View Plans
                </Link>
              </div>

              {/* Special offer strip */}
              <div
                className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 animate-fade-up"
                style={{ animationDelay: "0.46s" }}
              >
                <div className="flex items-start gap-3">
                  <div className="px-2.5 py-1 bg-yellow-500 text-black text-[10px] font-black rounded-lg shrink-0 leading-tight uppercase tracking-wide">
                    SPECIAL OFFER
                  </div>
                  <div>
                    <p className="text-yellow-300 font-bold text-sm mb-1">
                      Dedicated Streaming Servers available at just ₹8,999/year!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — animated stream dashboard mockup */}
            <div
              className="relative animate-fade-up hidden lg:block"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-90" />
              <div className="relative bg-slate-900/80 border border-slate-700/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">
                {/* Dashboard header */}
                <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-slate-400 text-xs font-mono">
                    nellaiiptv.com
                  </span>
                  <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-green-500/15 border border-green-500/30 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-[10px] font-bold">
                      LIVE
                    </span>
                  </div>
                </div>

                {/* Stream preview area */}
                <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-black flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.08)_0%,transparent_70%)]" />
                  {/* Animated waveform */}
                  <div className="flex items-end gap-[3px] h-12 opacity-40">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-primary rounded-full"
                        style={{
                          height: `${
                            20 + Math.sin(i * 0.7) * 15 + Math.cos(i * 1.3) * 10
                          }px`,
                          animation: `pulse ${
                            0.8 + (i % 5) * 0.15
                          }s ease-in-out infinite alternate`,
                          animationDelay: `${i * 0.04}s`,
                        }}
                      />
                    ))}
                  </div>
                  {/* Overlays */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-0.5 bg-red-600 rounded text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      REC
                    </span>
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded text-[10px] font-bold">
                      HLS
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px] font-bold">
                      1080p
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/70 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[10px] font-mono space-y-0.5">
                    <div className="flex gap-3 justify-between">
                      <span className="text-slate-400">Bitrate</span>
                      <span className="text-green-400">
                        {bitrateVal.toLocaleString()} kbps
                      </span>
                    </div>
                    <div className="flex gap-3 justify-between">
                      <span className="text-slate-400">FPS</span>
                      <span className="text-green-400">30</span>
                    </div>
                    <div className="flex gap-3 justify-between">
                      <span className="text-slate-400">Latency</span>
                      <span className="text-green-400">1.2s</span>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 divide-x divide-slate-800 border-t border-slate-800">
                  {[
                    {
                      label: "Viewers",
                      value: viewerCount.toLocaleString(),
                      icon: Users,
                      color: "text-cyan-400",
                    },
                    {
                      label: "Uptime",
                      value: "4h 23m",
                      icon: Activity,
                      color: "text-green-400",
                    },
                    {
                      label: "Bandwidth",
                      value: "2.1 TB",
                      icon: HardDrive,
                      color: "text-yellow-400",
                    },
                    {
                      label: "CDN",
                      value: "Online",
                      icon: Wifi,
                      color: "text-purple-400",
                    },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="px-4 py-3 text-center">
                      <Icon size={14} className={`${color} mx-auto mb-1`} />
                      <div className="text-white text-sm font-bold tabular-nums">
                        {value}
                      </div>
                      <div className="text-slate-500 text-[9px] uppercase tracking-wide">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="px-5 py-3 border-t border-slate-800 flex items-center gap-3">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg text-xs font-bold hover:bg-yellow-500/20 transition-colors">
                    <RotateCcw size={12} />
                    Restart
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors">
                    <BarChart3 size={12} />
                    Analytics
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors">
                    <Lock size={12} />
                    Settings
                  </button>
                  <div className="ml-auto text-[10px] text-slate-500 font-mono">
                    www.nellaiiptv.com
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────── */}
      <div
        ref={statsRef}
        className="border-y border-slate-800/60 bg-slate-900/30"
      >
        <div className="container-custom py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                value: streamCount,
                suffix: "+",
                label: "Streams Hosted",
                icon: Radio,
              },
              {
                value: clientCount,
                suffix: "+",
                label: "Active Clients",
                icon: Users,
              },
              {
                value: uptimeCount,
                suffix: "%",
                label: "Uptime SLA",
                icon: Zap,
              },
              { value: 24, suffix: "/7", label: "Support", icon: Shield },
            ].map(({ value, suffix, label, icon: Icon }, i) => (
              <div
                key={i}
                className="text-center p-5 sm:p-6 rounded-2xl bg-slate-900/50 border border-slate-800 transition-all duration-700"
                style={{
                  opacity: statsInView ? 1 : 0,
                  transform: statsInView ? "translateY(0)" : "translateY(28px)",
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                <Icon
                  size={20}
                  className="text-primary mx-auto mb-3 opacity-60"
                />
                <div className="text-3xl sm:text-4xl font-black tabular-nums">
                  {value}
                  {suffix}
                </div>
                <div className="text-slate-400 text-xs sm:text-sm mt-1.5">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Stream Features ──────────────────────────────── */}
      <section className="py-24 px-4">
        <div ref={featuresRef} className="container-custom">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold tracking-widest uppercase mb-5">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
              Everything You Need to <br className="hidden md:block" />
              <span className="text-primary">Stream Professionally</span>
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-base md:text-lg">
              High-performance infrastructure built for reliable, scalable live
              streaming.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {streamFeatures.map((f, i) => (
              <div
                key={i}
                className="relative p-7 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm overflow-hidden group cursor-default transition-all duration-500 hover:border-slate-700 hover:shadow-2xl hover:-translate-y-1"
                style={{
                  opacity: featuresInView ? 1 : 0,
                  transform: featuresInView
                    ? "translateY(0)"
                    : "translateY(36px)",
                  transitionDelay: `${i * 80}ms`,
                  transition:
                    "opacity 0.6s ease, transform 0.6s ease, border-color 0.3s, box-shadow 0.3s",
                }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}
                />
                <div className="relative z-10">
                  <div
                    className={`w-12 h-12 rounded-xl ${f.iconBg} border ${f.border} flex items-center justify-center ${f.iconColor} mb-5 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <f.icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Self-Control Dashboard ───────────────────────── */}
      <section className="py-24 px-4 bg-slate-900/30 border-y border-slate-800/60">
        <div ref={dashRef} className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — info */}
            <div
              className="transition-all duration-700"
              style={{
                opacity: dashInView ? 1 : 0,
                transform: dashInView ? "translateX(0)" : "translateX(-32px)",
              }}
            >
              <span className="inline-block px-4 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-bold tracking-widest uppercase mb-6">
                Self-Control
              </span>
              <h2 className="text-3xl md:text-4xl font-black mb-5 leading-tight">
                Full Control of Your{" "}
                <span className="text-primary">Stream</span>
                <br />
                From Anywhere
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8 text-sm md:text-base">
                Monitor, manage and restart your streams directly from our web
                dashboard or our Android app — no need to contact support for
                simple operations. You&apos;re in full control, 24/7.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dashboardFeatures.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
                    style={{
                      opacity: dashInView ? 1 : 0,
                      transform: dashInView
                        ? "translateY(0)"
                        : "translateY(20px)",
                      transition:
                        "opacity 0.5s ease, transform 0.5s ease, border-color 0.3s",
                      transitionDelay: `${i * 70 + 200}ms`,
                    }}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg ${f.bg} border ${f.border} flex items-center justify-center shrink-0 ${f.color}`}
                    >
                      <f.icon size={16} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold mb-0.5">
                        {f.label}
                      </p>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — app mockup */}
            <div
              className="flex justify-center lg:justify-end transition-all duration-700"
              style={{
                opacity: dashInView ? 1 : 0,
                transform: dashInView ? "translateX(0)" : "translateX(32px)",
                transitionDelay: "150ms",
              }}
            >
              <div className="relative w-60 sm:w-72">
                <div className="absolute inset-0 bg-cyan-500/15 blur-3xl rounded-full scale-110" />
                <div className="relative bg-slate-900 border border-slate-700 rounded-[2.5rem] p-3 shadow-2xl phone-float">
                  <div className="bg-black rounded-[2rem] overflow-hidden aspect-[9/16] flex flex-col">
                    {/* App header */}
                    <div className="bg-slate-950 px-3 py-2.5 flex items-center gap-2 border-b border-slate-800">
                      <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                        <Radio size={12} className="text-primary" />
                      </div>
                      <span className="text-white text-xs font-bold">
                        Nellai Stream
                      </span>
                      <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-green-500/15 border border-green-500/30 rounded-full">
                        <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400 text-[8px] font-bold">
                          LIVE
                        </span>
                      </div>
                    </div>

                    {/* App content */}
                    <div className="flex-1 bg-gradient-to-b from-slate-900 to-slate-950 p-3 space-y-2.5 overflow-hidden">
                      {/* Viewer card */}
                      <div className="bg-slate-800/60 rounded-xl p-2.5">
                        <div className="flex items-center gap-2 mb-2">
                          <Users size={11} className="text-cyan-400" />
                          <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wide">
                            Live Viewers
                          </span>
                        </div>
                        <div className="text-2xl font-black text-white tabular-nums">
                          1,247
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp size={9} className="text-green-400" />
                          <span className="text-green-400 text-[9px]">
                            +12% from yesterday
                          </span>
                        </div>
                      </div>

                      {/* Health card */}
                      <div className="bg-slate-800/60 rounded-xl p-2.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wide">
                            Stream Health
                          </span>
                          <span className="text-green-400 text-[9px] font-bold">
                            Excellent
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {[
                            { label: "Bitrate", val: "4,250 kbps", pct: 72 },
                            { label: "FPS", val: "30/30", pct: 100 },
                            { label: "Buffer", val: "1.2s", pct: 90 },
                          ].map((item) => (
                            <div key={item.label}>
                              <div className="flex justify-between text-[8px] mb-0.5">
                                <span className="text-slate-500">
                                  {item.label}
                                </span>
                                <span className="text-slate-300 font-mono">
                                  {item.val}
                                </span>
                              </div>
                              <div className="h-1 bg-slate-700 rounded-full">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${item.pct}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button className="flex items-center justify-center gap-1.5 py-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 rounded-xl text-[9px] font-bold">
                          <RotateCcw size={10} />
                          Restart
                        </button>
                        <button className="flex items-center justify-center gap-1.5 py-2 bg-primary/15 border border-primary/30 text-primary rounded-xl text-[9px] font-bold">
                          <BarChart3 size={10} />
                          Analytics
                        </button>
                      </div>

                      {/* Uptime */}
                      <div className="flex items-center gap-2 bg-slate-800/40 rounded-xl px-2.5 py-2">
                        <Activity
                          size={10}
                          className="text-green-400 shrink-0"
                        />
                        <div className="flex-1">
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">
                            Uptime
                          </div>
                          <div className="text-white text-[10px] font-bold">
                            4h 23m 15s
                          </div>
                        </div>
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      </div>
                    </div>

                    {/* App nav */}
                    <div className="bg-slate-950 px-3 py-2 flex justify-around border-t border-slate-800">
                      {[Radio, BarChart3, Monitor, Users].map((Icon, i) => (
                        <div
                          key={i}
                          className={`p-1.5 rounded-lg ${
                            i === 0
                              ? "bg-primary/20 text-primary"
                              : "text-slate-600"
                          }`}
                        >
                          <Icon size={14} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing Plans ────────────────────────────────── */}
      <section id="plans" className="py-24 px-4">
        <div ref={plansRef} className="container-custom">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-xs font-bold tracking-widest uppercase mb-5">
              Special Offer
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
              Choose Your <span className="text-primary">Streaming Plan</span>
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-base md:text-lg">
              Flexible monthly billing or save big with annual bandwidth
              packages.
            </p>
          </div>

          {/* ── Monthly Plans ── */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Radio size={15} className="text-cyan-400" />
                </div>
                <h3 className="text-xl font-black text-white">Monthly Plans</h3>
              </div>
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wide shrink-0">
                Starts ₹499/mo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {monthlyPlans.map((plan, i) => (
                <div
                  key={i}
                  onClick={() => setActiveMonthlyIdx(i)}
                  className={`relative flex flex-col p-6 rounded-2xl border cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${
                    activeMonthlyIdx === i
                      ? `bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 ${plan.border} shadow-xl`
                      : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                  }`}
                  style={{
                    opacity: plansInView ? 1 : 0,
                    transform: plansInView
                      ? "translateY(0)"
                      : "translateY(36px)",
                    transitionDelay: `${i * 80}ms`,
                    transition:
                      "opacity 0.6s ease, transform 0.6s ease, border-color 0.3s, box-shadow 0.3s",
                  }}
                >
                  {activeMonthlyIdx === i && (
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${plan.color} opacity-25 pointer-events-none`}
                    />
                  )}

                  {plan.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                      {plan.highlight}
                    </div>
                  )}

                  <div className="relative z-10 mb-5">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                      Monthly
                    </p>
                    <h3 className="text-lg font-black text-white mb-3">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">
                        ₹{parseInt(plan.price).toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-sm">/month</span>
                    </div>
                  </div>

                  <ul className="relative z-10 space-y-2 mb-6 flex-1">
                    {plan.features.map((feat, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <CheckCircle
                          size={13}
                          className="text-green-400 shrink-0 mt-0.5"
                        />
                        <span className="text-slate-300">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/contact"
                    className={`relative z-10 w-full py-3 rounded-xl font-bold text-center text-sm transition-all duration-200 flex items-center justify-center gap-2 group ${
                      activeMonthlyIdx === i
                        ? "bg-primary hover:bg-cyan-500 text-white shadow-lg shadow-primary/20"
                        : "bg-slate-800 hover:bg-slate-700 text-white"
                    }`}
                  >
                    Get Started
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* ── Yearly Plans ── */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <HardDrive size={15} className="text-yellow-400" />
                </div>
                <h3 className="text-xl font-black text-white">
                  Annual Bandwidth Packages
                </h3>
              </div>
              <div className="flex-1 h-px bg-slate-800" />
              <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-black uppercase tracking-wider rounded-full shrink-0">
                Special Offer
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {yearlyPlans.map((plan, i) => (
                <div
                  key={i}
                  onClick={() => setActiveYearlyIdx(i)}
                  className={`relative flex flex-col p-7 rounded-2xl border cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${
                    activeYearlyIdx === i
                      ? `bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 ${plan.border} shadow-xl`
                      : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                  }`}
                  style={{
                    opacity: plansInView ? 1 : 0,
                    transform: plansInView
                      ? "translateY(0)"
                      : "translateY(36px)",
                    transitionDelay: `${i * 100 + 320}ms`,
                    transition:
                      "opacity 0.6s ease, transform 0.6s ease, border-color 0.3s, box-shadow 0.3s",
                  }}
                >
                  {activeYearlyIdx === i && (
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${plan.color} opacity-25 pointer-events-none`}
                    />
                  )}

                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                      {plan.highlight}
                    </div>
                  )}

                  <div className="absolute top-4 right-4 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Special Offer
                  </div>

                  <div className="relative z-10 mb-6">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                      {/* {plan.bandwidth} */}
                    </p>
                    <h3 className="text-2xl font-black text-white mb-3">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">
                        ₹{parseInt(plan.price).toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-sm">/year</span>
                    </div>
                  </div>

                  <ul className="relative z-10 space-y-2.5 mb-7 flex-1">
                    {plan.features.map((feat, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle
                          size={14}
                          className="text-green-400 shrink-0 mt-0.5"
                        />
                        <span className="text-slate-300">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/contact"
                    className={`relative z-10 w-full py-3.5 rounded-xl font-bold text-center text-sm transition-all duration-200 flex items-center justify-center gap-2 group ${
                      activeYearlyIdx === i
                        ? "bg-primary hover:bg-cyan-500 text-white shadow-lg shadow-primary/20"
                        : "bg-slate-800 hover:bg-slate-700 text-white"
                    }`}
                  >
                    Get Started
                    <ArrowRight
                      size={15}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-900/30 border-t border-slate-800/60">
        <div className="container-custom max-w-5xl">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold tracking-widest uppercase mb-5">
              Get Started
            </span>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Stream Live in{" "}
              <span className="text-primary">3 Simple Steps</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: CheckCircle,
                title: "Choose a Plan",
                desc: "Pick a monthly or annual plan that fits your bandwidth needs. Starting at just ₹499/month.",
                color: "text-cyan-400",
                bg: "bg-cyan-500/10",
                border: "border-cyan-500/20",
              },
              {
                step: "02",
                icon: Server,
                title: "Get Your Stream Keys",
                desc: "We provision your RTMP/SRT server, stream key, and HLS endpoint instantly. Free domain + SSL included.",
                color: "text-yellow-400",
                bg: "bg-yellow-500/10",
                border: "border-yellow-500/20",
              },
              {
                step: "03",
                icon: Play,
                title: "Go Live",
                desc: "Point OBS, vMix or any encoder to your RTMP/SRT URL and start broadcasting. Monitor from your dashboard or app.",
                color: "text-green-400",
                bg: "bg-green-500/10",
                border: "border-green-500/20",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="relative p-7 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="absolute top-5 right-5 text-5xl font-black text-slate-800 leading-none select-none group-hover:text-slate-700 transition-colors">
                  {s.step}
                </div>
                <div
                  className={`w-12 h-12 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center ${s.color} mb-5`}
                >
                  <s.icon size={22} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div ref={ctaRef} className="container-custom max-w-3xl text-center">
          <div
            className="relative rounded-3xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-slate-900 to-yellow-900/10 p-10 md:p-16 shadow-2xl transition-all duration-700"
            style={{
              opacity: ctaInView ? 1 : 0,
              transform: ctaInView ? "translateY(0)" : "translateY(32px)",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-full text-yellow-400 text-xs font-black mb-6 uppercase tracking-wider">
                <Star size={12} fill="currentColor" />
                Monthly Plan Starts @₹499/-
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 leading-tight">
                Ready to Go Live?
              </h2>
              <p className="text-slate-400 mb-8 text-base md:text-lg max-w-md mx-auto">
                Professional RTMP & HLS streaming with dedicated bandwidth, full
                self-control and 24/7 support.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-cyan-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 group"
                >
                  <Radio size={18} />
                  Start Streaming Now
                  <ChevronRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="tel:+917708443543"
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-xl transition-all duration-200 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Phone size={13} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5">
                      Call Us
                    </p>
                    <p className="text-white text-sm font-bold group-hover:text-primary transition-colors">
                      +91 77084 43543
                    </p>
                  </div>
                </a>
                <a
                  href="mailto:nellaiiptv@gmail.com"
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-xl transition-all duration-200 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Mail size={13} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5">
                      Email Us
                    </p>
                    <p className="text-white text-sm font-bold group-hover:text-primary transition-colors">
                      nellaiiptv@gmail.com
                    </p>
                  </div>
                </a>
              </div>

              <p className="mt-5 text-slate-600 text-xs">
                www.nellaiiptv.com · High-Performance RTMP & HLS Streaming
                Servers
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* ─── WhatsApp Floating Button ─────────────────────── */}
      <a
        href="https://wa.me/917708443543?text=Hi%2C%20I%27m%20interested%20in%20Nellai%20IPTV%20Stream%20services.%20Please%20share%20more%20details."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 group"
        aria-label="Chat on WhatsApp"
      >
        {/* Label — slides in on hover */}
        <span className="opacity-0 group-hover:opacity-100 translate-x-3 group-hover:translate-x-0 transition-all duration-300 bg-slate-900 border border-slate-700 text-white text-sm font-semibold px-3.5 py-2 rounded-xl shadow-xl whitespace-nowrap pointer-events-none">
          Chat on WhatsApp
        </span>

        {/* Button */}
        <div className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center bg-[#25D366] hover:bg-[#20c55e] transition-colors duration-200">
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
          {/* WhatsApp SVG icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="w-7 h-7 relative z-10"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.85L.057 23.25a.75.75 0 0 0 .916.916l5.4-1.475A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.712 9.712 0 0 1-4.953-1.356l-.355-.21-3.676 1.003 .974-3.562-.23-.368A9.712 9.712 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
          </svg>
        </div>
      </a>
    </div>
  );
}
