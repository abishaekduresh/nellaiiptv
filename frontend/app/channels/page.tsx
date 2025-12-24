'use client';

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Channel } from "@/types";
import ChannelGrid from "@/components/ChannelGrid";
import { Loader2, Filter } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ChannelsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    }>
      <ChannelsContent />
    </Suspense>
  );
}

function ChannelsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [topChannels, setTopChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Grouping State
  const [groupBy, setGroupBy] = useState<'language' | 'category'>('language');

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        await Promise.all([
            fetchFilters(),
            fetchTopChannels(),
            fetchAllChannels()
        ]);
        setLoading(false);
    };
    init();
  }, []);

  const fetchFilters = async () => {
    try {
      const [langRes, catRes] = await Promise.all([
        api.get('/languages'),
        api.get('/categories')
      ]);

      if (langRes.data.status) setLanguages(langRes.data.data);
      if (catRes.data.status) setCategories(catRes.data.data);
    } catch (err) {
      // Error fetching filters
    }
  };

  const fetchTopChannels = async () => {
    try {
        const response = await api.get('/channels', { 
            params: { sort: 'top_trending', limit: 10 } 
        });
        if (response.data.status) {
            let fetched = response.data.data.data || response.data.data;
             if (Array.isArray(fetched)) {
                setTopChannels(fetched);
            }
        }
    } catch (err) {
        console.error("Failed to fetch top channels", err);
    }
  };

  const fetchAllChannels = async () => {
    try {
      const params: any = { limit: -1 };
      const response = await api.get('/channels', { params });
      if (response.data.status) {
        let fetchedChannels = response.data.data.data || response.data.data;
        if (Array.isArray(fetchedChannels)) {
            // Sort by channel number initially
             fetchedChannels.sort((a: any, b: any) => {
                const numA = Number(a.channel_number) || 0;
                const numB = Number(b.channel_number) || 0;
                return numA - numB;
            });
            setAllChannels(fetchedChannels);
        }
      }
    } catch (err) {
      toast.error('Error fetching channels');
    }
  };

  // Grouping Logic
  const getGroupedChannels = () => {
    const grouped: { [key: string]: Channel[] } = {};

    allChannels.forEach(channel => {
        let key = 'Others';
        
        if (groupBy === 'language') {
            if (channel.language && channel.language.name) {
                key = channel.language.name;
            }
        } else if (groupBy === 'category') {
             if (channel.category_id) { 
                 const cat = categories.find(c => c.id == channel.category_id || c.uuid === channel.category_id || c.id === (channel as any).category?.id);
                 if (cat) {
                     key = cat.name;
                 } else if ((channel as any).category?.name) {
                      key = (channel as any).category.name; 
                 }
             }
        }

        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(channel);
    });

    const languageOrder = ['Tamil', 'Malayalam', 'Telugu', 'English','Others'];
    const categoryOrder = ['Entertainment', 'Movies', 'Music', 'Kids', 'News', 'Sports', 'Others'];

    const getPriority = (key: string) => {
        let order = groupBy === 'language' ? languageOrder : categoryOrder;
        // Normalize for case-insensitive comparison
        const index = order.findIndex(o => o.toLowerCase() === key.toLowerCase());
        return index !== -1 ? index : 999; // Unknowns go to end
    };

    const keys = Object.keys(grouped).sort((a, b) => {
        const pA = getPriority(a);
        const pB = getPriority(b);
        
        if (pA !== pB) return pA - pB;
        return a.localeCompare(b);
    });

    return keys.map(key => ({
        title: key,
        channels: grouped[key]
    }));
  };

  const groupedSections = getGroupedChannels();

  return (
    <div className="min-h-screen bg-slate-950 pb-12 px-4 md:px-8">
      <div className="container-custom">
        {!loading && topChannels.length > 0 && (
            <div className="mb-12">
                 <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-primary pl-3">Top Trending Channels</h2>
                 <ChannelGrid channels={topChannels} />
            </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-800 pb-4">
             <h1 className="text-3xl font-bold text-white">Browse Channels</h1>

            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-sm pl-2">Group By:</span>
              <select 
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as 'language' | 'category')}
                className="bg-transparent text-white text-sm p-2 focus:outline-none cursor-pointer font-medium"
              >
                <option value="language" className="bg-slate-900">Language</option>
                <option value="category" className="bg-slate-900">Category</option>
              </select>
            </div>
        </div>

        {loading ? (
          <div className="space-y-12">
             {[1, 2, 3].map(i => (
                 <div key={i}>
                    <div className="h-7 w-48 bg-slate-800 rounded animate-pulse mb-6" />
                    <ChannelGrid channels={[]} isLoading={true} />
                 </div>
             ))}
          </div>
        ) : (
          <div className="space-y-12">
            {groupedSections.length > 0 ? (
                groupedSections.map((section) => (
                    <div key={section.title}>
                        <h2 className="text-xl font-bold text-slate-200 mb-4 pl-2 border-l-2 border-slate-700">{section.title}</h2>
                        <ChannelGrid channels={section.channels} />
                    </div>
                ))
            ) : (
                 <div className="text-center py-12 text-slate-500">No channels found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
