'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Channel } from '@/types';
import HeroBanner from '@/components/HeroBanner';
import ChannelRow from '@/components/ChannelRow';
import DisclaimerModal from '@/components/DisclaimerModal';
import AdBanner from '@/components/AdBanner';
import { Loader2 } from 'lucide-react';
import ChannelCardSkeleton from '@/components/ChannelCardSkeleton';
import { useFavorites } from '@/hooks/useFavorites';

import { useViewMode } from '@/context/ViewModeContext';
import ClassicHome from '@/components/ClassicHome';

  export default function Home() {
  const { mode } = useViewMode();
  const { favorites } = useFavorites(); // Get favorites
  
  const [featuredChannels, setFeaturedChannels] = useState<Channel[]>([]);
  const [allChannels, setAllChannels] = useState<Channel[]>([]); // Shuffled for OTT
  const [favoriteChannels, setFavoriteChannels] = useState<Channel[]>([]); // Favorites list
  const [rawChannels, setRawChannels] = useState<Channel[]>([]); // Sorted for Classic
  const [channelsByLanguage, setChannelsByLanguage] = useState<Record<string, Channel[]>>({});
  const [loading, setLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    fetchChannels();
    checkDisclaimer();
  }, []);

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

  // Shuffle array utility
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchChannels = async () => {
    try {
      setLoading(true);
      
      const [featuredRes, allRes] = await Promise.all([
        api.get('/channels/featured?limit=10'),
        api.get('/channels?limit=-1') // Fetch all channels for Classic Mode
      ]);

      if (featuredRes.data.status) {
        const featured = featuredRes.data.data || [];
        featured.sort((a: Channel, b: Channel) => (a.channel_number || 9999) - (b.channel_number || 9999));
        setFeaturedChannels(featured);
      }

      if (allRes.data.status) {
        let channels = allRes.data.data.data || allRes.data.data || [];
        
        // Sort by channel number for Consistent Raw Data
        channels.sort((a: Channel, b: Channel) => (a.channel_number || 9999) - (b.channel_number || 9999));
        setRawChannels(channels);

        // For OTT: Filter out featured and shuffle
        let ottChannels = [...channels];
        if (featuredRes.data.status && featuredRes.data.data) {
          const featuredIds = new Set(featuredRes.data.data.map((c: Channel) => c.uuid));
          ottChannels = ottChannels.filter((c: Channel) => !featuredIds.has(c.uuid));
        }

        setAllChannels(ottChannels);
        
        // Group channels by language
        const grouped = ottChannels.reduce((acc: Record<string, Channel[]>, channel: Channel) => {
          const lang = channel.language?.name || 'Other';
          if (!acc[lang]) acc[lang] = [];
          acc[lang].push(channel);
          return acc;
        }, {});

        // Sort 'Other' channels by viewers count (descending)
        if (grouped['Other']) {
          grouped['Other'].sort((a: Channel, b: Channel) => (b.viewers_count || 0) - (a.viewers_count || 0));
        }
        
        setChannelsByLanguage(grouped);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sync favorites
  useEffect(() => {
    if (rawChannels.length > 0 && favorites.length > 0) {
      const favs = rawChannels.filter(c => favorites.includes(c.uuid));
      setFavoriteChannels(favs);
    } else {
      setFavoriteChannels([]);
    }
  }, [favorites, rawChannels]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 md:px-12">
        <div className="animate-pulse space-y-8 pb-20 mt-8">
            {/* Hero Skeleton */}
            <div className="w-full aspect-[21/9] bg-slate-900 rounded-2xl mb-12"></div>
            
            {/* Rows */}
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

  // Render Classic Mode if selected
  if (mode === 'Classic') {
    return (
        <div className="min-h-screen bg-slate-950">
            <DisclaimerModal isOpen={showDisclaimer} onClose={handleDisclaimerClose} />
            <ClassicHome channels={rawChannels} />
        </div>
    )
  }

  // Render OTT Mode (Default)
  return (
    <div className="min-h-screen bg-slate-950">
      <DisclaimerModal isOpen={showDisclaimer} onClose={handleDisclaimerClose} />
      
      {/* Hero Banner */}
      {featuredChannels.length > 0 && <HeroBanner channels={featuredChannels} />}

      {/* Content Rows */}
      <div className="relative -mt-12 md:-mt-20 z-10 space-y-8 pb-20">
        {/* Favorites Row */}
        {favoriteChannels.length > 0 && (
           <ChannelRow title="My Favorites" channels={favoriteChannels} />
        )}

        {/* Featured Channels */}
        {featuredChannels.length > 0 && (
          <ChannelRow title="Featured Channels" channels={featuredChannels} />
        )}

        {/* Ad Banner */}
        <div className={mode === 'OTT' ? 'w-full mb-8' : 'px-4 md:px-12 mb-8'}>
          <AdBanner type="banner" />
        </div>

        {/* Channels by Language */}
        {Object.entries(channelsByLanguage).map(([language, channels]) => (
          <ChannelRow key={language} title={`${language} Channels`} channels={channels} />
        ))}
        {/* All Channels */}
        {allChannels.length > 0 && (
          <ChannelRow title="All Channels" channels={allChannels} />
        )}

        {/* Inline Ad */}
        <div className="px-4 md:px-12">
          <AdBanner type="inline" />
        </div>
      </div>
    </div>
  );
}
