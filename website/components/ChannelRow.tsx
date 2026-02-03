'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Channel } from '@/types';
import ChannelCard from './ChannelCard';

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
    <div className="relative mb-10">
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
          <div key={channel.uuid} className="flex-shrink-0 w-40 md:w-56">
            <ChannelCard channel={channel} />
          </div>
        ))}
      </div>
    </div>
  );
}
