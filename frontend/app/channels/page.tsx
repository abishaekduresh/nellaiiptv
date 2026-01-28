'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Channel } from '@/types';
import DisclaimerModal from '@/components/DisclaimerModal';
import ChannelCardSkeleton from '@/components/ChannelCardSkeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import ClassicHome from '@/components/ClassicHome';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

export default function ChannelsPage() {
  const { favorites } = useFavorites();
  const { history } = useWatchHistory();
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [rawChannels, setRawChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [topTrending, setTopTrending] = useState<Channel[]>([]);

  // Fetch Logic moved here to be accessible
  const fetchChannelsData = async (settingsData: any) => {
    try {
      // Check Top Trending Permission
      let showTrending = true;
      if (settingsData) {
         const platformsStr = settingsData.top_trending_platforms || 'web,android,ios,tv';
         const platforms = Array.isArray(platformsStr) ? platformsStr : (typeof platformsStr === 'string' ? platformsStr.split(',') : []);
         showTrending = platforms.includes('web');
      }

      // --- HEAVY DATA ---
      const [allRes, trendingRes] = await Promise.all([
        api.get('/channels?limit=-1'),
        showTrending ? api.get('/channels?sort=top_trending&limit=10') : Promise.resolve({ data: { status: false } })
      ]);

      if (trendingRes.data.status) {
          setTopTrending(trendingRes.data.data.data || trendingRes.data.data || []);
      }

      if (allRes.data.status) {
        let channels = allRes.data.data.data || allRes.data.data || [];
        channels.sort((a: Channel, b: Channel) => (a.channel_number || 9999) - (b.channel_number || 9999));
        setRawChannels(channels);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAuthAndFetch = async () => {
    try {
        setLoading(true);
        const settingsRes = await api.get('/settings/public');
        const isOpenAccess = settingsRes.data.status && settingsRes.data.data.is_open_access;
        
        // Auth Check Logic
        if (!isOpenAccess) {
            if (!user) {
                router.push('/plans?error=subscription_required');
                return;
            }
            const isReseller = (user as any).role === 'reseller';
            if (!isReseller && !(user as any).plan) {
                router.push('/plans?error=subscription_required');
                return;
            }
        }

        // If we get here, access is allowed. Fetch Channels.
        await fetchChannelsData(settingsRes.data.data);

    } catch (e) {
        console.error("Auth check failed", e);
        setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthAndFetch();
    checkDisclaimer();
  }, [user, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkDisclaimer = () => {
    if (typeof window === 'undefined') return;
    const accepted = document.cookie.includes('disclaimer_accepted=true');
    if (!accepted) {
      setShowDisclaimer(true);
    }
  };

  const handleDisclaimerClose = () => {
    setShowDisclaimer(false);
    if (typeof window !== 'undefined') {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      document.cookie = `disclaimer_accepted=true; expires=${expiryDate.toUTCString()}; path=/`;
    }
  };

  // Deprecated direct call, now used by checkAuthAndFetch
  const fetchChannels = async () => { /* no-op or proxy */ };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 md:px-12">
        <div className="animate-pulse space-y-8 pb-20 mt-8">
            <div className="w-full aspect-[21/9] bg-slate-900 rounded-2xl mb-12"></div>
            {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                    <div className="h-6 w-48 bg-slate-900 rounded"></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((j) => (
                            <ChannelCardSkeleton key={j} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-slate-950">
          <DisclaimerModal isOpen={showDisclaimer} onClose={handleDisclaimerClose} />
          <ClassicHome channels={rawChannels} topTrending={topTrending} />
      </div>
  )
}
