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
import { useWatchHistory } from '@/hooks/useWatchHistory';

import { useViewMode } from '@/context/ViewModeContext';
import ClassicHome from '@/components/ClassicHome';

  export default function Home() {
  const { mode } = useViewMode();
  const { favorites } = useFavorites(); // Get favorites
  const { history } = useWatchHistory();
  
  const [featuredChannels, setFeaturedChannels] = useState<Channel[]>([]);
  const [allChannels, setAllChannels] = useState<Channel[]>([]); // Shuffled for OTT
  const [favoriteChannels, setFavoriteChannels] = useState<Channel[]>([]); // Favorites list
  const [rawChannels, setRawChannels] = useState<Channel[]>([]); // Sorted for Classic
  const [channelsByLanguage, setChannelsByLanguage] = useState<Record<string, Channel[]>>({});
  const [loading, setLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  
  const [topTrending, setTopTrending] = useState<Channel[]>([]);

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

  const fetchChannels = async () => {
    try {
      setLoading(true);
      
      const [featuredRes, allRes, settingsRes] = await Promise.all([
        api.get('/channels/featured?limit=10'),
        api.get('/channels?limit=-1'),
        api.get('/settings/public')
      ]);

      // Check Top Trending Permission (Default to true if setting missing)
      const platformsStr = settingsRes.data.status ? (settingsRes.data.data.top_trending_platforms || 'web,android,ios,tv') : 'web,android,ios,tv';
      // If it comes as array (from previous plan step) vs string. The Controller implementation returns ARRAY now.
      // Wait, Controller returns array. Frontend API.ts generic response format?
      // "top_trending_platforms" => $trendingPlatforms (array) in PHP.
      // So checking logic:
      const platforms = Array.isArray(platformsStr) ? platformsStr : (typeof platformsStr === 'string' ? platformsStr.split(',') : []);
      const showTrending = platforms.includes('web');

      if (showTrending) {
          const topRes = await api.get('/channels?sort=top_trending&limit=10');
          if (topRes.data.status) {
             setTopTrending(topRes.data.data.data || topRes.data.data || []);
          }
      } else {
          setTopTrending([]);
      }

      if (featuredRes.data.status) {
        setFeaturedChannels(featuredRes.data.data || []);
      }

      if (allRes.data.status) {
        let channels = allRes.data.data.data || allRes.data.data || [];
        // Sort by channel number
        channels.sort((a: Channel, b: Channel) => (a.channel_number || 9999) - (b.channel_number || 9999));
        setRawChannels(channels);

        // For OTT: Filter out featured from main list to avoid duplication if desired, 
        // but typically rows reuse content. We will keep them.
        setAllChannels(channels);
        
        // Group channels by language
        const grouped = channels.reduce((acc: Record<string, Channel[]>, channel: Channel) => {
          const lang = channel.language?.name || 'Other';
          if (!acc[lang]) acc[lang] = [];
          acc[lang].push(channel);
          return acc;
        }, {});
        
        // Sort keys to prioritize Tamil, Malayalam, etc.
        const priority = ['Tamil', 'Malayalam', 'Telugu', 'English'];
        const sortedGrouped: Record<string, Channel[]> = {};
        
        priority.forEach(lang => {
             if (grouped[lang]) {
                 sortedGrouped[lang] = grouped[lang];
                 delete grouped[lang];
             }
        });
        // Add others sorted alphabetically
        Object.keys(grouped).sort().forEach(key => {
            sortedGrouped[key] = grouped[key];
        });
        
        setChannelsByLanguage(sortedGrouped);
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

  // Render Classic Mode if selected
  if (mode === 'Classic') {
    return (
        <div className="min-h-screen bg-slate-950">
            <DisclaimerModal isOpen={showDisclaimer} onClose={handleDisclaimerClose} />
            <ClassicHome channels={rawChannels} topTrending={topTrending} />
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

        {/* Recently Watched */}
        {history.length > 0 && (
           <ChannelRow 
             title="Continue Watching" 
             channels={history
                 .map(h => rawChannels.find(c => c.uuid === h.uuid))
                 .filter((c): c is Channel => !!c)} 
           />
        )}

        {/* Top Trending Channels */}
        {topTrending.length > 0 && (
          <ChannelRow 
            title="Top Trending Channels" 
            channels={topTrending
              .map(t => rawChannels.find(c => c.uuid === t.uuid) || t)
              .sort((a, b) => (b.viewers_count || 0) - (a.viewers_count || 0))
            } 
          />
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
