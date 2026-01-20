'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Channel } from '@/types';
import VideoPlayer from '@/components/VideoPlayer';
import ChannelRow from '@/components/ChannelRow';
import AdBanner from '@/components/AdBanner';
import ChannelCard from '@/components/ChannelCard';
import { Loader2, Eye, ThumbsUp, Share2, Clock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import Player from 'video.js/dist/types/player';
import { useTVFocus } from '@/hooks/useTVFocus';
import { useFavorites } from '@/hooks/useFavorites';
import { Heart } from 'lucide-react';
import { resolveImageUrl } from '@/lib/utils';

// TV-friendly Button Component
function TVButton({ onClick, className, children, ...props }: any) {
  const { focusProps, isFocused } = useTVFocus({
    onEnter: onClick,
    className: `${className} outline-none transition-all`,
    focusClassName: 'ring-4 ring-white scale-105 z-10 shadow-lg'
  });
  
  return (
    <button onClick={onClick} {...props} {...focusProps} className={`${className} ${isFocused ? 'ring-4 ring-white scale-105 z-10 shadow-lg' : ''} outline-none transition-all`}>
      {children}
    </button>
  );
}

function TVStar({ star, currentRating, onClick }: any) {
  const { focusProps, isFocused } = useTVFocus({
    onEnter: onClick,
    className: "text-2xl transition-all p-2 rounded-full outline-none",
    focusClassName: "ring-2 ring-yellow-400 scale-125 bg-slate-800"
  });
  
  return (
    <button
      onClick={onClick}
      {...focusProps}
      className={`text-2xl transition-all hover:scale-110 hover:text-yellow-400 focus:outline-none p-2 rounded-full ${isFocused ? 'ring-2 ring-yellow-400 scale-125 bg-slate-800' : ''}`}
    >
      <span className={star <= currentRating ? 'text-yellow-400' : 'text-slate-700'}>
        ★
      </span>
    </button>
  );
}

export default function ChannelPage() {
  const params = useParams();
  const router = useRouter();
  const [uuid, setUuid] = useState(params.id as string);
  
  // Sync state with params for back/forward navigation
  useEffect(() => {
    if (params.id) setUuid(params.id as string);
  }, [params.id]);

  // Refs
  // Refs
  const playerRef = useRef<Player | null>(null);
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasIncrementedRef = useRef(false);

  // State
  const [channel, setChannel] = useState<Channel | null>(null);
  const [relatedChannels, setRelatedChannels] = useState<Channel[]>([]);
  const [allChannelsList, setAllChannelsList] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showTrending, setShowTrending] = useState(true);
  const { user } = useAuthStore();
  
  // Title Update
  useEffect(() => {
    if (channel) {
      document.title = `${channel.name} - Nellai IPTV`;
    }
  }, [channel]);
  
  const { isFavorite, toggleFavorite, isProcessing } = useFavorites();
  const liked = channel ? isFavorite(channel.uuid) : false;

  const fetchChannelDetails = useCallback(async (fullLoad = true) => {
    try {
      if (fullLoad) {
        setLoading(true);
        setError('');
      }

      const [channelRes, relatedRes, commentsRes, settingsRes] = await Promise.all([
        api.get(`/channels/${uuid}`),
        fullLoad ? api.get(`/channels?limit=-1`) : Promise.resolve({ data: { status: false } }),
        fullLoad ? api.get(`/channels/${uuid}/comments`) : Promise.resolve({ data: { status: false } }),
        api.get('/settings/public')
      ]);

      // Check Top Trending Permission
      if (settingsRes.data.status) {
         const platformsStr = settingsRes.data.data.top_trending_platforms || 'web,android,ios,tv';
         const platforms = Array.isArray(platformsStr) ? platformsStr : (typeof platformsStr === 'string' ? platformsStr.split(',') : []);
         // ChannelPage is part of Web App
         setShowTrending(platforms.includes('web'));
      }

      if (channelRes.data.status) {
        const channelData = channelRes.data.data;
        setChannel(channelData);
        // Check for various possible rating keys
        const avgRating = channelData.average_rating || channelData.rating || channelData.avg_rating || 0;
        setRating(Number(avgRating));
      } else {
        setError(channelRes.data.message || 'Channel not found');
      }

      if (fullLoad && relatedRes.data.status) {
        const allChannels = relatedRes.data.data.data || relatedRes.data.data || [];
        setAllChannelsList(allChannels);
        setRelatedChannels(allChannels.filter((ch: Channel) => ch.uuid !== uuid));
      }

      if (fullLoad && commentsRes.data.status) {
        // Ensure we are setting an array
        const commentsData = commentsRes.data.data;
        if (Array.isArray(commentsData)) {
            setComments(commentsData);
        } else if (commentsData && Array.isArray(commentsData.data)) {
            setComments(commentsData.data);
        } else {
            setComments([]);
        }
      }
    } catch (err) {
      setError('Failed to load channel');
    } finally {
      if (fullLoad) setLoading(false);
    }
  }, [uuid]);

  const checkAndIncrementView = useCallback(async () => {
    if (playerRef.current && !playerRef.current.paused() && !hasIncrementedRef.current) {
      try {
        await api.post(`/channels/${uuid}/view`);
        hasIncrementedRef.current = true;
      } catch (err) {
        // Failed to increment view
      }
    }
  }, [uuid, fetchChannelDetails]);

  const decrementView = async () => {
    try {
      await api.post(`/channels/view/decrement`, { channel_uuid: uuid });
      hasIncrementedRef.current = false;
    } catch (err) {
      // Failed to decrement view
    }
  };

  /* New Video Playback Handlers for View Counting */
  const handleVideoPlay = useCallback(() => {
    if (!hasIncrementedRef.current && !viewTimerRef.current) {
         viewTimerRef.current = setTimeout(() => {
             checkAndIncrementView();
             viewTimerRef.current = null;
         }, 10000);
    }
  }, [checkAndIncrementView]);

  const handleVideoPause = useCallback(() => {
      if (viewTimerRef.current) {
          clearTimeout(viewTimerRef.current);
          viewTimerRef.current = null;
      }
  }, []);

  // Initial Fetch
  useEffect(() => {
    if (uuid) {
      fetchChannelDetails();
    }
    return () => {
      // Cleanup view on unmount if incremented
      if (hasIncrementedRef.current) {
        decrementView();
      }
      if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
    };
  }, [uuid, fetchChannelDetails]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: channel?.name || 'Watch Channel',
          text: `Watch ${channel?.name} live on Nellai IPTV`,
          url: window.location.href,
        });
      } catch (err) {
        // Share cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleRating = async (value: number) => {
    if (!user) {
         toast.error("Please login to rate channels");
         return;
    }

    try {
      const response = await api.post(`/channels/${uuid}/rate`, { rating: value });
      if (response.data.status) {
        setUserRating(value);
        setRating(response.data.data.average_rating);
        toast.success('Rating submitted!');
      }
    } catch (err) {
      toast.error('Failed to submit rating');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user) {
         toast.error("Please login to comment");
         return;
    }
    
    setSubmittingComment(true);
    try {
      const response = await api.post(`/channels/${uuid}/comments`, { comment: newComment });
      
      if (response.data.status) {
        setNewComment('');
        fetchChannelDetails(false); // Reload comments
        toast.success('Comment posted!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Focusable Back to Home
  const { focusProps: backFocusProps } = useTVFocus({
      onEnter: () => router.push('/'),
      className: "bg-primary hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium transition-colors outline-none",
      focusClassName: "ring-4 ring-white scale-105"
  });

  const handleChannelSelect = useCallback((c: Channel) => {
      // 1. Silent URL Update
      window.history.pushState(null, '', `/channel/${c.uuid}`);
      
      // 2. Optimistic Update (Switch Player Immediately)
      setChannel(c);
      
      // 3. Trigger Full Data Load
      setUuid(c.uuid);
      
      // 4. Reset Interaction States
      setNewComment('');
      // other states reset by fetchChannelDetails
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <h1 className="text-3xl font-bold text-white mb-4">Channel Not Found</h1>
        <p className="text-slate-400 mb-6">{error || 'This channel does not exist.'}</p>
        <button
          onClick={() => router.push('/')}
          {...backFocusProps}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Video Player Section - Full Width */}
      <div className="w-full bg-black relative shadow-2xl z-10">
        <div className="max-w-[1600px] mx-auto">
          <div className="aspect-video w-full">
            <VideoPlayer 
              src={channel.hls_url || ''} 
              poster={resolveImageUrl(channel.thumbnail_url)}
              onVideoPlay={handleVideoPlay}
              onVideoPause={handleVideoPause}
              channelUuid={channel.uuid}
              channelName={channel.name}
              channels={allChannelsList}
              currentGroup="All Channels"
              onChannelSelect={handleChannelSelect}
              viewersCount={channel.viewers_count || 0}
              topTrending={showTrending ? relatedChannels.slice(0, 10) : []}
              useCustomOverlay={true}
            />
          </div>
        </div>
      </div>

      {/* Channel Info Section */}
      <div className="container-custom pt-12 pb-12">
        {/* Main Info Bar */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-10">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                {channel.name}
              </h1>
              <div className="flex items-center gap-3">
                <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-700">
                  CH {channel.channel_number}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-slate-400 text-sm md:text-base">
              {channel.language && (
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  {channel.language.name}
                </span>
              )}
              {channel.district && (
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  {channel.district.name}
                </span>
              )}
              <span className="flex items-center gap-2 text-white font-medium">
                <Eye size={18} className="text-primary" />
                {channel.viewers_count_formatted || '0'} Viewers
              </span>
              {/* Explicit Average Rating Display */}
              <span className="flex items-center gap-2 text-yellow-400 font-bold">
                <span>★</span>
                {rating > 0 ? rating.toFixed(1) : 'No Ratings'}
              </span>
            </div>
          </div>

          {/* Action Buttons & Rating */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
             {/* Integrated Rating */}
            <div className="flex items-center gap-1 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
              {[1, 2, 3, 4, 5].map((star) => (
                <TVStar 
                  key={star}
                  star={star}
                  currentRating={userRating || rating}
                  onClick={() => handleRating(star)}
                />
              ))}
              <span className="ml-2 text-sm font-bold text-white">
                 {userRating > 0 ? 'Thanks!' : 'Rate'}
              </span>
            </div>

            <TVButton 
              onClick={handleShare}
              className="flex items-center gap-2 bg-primary hover:bg-cyan-600 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 font-medium"
            >
              <Share2 size={20} />
              <span>Share</span>
            </TVButton>

            <TVButton 
              onClick={() => channel && !isProcessing && toggleFavorite(channel.uuid, channel.name)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all shadow-lg font-medium ${liked ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart size={20} fill={liked ? 'currentColor' : 'none'} className={liked ? 'animate-pulse' : ''} />
              <span>{liked ? 'Favorited' : 'Favorite'}</span>
            </TVButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Description & Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800/50">
              <h3 className="text-xl font-bold text-white mb-4">About this Channel</h3>
              <p className="text-slate-300 leading-relaxed text-lg">
                Watch <span className="text-white font-semibold">{channel.name}</span> live streaming in high definition. 
                Experience premium Tamil entertainment with crystal clear video quality and uninterrupted streaming.
              </p>
            </div>

            {/* Ad Banner */}
            <div className="hidden md:block">
              <AdBanner type="banner" />
            </div>

            {/* Comments Section */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800/50">
              <h3 className="text-xl font-bold text-white mb-6">Comments</h3>
              
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full bg-slate-950 text-white rounded-xl p-4 border border-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none transition-all"
                  rows={3}
                />
                <div className="flex justify-end mt-3">
                  <TVButton
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </TVButton>
                </div>
              </form>

              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <div key={index} className="bg-slate-950 rounded-xl p-5 border border-slate-800/50">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                          {(comment.customer_name || comment.customer?.name || comment.user?.name || 'U').charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-white">
                              {comment.customer?.name || 'User'}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm">{comment.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-slate-950/50 rounded-xl border border-slate-800/50 border-dashed">
                    <p className="text-slate-500">No comments yet. Be the first to share your thoughts!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Related Channels & Ads */}
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50 text-center">
                  <div className="bg-green-500/10 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="text-green-500" size={20} />
                  </div>
                  <div className="font-bold text-white">24/7</div>
                  <div className="text-xs text-slate-400">Live</div>
               </div>
               <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50 text-center">
                  <div className="bg-blue-500/10 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ThumbsUp className="text-blue-500" size={20} />
                  </div>
                  <div className="font-bold text-white">HD</div>
                  <div className="text-xs text-slate-400">Quality</div>
               </div>
            </div>

            <div className="sticky top-24">
              <h3 className="text-lg font-bold text-white mb-4">More Channels</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 max-h-[800px] overflow-y-auto custom-scrollbar pr-2">
                {relatedChannels.map((ch) => (
                   <ChannelCard key={ch.uuid} channel={ch} />
                ))}
              </div>
              
              <div className="mt-8">
                <AdBanner type="inline" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
