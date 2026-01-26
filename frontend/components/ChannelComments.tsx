import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, Send, MessageSquare, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useTVFocus } from '@/hooks/useTVFocus';
import { useRouter } from 'next/navigation';

interface Comment {
  id: number;
  uuid: string;
  comment: string;
  created_at: string;
  customer?: {
    name: string;
    username: string;
  };
}

interface ChannelCommentsProps {
  channelUuid: string;
}

export default function ChannelComments({ channelUuid }: ChannelCommentsProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/channels/${channelUuid}/comments`);
      if (response.data.status) {
        setComments(response.data.data.data || response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [channelUuid]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await api.post(`/channels/${channelUuid}/comments`, {
        comment: newComment.trim()
      });

      if (response.data.status) {
        setNewComment('');
        fetchComments();
        toast.success('Comment posted');
      }
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { focusProps: inputFocus, isFocused: isInputFocused } = useTVFocus({
    onEnter: () => inputRef.current?.focus(),
    className: "w-full bg-slate-900 text-xs text-white px-3 py-2 pr-10 rounded-lg border border-slate-700 outline-none transition-all"
  });

  const { focusProps: loginFocus, isFocused: isLoginFocused } = useTVFocus({
    onEnter: () => router.push('/login'),
    className: "text-primary font-bold hover:underline outline-none"
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="p-3 border-b border-slate-700/50 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <MessageSquare size={16} className="text-primary" />
          Community Discussion
        </h3>
        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
          {comments.length} Comments
        </span>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-hide min-h-[150px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  {comment.customer?.name || comment.customer?.username || 'User'}
                </span>
                <span className="text-[9px] text-slate-500">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed bg-slate-800/50 p-2 rounded-lg border border-slate-700/30">
                {comment.comment}
              </p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
            <MessageSquare size={32} strokeWidth={1.5} className="opacity-20" />
            <p className="text-[10px] uppercase font-bold tracking-widest">No comments yet</p>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-2 bg-slate-950/50 border-t border-slate-700/50 shrink-0">
        {user ? (
          <div className="relative">
            <input
              {...inputFocus}
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                inputFocus.onKeyDown?.(e);
                if (e.key === 'Enter' && !isInputFocused) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Join the conversation..."
              className={`${inputFocus.className} ${isInputFocused ? 'ring-2 ring-primary border-transparent' : ''}`}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting || !newComment.trim()}
              className="absolute right-1 top-1 bottom-1 px-2 text-primary hover:text-cyan-400 disabled:text-slate-600 transition-colors focus:outline-none"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            </button>
          </div>
        ) : (
          <div className="text-center py-1">
            <p className="text-[10px] text-slate-500">
              Please <a {...loginFocus} href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} className={`${loginFocus.className} ${isLoginFocused ? 'text-white underline' : ''}`}>login</a> to comment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
