'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Channel } from '@/types';

interface Props {
  channels: Channel[];
}

export default function HeroBanner({ channels }: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (channels.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % channels.length);
    }, 10000); // Auto-advance every 10 seconds

    return () => clearInterval(interval);
  }, [channels.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + channels.length) % channels.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % channels.length);
  };

  if (!channels || channels.length === 0) return null;

  const featuredChannel = channels[currentIndex];

  return (
    <div className="relative h-[70vh] md:h-[80vh] w-full overflow-hidden group">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${featuredChannel.thumbnail_url})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-transparent" />
      </div>

      {/* Navigation Arrows */}
      {channels.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Content */}
      <div className="relative h-full flex items-end pb-32 md:pb-40">
        <div className="container-custom">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-md text-sm font-semibold">
                Featured
              </span>
              {featuredChannel.language && (
                <span className="text-slate-300 text-sm">
                  {featuredChannel.language.name}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl">
              {featuredChannel.name}
            </h1>
            <p className="text-lg md:text-xl text-slate-200 line-clamp-3">
              Watch {featuredChannel.name} live. Premium entertainment streaming in HD quality.
            </p>
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => router.push(`/channel/${featuredChannel.uuid}`)}
                className="flex items-center gap-2 bg-white hover:bg-white/90 text-black px-8 py-3 rounded-md font-semibold text-lg transition-all transform hover:scale-105"
              >
                <Play size={24} fill="currentColor" />
                Play Now
              </button>
              {/* <button
                onClick={() => router.push(`/channel/${featuredChannel.uuid}`)}
                className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-white px-6 py-3 rounded-md font-semibold transition-all backdrop-blur-sm"
              >
                <Info size={20} />
                More Info
              </button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Dots */}
      {channels.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {channels.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-8' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}

      {/* Fade to content */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
    </div>
  );
}
