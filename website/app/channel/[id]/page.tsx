'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Channel } from '@/types';
import { Loader2 } from 'lucide-react';
import ClassicHome from '@/components/ClassicHome';
import ChannelsDisabledScreen from '@/components/ChannelsDisabledScreen';
import { isWebChannelsDisabled } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

export default function ChannelPage() {
  const params = useParams();
  const uuid = params.id as string;
  const { user } = useAuthStore();
  const router = useRouter();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [topTrending, setTopTrending] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelsDisabled, setChannelsDisabled] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, [user, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuthAndFetch = async () => {
    try {
        setLoading(true);
        // 1. Fetch Settings First
        const settingsRes = await api.get('/settings/public', { params: { _t: Date.now() } });

        // If the admin has disabled the "web" platform, show an error message.
        if (settingsRes.data.status && isWebChannelsDisabled(settingsRes.data.data)) {
            setChannelsDisabled(true);
            setLoading(false);
            return;
        }

        // Open-access model: all channels are free to watch — no subscription gating.

        // 3. Fetch Content
        const [channelsRes, trendingRes] = await Promise.all([
          api.get('/channels?limit=-1'),
          api.get('/channels?sort=top_trending&limit=10')
        ]);

        if (channelsRes.data.status) {
          const allChannels = channelsRes.data.data.data || channelsRes.data.data || [];
          // When the admin disables the "web" platform the API returns an empty
          // channel list — show the "not available on web" screen.
          if (!Array.isArray(allChannels) || allChannels.length === 0) {
            setChannelsDisabled(true);
            setLoading(false);
            return;
          }
          allChannels.sort((a: Channel, b: Channel) => (a.channel_number || 9999) - (b.channel_number || 9999));
          setChannels(allChannels);
        }

        if (trendingRes.data.status) {
          setTopTrending(trendingRes.data.data.data || trendingRes.data.data || []);
        }

    } catch (error) {
        console.error('Error fetching data for channel page:', error);
    } finally {
        setLoading(false);
    }
  };

  if (channelsDisabled) {
    return <ChannelsDisabledScreen />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <ClassicHome 
        channels={channels} 
        topTrending={topTrending} 
        initialChannelUuid={uuid}
      />
    </div>
  );
}
