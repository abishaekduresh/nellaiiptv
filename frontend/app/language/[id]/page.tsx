'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Channel, Language } from '@/types';
import ChannelGrid from '@/components/ChannelGrid';
import { Loader2 } from 'lucide-react';

export default function LanguagePage() {
  const params = useParams();
  const uuid = params.id as string;

  const [channels, setChannels] = useState<Channel[]>([]);
  const [language, setLanguage] = useState<Language | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uuid) {
      fetchData();
    }
  }, [uuid]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch channels for this language
      const channelsRes = await api.get(`/channels?language_uuid=${uuid}`);
      
      // Fetch all languages to find the name (optimization: backend should provide single language endpoint)
      const languagesRes = await api.get('/languages');

      if (channelsRes.data.status) {
        setChannels(channelsRes.data.data.data || channelsRes.data.data); // Handle pagination or array
      }

      if (languagesRes.data.status) {
        const found = languagesRes.data.data.find((l: Language) => l.uuid === uuid);
        if (found) setLanguage(found);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 md:px-8">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {language ? `${language.name} Channels` : 'Channels'}
          </h1>
          <p className="text-slate-400">
            Browse all available channels in this language.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : (
          <ChannelGrid channels={channels} />
        )}
      </div>
    </div>
  );
}
