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
  const initialSearch = searchParams.get("search") || "";
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Filter States
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [selectedLanguage, selectedCategory, searchQuery]);

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

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedLanguage) params.language_uuid = selectedLanguage;
      if (selectedCategory) params.category_uuid = selectedCategory; // or state_uuid
      if (searchQuery) params.search = searchQuery;
      params.limit = -1; // Fetch more channels
      
      const response = await api.get('/channels', { params });
      if (response.data.status) {
        let fetchedChannels = response.data.data.data || response.data.data;
        
        // Sort by channel_number ascending
        if (Array.isArray(fetchedChannels)) {
            fetchedChannels.sort((a: any, b: any) => {
                const numA = Number(a.channel_number) || 0;
                const numB = Number(b.channel_number) || 0;
                return numA - numB;
            });
        }
        
        setChannels(fetchedChannels);
      } else {
        setChannels([]);
      }
    } catch (err) {
      toast.error('Error fetching channels');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-12 px-4 md:px-8">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">All Channels</h1>
            <p className="text-slate-400">Browse our collection of premium channels.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <Filter size={16} className="text-slate-400 ml-2" />
              <select 
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent text-white text-sm p-2 focus:outline-none cursor-pointer"
              >
                <option value="">All Languages</option>
                {languages.map((lang) => (
                  <option key={lang.uuid} value={lang.uuid} className="bg-slate-900">{lang.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <Filter size={16} className="text-slate-400 ml-2" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-white text-sm p-2 focus:outline-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.uuid} value={cat.uuid} className="bg-slate-900">{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
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
