"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Play,
  Shield,
  Tv,
  Zap,
  Globe,
  Heart,
  Star,
  Users,
  ChevronRight,
  CheckCircle,
  Radio,
} from "lucide-react";
import { useTVFocus } from "@/hooks/useTVFocus";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";

function useCountUp(
  target: number,
  duration: number = 2000,
  started: boolean = false
) {
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

export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { ref: statsRef, inView: statsInView } = useInView(0.25);
  const { ref: featuresRef, inView: featuresInView } = useInView(0.1);
  const { ref: appRef, inView: appInView } = useInView(0.15);
  const { ref: ctaRef, inView: ctaInView } = useInView(0.2);

  const channelCount = useCountUp(200, 1800, statsInView);
  const userCount = useCountUp(1000, 2000, statsInView);
  const uptimeCount = useCountUp(99, 1500, statsInView);

  useEffect(() => {
    api
      .get("/settings/public")
      .then((res) => {
        if (res.data.status && res.data.data.is_open_access && !user) {
          router.push("/channels");
        }
      })
      .catch(() => {});
  }, [user, router]);

  const { focusProps: watchFocus, isFocused: isWatchFocused } = useTVFocus({
    onEnter: () => router.push("/channels"),
    className:
      "w-full sm:w-auto px-8 py-4 bg-primary hover:bg-cyan-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-2 group outline-none",
  });

  const { focusProps: registerFocus, isFocused: isRegisterFocused } =
    useTVFocus({
      onEnter: () => router.push("/register"),
      className:
        "w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 text-white rounded-xl font-bold text-lg transition-all duration-300 backdrop-blur-sm flex items-center justify-center gap-2 group outline-none",
    });

  const features = [
    {
      icon: Zap,
      title: "Buffer-Free Streaming",
      desc: "Optimised CDN ensures zero-buffer playback even on slow 4G networks.",
      color: "from-yellow-500/20 to-orange-500/20",
      border: "border-yellow-500/20",
      iconBg: "bg-yellow-500/10",
      iconColor: "text-yellow-400",
    },
    {
      icon: Heart,
      title: "Favourites & Watchlist",
      desc: "Save channels and jump back to your picks instantly from a personal dashboard.",
      color: "from-rose-500/20 to-pink-500/20",
      border: "border-rose-500/20",
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-400",
    },
    {
      icon: Star,
      title: "Crystal Clear HD",
      desc: "Crisp 1080p streams across web, Android TV, and Smart TV — any screen.",
      color: "from-primary/20 to-blue-500/20",
      border: "border-primary/20",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      icon: Users,
      title: "Community Ratings",
      desc: "Rate channels and read reviews from thousands of Tamil viewers worldwide.",
      color: "from-purple-500/20 to-indigo-500/20",
      border: "border-purple-500/20",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-400",
    },
    {
      icon: Globe,
      title: "Multi-Platform",
      desc: "Native support for Android TV, Fire Stick, iOS, and all modern browsers.",
      color: "from-green-500/20 to-emerald-500/20",
      border: "border-green-500/20",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-400",
    },
    {
      icon: Tv,
      title: "Local Tamil News",
      desc: "Dedicated district-level and regional news channels from across Tamil Nadu 24/7.",
      color: "from-cyan-500/20 to-sky-500/20",
      border: "border-cyan-500/20",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
    },
  ];

  return (
    <div className="bg-slate-950 text-white overflow-hidden">
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-[100svh] flex items-center pt-20 pb-20 px-4">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="hero-orb-1 absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/15 blur-[130px] rounded-full" />
          <div className="hero-orb-2 absolute bottom-1/4 right-1/4 w-[380px] h-[380px] bg-purple-600/10 blur-[100px] rounded-full" />
          <div className="hero-grid absolute inset-0" />
        </div>

        <div className="container-custom relative z-10 text-center w-full">
          <div className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/25 rounded-full text-primary text-xs font-bold mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              LIVE · STREAMING NOW
            </div>
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 tracking-tight leading-[1.05] animate-fade-up"
            style={{ animationDelay: "0.15s" }}
          >
            <span className="block">
              Nellai <span className="text-primary italic">IPTV</span>
            </span>
            <span className="block mt-1 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Premium Tamil Channels
            </span>
          </h1>

          <p
            className="max-w-xl mx-auto text-slate-400 text-base sm:text-lg md:text-xl mb-10 leading-relaxed animate-fade-up"
            style={{ animationDelay: "0.25s" }}
          >
            Watch 200+ high-quality Tamil live TV channels, movies, and local
            news 24/7 — on any device, anywhere in the world.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up"
            style={{ animationDelay: "0.35s" }}
          >
            <button
              {...watchFocus}
              className={`w-full sm:w-auto px-8 py-4 bg-primary hover:bg-cyan-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-2 group outline-none hover:scale-105 hover:-translate-y-0.5 ${
                isWatchFocused ? "ring-4 ring-white scale-105" : ""
              }`}
            >
              <Play
                size={20}
                fill="currentColor"
                className="group-hover:scale-110 transition-transform"
              />
              Watch Now — Free
            </button>
            {!user && (
              <button
                {...registerFocus}
                className={`w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 text-white rounded-xl font-bold text-lg transition-all duration-300 backdrop-blur-sm flex items-center justify-center gap-2 group outline-none hover:scale-105 hover:-translate-y-0.5 ${
                  isRegisterFocused ? "ring-4 ring-white scale-105" : ""
                }`}
              >
                Create Account
                <ChevronRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            )}
          </div>

          <div
            className="mt-12 flex flex-wrap justify-center items-center gap-3 sm:gap-5 animate-fade-up"
            style={{ animationDelay: "0.45s" }}
          >
            {[
              { icon: Tv, label: "HD Quality" },
              { icon: Shield, label: "Ad-Free Option" },
              { icon: Globe, label: "Global Access" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/[0.07] text-slate-400 text-sm"
              >
                <Icon size={14} />
                <span>{label}</span>
              </div>
            ))}
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
                value: channelCount,
                suffix: "+",
                label: "Live Channels",
                icon: Tv,
              },
              {
                value: userCount,
                suffix: "+",
                label: "Active Viewers",
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

      {/* ─── Features ─────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div ref={featuresRef} className="container-custom">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold tracking-widest uppercase mb-5">
              Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
              The Ultimate Tamil <br className="hidden md:block" />
              <span className="text-primary">Streaming Experience</span>
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-base md:text-lg">
              Everything you need for uninterrupted, high-quality viewing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="relative p-7 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm overflow-hidden group cursor-default transition-all duration-500 hover:border-slate-700 hover:shadow-2xl hover:-translate-y-1"
                style={{
                  opacity: featuresInView ? 1 : 0,
                  transform: featuresInView
                    ? "translateY(0)"
                    : "translateY(36px)",
                  transitionDelay: `${i * 80}ms`,
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

      {/* ─── Streaming Services Promo ─────────────────────── */}
      <section className="py-20 px-4">
        <div className="container-custom">
          <div className="relative rounded-3xl overflow-hidden border border-yellow-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 blur-[100px] rounded-full" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/8 blur-[80px] rounded-full" />
            </div>
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left — text */}
              <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-5">
                  <div className="px-2.5 py-1 bg-yellow-500 text-black text-[10px] font-black rounded-lg uppercase tracking-wide">
                    SPECIAL OFFER
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-[10px] font-bold uppercase tracking-wide">Live Broadcasting</span>
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                  Nellai IPTV{" "}
                  <span className="text-primary italic">Stream</span>
                  <br />
                  <span className="text-2xl md:text-3xl text-slate-300 font-bold">
                    Professional RTMP & SRT Hosting
                  </span>
                </h2>
                <p className="text-slate-400 leading-relaxed mb-6 text-sm md:text-base max-w-md">
                  Launch your own live stream channel with dedicated servers, HLS delivery,
                  free domain & SSL. Full self-control from our dashboard and app.
                </p>
                <div className="flex flex-wrap gap-2 mb-7">
                  {["RTMP Ingest", "SRT Support", "HLS Delivery", "Full HD", "Free Domain & SSL"].map((t) => (
                    <span key={t} className="px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-full text-slate-300 text-xs font-medium">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/stream"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-cyan-500 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 group text-sm"
                  >
                    <Radio size={15} />
                    Explore Plans
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <span className="text-slate-400 text-sm">
                    Starts at <strong className="text-white">₹499/month</strong>
                  </span>
                </div>
              </div>

              {/* Right — pricing strip */}
              <div className="relative z-10 p-8 md:p-12 border-t md:border-t-0 md:border-l border-slate-800/60 flex flex-col justify-center gap-4">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Annual Packages</p>
                {[
                  { bw: "4 TB", price: "₹8,999", period: "/year", color: "border-primary/30 bg-primary/5" },
                  { bw: "8 TB", price: "₹12,999", period: "/year", color: "border-yellow-500/30 bg-yellow-500/5" },
                  { bw: "16 TB", price: "₹19,999", period: "/year", color: "border-purple-500/20 bg-purple-500/5" },
                ].map(({ bw, price, period, color }) => (
                  <div key={bw} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${color} group cursor-default`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-primary/60" />
                      <span className="text-white font-bold text-sm">{bw} Bandwidth</span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-white font-black text-lg">{price}</span>
                      <span className="text-slate-500 text-xs">{period}</span>
                    </div>
                  </div>
                ))}
                <p className="text-slate-600 text-xs mt-1">Dedicated server · Unlimited viewers · Free domain & SSL</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Universal Player Promo ────────────────────────── */}
      <section className="py-20 px-4 bg-slate-900/30 border-y border-slate-800/60">
        <div className="container-custom">
          <div className="rounded-3xl border border-slate-800 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl">
            <div className="grid md:grid-cols-2">
              {/* Text side */}
              <div className="p-8 md:p-14 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-bold mb-6 w-fit">
                  FREE TOOL · NO SIGN-UP
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                  Universal
                  <br />
                  <span className="text-primary">Stream Player</span>
                </h2>
                <p className="text-slate-400 leading-relaxed mb-6 text-sm md:text-base">
                  Paste any HLS, DASH, or MP4 URL and play instantly in your
                  browser. Supports live streams, adaptive bitrate, and
                  real-time stats.
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {[
                    "HLS (.m3u8)",
                    "DASH (.mpd)",
                    "MP4 / WebM",
                    "Live Streams",
                    "ABR Quality",
                  ].map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-300 text-xs font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <Link
                  href="/player"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-cyan-500 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 w-fit hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 group"
                >
                  <Play size={16} fill="currentColor" />
                  Open Player
                  <ChevronRight
                    size={15}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </div>

              {/* Mock player side */}
              <div className="relative min-h-[280px] md:min-h-0 bg-black border-t md:border-t-0 md:border-l border-slate-800 flex flex-col overflow-hidden">
                <div className="flex-1 flex items-center justify-center relative bg-gradient-to-br from-slate-900 to-black">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.07)_0%,transparent_70%)]" />
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center z-10">
                    <Play
                      size={26}
                      className="text-white ml-1"
                      fill="currentColor"
                    />
                  </div>
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded text-[10px] font-bold">
                      HLS
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-600 rounded text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/70 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[10px] font-mono space-y-0.5">
                    <div className="flex gap-3 justify-between">
                      <span className="text-slate-400">Resolution</span>
                      <span className="text-green-400">1920×1080</span>
                    </div>
                    <div className="flex gap-3 justify-between">
                      <span className="text-slate-400">Buffer</span>
                      <span className="text-green-400">12.4s</span>
                    </div>
                    <div className="flex gap-3 justify-between">
                      <span className="text-slate-400">Bandwidth</span>
                      <span className="text-green-400">4,250 kbps</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-3 pt-2 bg-black/90 flex flex-col gap-2">
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-2/5" />
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

      {/* ─── App Download ─────────────────────────────────── */}
      <section className="py-24 px-4">
        <div ref={appRef} className="container-custom">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
            {/* Text */}
            <div
              className="flex-1 text-center md:text-left transition-all duration-700"
              style={{
                opacity: appInView ? 1 : 0,
                transform: appInView ? "translateX(0)" : "translateX(-32px)",
              }}
            >
              <span className="inline-block px-4 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-bold tracking-widest uppercase mb-5">
                Mobile App
              </span>
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                Watch on the <span className="text-primary">Go</span>
              </h2>
              <p className="text-slate-400 mb-6 leading-relaxed max-w-lg mx-auto md:mx-0">
                Download the Nellai IPTV Android app for a native TV experience
                with background playback, PiP mode, and remote-control support.
              </p>
              <ul className="space-y-2.5 mb-8 text-slate-300 text-sm inline-block text-left">
                {[
                  "Background Playback",
                  "Picture-in-Picture Mode",
                  "TV Remote Support",
                  "Offline Favourites",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle
                      size={15}
                      className="text-green-400 shrink-0"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://play.google.com/store/apps/details?id=com.nellaiiptv"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-all duration-300 hover:-translate-y-1 hover:opacity-90"
              >
                <Image
                  src="/assets/icons/get_it_on_google_playstore.webp"
                  alt="Get it on Google Play"
                  width={180}
                  height={54}
                  className="h-14 w-auto"
                />
              </a>
            </div>

            {/* Phone mockup */}
            <div
              className="flex-1 flex justify-center md:justify-end transition-all duration-700"
              style={{
                opacity: appInView ? 1 : 0,
                transform: appInView ? "translateX(0)" : "translateX(32px)",
                transitionDelay: "150ms",
              }}
            >
              <div className="relative w-52 sm:w-60">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-110" />
                <div className="relative bg-slate-900 border border-slate-700 rounded-[2.5rem] p-3 shadow-2xl phone-float">
                  <div className="bg-black rounded-[2rem] overflow-hidden aspect-[9/16] flex flex-col">
                    <div className="bg-slate-950 px-3 py-2.5 flex items-center gap-2 border-b border-slate-800">
                      <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                        <Tv size={12} className="text-primary" />
                      </div>
                      <span className="text-white text-xs font-bold">
                        Nellai IPTV
                      </span>
                      <div className="ml-auto flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-slate-600" />
                        <div className="w-1 h-1 rounded-full bg-slate-600" />
                        <div className="w-1 h-1 rounded-full bg-slate-600" />
                      </div>
                    </div>
                    <div className="flex-1 bg-gradient-to-b from-slate-900 to-slate-950 p-2 space-y-1.5 overflow-hidden">
                      {[
                        { color: "bg-red-500", label: "Duresh TV" },
                        { color: "bg-blue-500", label: "PDP TV" },
                        { color: "bg-yellow-500", label: "SMS TV" },
                        { color: "bg-green-500", label: "Apple TV" },
                        { color: "bg-purple-500", label: "Thendral TV" },
                      ].map(({ color, label }) => (
                        <div
                          key={label}
                          className="flex items-center gap-2 p-2 bg-slate-800/60 rounded-xl"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center`}
                          >
                            <div
                              className={`w-3 h-3 rounded-sm ${color} opacity-80`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-bold text-white truncate">
                              {label}
                            </div>
                            <div className="text-[8px] text-slate-500">
                              HD · Live
                            </div>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                    <div className="bg-slate-950 px-3 py-2 flex justify-around border-t border-slate-800">
                      {[Tv, Heart, Globe, Users].map((Icon, i) => (
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

      {/* ─── About SEO ────────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-900/30 border-t border-slate-800/60">
        <div className="container-custom max-w-4xl">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-8 md:p-14 border border-slate-800 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black mb-6">
                About Nellai IPTV
              </h2>
              <div className="space-y-4 text-slate-300 leading-relaxed text-base md:text-lg">
                <p>
                  Nellai IPTV is the premier digital streaming service for
                  Tamil-speaking audiences worldwide. Our mission: bring
                  high-quality Tamil television, news, and entertainment to
                  every home — without the complexity of traditional cable.
                </p>
                <p>
                  Looking for{" "}
                  <strong className="text-white">Tamil Live TV</strong>,
                  spiritual channels, district news, or Tamil movies? Our
                  platform delivers a seamless{" "}
                  <strong className="text-white">IPTV</strong> experience,
                  specialising in{" "}
                  <strong className="text-white">Nellai News</strong>,{" "}
                  <strong className="text-white">
                    Tamil Nadu Local Channels
                  </strong>
                  , and curated international Tamil media.
                </p>
                <p>
                  With <strong className="text-white">Video on Demand</strong>,
                  a live TV guide, and multi-device sync, you&apos;ll never miss
                  a moment of your favourite content. Join tens of thousands of
                  viewers who trust Nellai IPTV for their daily Tamil culture
                  fix.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  "Tamil Live TV",
                  "Nellai IPTV",
                  "Streaming HD",
                  "Malayalam Channels",
                  "Telugu TV",
                  "Live News",
                  "OTT Tamil",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-medium border border-slate-700 hover:border-primary/30 hover:text-slate-300 transition-colors cursor-default"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────── */}
      {!user && (
        <section className="py-24 px-4">
          <div ref={ctaRef} className="container-custom max-w-3xl text-center">
            <div
              className="relative rounded-3xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-slate-900 to-purple-900/10 p-10 md:p-16 shadow-2xl transition-all duration-700"
              style={{
                opacity: ctaInView ? 1 : 0,
                transform: ctaInView ? "translateY(0)" : "translateY(32px)",
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 leading-tight">
                  Ready to Start Watching?
                </h2>
                <p className="text-slate-400 mb-8 text-base md:text-lg max-w-md mx-auto">
                  Create a free account and get instant access to 200+ live
                  channels today.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-cyan-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 group"
                  >
                    Get Started Free
                    <ChevronRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                  <Link
                    href="/channels"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300 group"
                  >
                    <Play size={16} fill="currentColor" />
                    Browse Channels
                  </Link>
                </div>
                <p className="mt-6 text-slate-500 text-sm">
                  No credit card required · Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
