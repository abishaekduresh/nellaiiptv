'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Channel } from '@/types';
import { Loader2 } from 'lucide-react';
import ClassicHome from '@/components/ClassicHome';
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

  useEffect(() => {
    // Subscription Guard - bypass for resellers
    if (!user) {
        router.push('/plans?error=subscription_required');
        return;
    }
    
    // Resellers don't need a subscription plan
    const isReseller = (user as any).role === 'reseller';
    if (!isReseller && !(user as any).plan) {
        router.push('/plans?error=subscription_required');
        return;
    }

    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [channelsRes, trendingRes] = await Promise.all([
          api.get('/channels?limit=-1'),
          api.get('/channels?sort=top_trending&limit=10')
        ]);

        if (channelsRes.data.status) {
          const allChannels = channelsRes.data.data.data || channelsRes.data.data || [];
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

    fetchAllData();
  }, [user, router]);

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
