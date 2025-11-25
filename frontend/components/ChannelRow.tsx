'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Channel } from '@/types';

interface Props {
  title: string;
  channels: Channel[];
}

export default function ChannelRow({ title, channels }: Props) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -800 : 800;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!channels || channels.length === 0) return null;

  return (
    <div className="group relative mb-10">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4 px-4 md:px-12">
        {title}
      </h2>

      {/* Scroll Buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-black/80 hover:bg-black/90 text-white p-3 rounded-r-lg transition-all hidden md:block pointer-events-auto shadow-xl"
        aria-label="Scroll left"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-black/80 hover:bg-black/90 text-white p-3 rounded-l-lg transition-all hidden md:block pointer-events-auto shadow-xl"
        aria-label="Scroll right"
      >
        <ChevronRight size={24} />
      </button>

      {/* Scrollable Row */}
      <div
        ref={scrollRef}
        className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide px-4 md:px-12 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {channels.map((channel) => (
          <div
            key={channel.uuid}
            className="flex-shrink-0 w-40 md:w-56 group/card cursor-pointer"
            onClick={() => router.push(`/channel/${channel.uuid}`)}
          >
            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 transform transition-all duration-300 group-hover/card:scale-110 group-hover/card:z-20 group-hover/card:shadow-2xl">
              <img
                src={channel.thumbnail_url}
                alt={channel.name}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button className="bg-white hover:bg-white/90 text-black rounded-full p-2 transform transition-transform hover:scale-110">
                        <Play size={16} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <h3 className="text-white text-sm font-medium mt-2 line-clamp-1 px-1">
              {channel.name}
            </h3>
            {channel.language && (
              <p className="text-slate-400 text-xs mt-1 px-1">
                {channel.language.name}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
