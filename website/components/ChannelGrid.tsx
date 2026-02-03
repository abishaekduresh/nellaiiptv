'use client';

import { Channel } from '@/types';
import ChannelCard from './ChannelCard';

interface ChannelGridProps {
  channels: Channel[];
  isLoading?: boolean;
  showOverallViewers?: boolean;
}

const ChannelGrid = ({ channels, isLoading = false, showOverallViewers = false }: ChannelGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-slate-800 rounded-lg aspect-video animate-pulse" />
        ))}
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-lg">No channels found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {channels.map((channel) => (
        <ChannelCard key={channel.uuid} channel={channel} showOverallViewers={showOverallViewers} />
      ))}
    </div>
  );
};

export default ChannelGrid;
