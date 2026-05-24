'use client';

import { useState } from 'react';
import { MessageSquare, Star, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const FEEDBACK_TYPES = [
  { value: 'general',          label: 'General Feedback'       },
  { value: 'bug',              label: 'Bug Report'             },
  { value: 'feature_request',  label: 'Feature Request'        },
  { value: 'channel_issue',    label: 'Channel Issue'          },
  { value: 'subscription',     label: 'Subscription / Billing' },
];

const ISSUE_TYPES = [
  { value: 'stream_not_working',   label: 'Stream not working'   },
  { value: 'buffering_frequently', label: 'Buffering frequently'  },
  { value: 'audio_issue',          label: 'Audio issue'           },
  { value: 'video_quality_issue',  label: 'Video quality issue'   },
  { value: 'wrong_channel',        label: 'Wrong channel'         },
  { value: 'other',                label: 'Other'                 },
];

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export default function FeedbackPage() {
  const { user } = useAuthStore();

  const [feedbackType, setFeedbackType] = useState('general');
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [issueType, setIssueType] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = { feedback_type: feedbackType, message };
      if (rating !== null) payload.rating = rating;
      if (feedbackType === 'channel_issue' && issueType) payload.issue_type = issueType;

      const response = await api.post('/feedback', payload);
      if (response.data.status) {
        toast.success(response.data.message || 'Thank you for your feedback!');
        setFeedbackType('general');
        setRating(null);
        setIssueType('');
        setMessage('');
      } else {
        toast.error(response.data.message || 'Failed to submit. Please try again.');
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const msgs = Object.values(error.response.data.errors).flat().join(', ');
        toast.error(`Validation: ${msgs}`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to submit. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating ?? rating;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">

      {/* Hero */}
      <div className="relative pt-16 pb-14 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-primary/8 blur-[120px] rounded-full" />
        </div>
        <div className="relative z-10 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl mb-5">
            <MessageSquare size={26} className="text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">Share Your Feedback</h1>
          <p className="text-slate-400 max-w-md mx-auto text-base md:text-lg">
            Help us improve Nellai IPTV — your feedback matters.
          </p>
          {user && (
            <p className="text-sm text-primary mt-3">
              Submitting as <span className="font-semibold">{(user as any).name || (user as any).email}</span>
            </p>
          )}
        </div>
      </div>

      <div className="container-custom max-w-2xl px-4">
        <div
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7 animate-fade-up"
          style={{ animationDelay: '0.18s' }}
        >
          <form onSubmit={handleSubmit} className="space-y-7">

            {/* Feedback Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Feedback Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FEEDBACK_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => { setFeedbackType(type.value); setIssueType(''); }}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all text-left ${
                      feedbackType === type.value
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Rating <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star === rating ? null : star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(null)}
                    className="focus:outline-none transition-transform hover:scale-115"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={30}
                      className={`transition-colors ${
                        displayRating !== null && star <= displayRating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
                {rating !== null && (
                  <span className="text-slate-400 text-sm ml-1">{STAR_LABELS[rating]}</span>
                )}
              </div>
            </div>

            {/* Issue Type (channel_issue only) */}
            {feedbackType === 'channel_issue' && (
              <div className="animate-fade-up">
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Issue Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ISSUE_TYPES.map(issue => (
                    <button
                      key={issue.value}
                      type="button"
                      onClick={() => setIssueType(issue.value)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all text-left ${
                        issueType === issue.value
                          ? 'bg-red-500/10 border-red-500 text-red-400'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                      }`}
                    >
                      {issue.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Describe your feedback in detail..."
                className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all resize-none placeholder:text-slate-600 text-sm"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || (feedbackType === 'channel_issue' && !issueType)}
              className="w-full bg-primary hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 text-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                <>
                  <Send size={17} />
                  Submit Feedback
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
