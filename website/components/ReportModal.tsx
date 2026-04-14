import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTVFocus } from '@/hooks/useTVFocus';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName?: string;
  channelUuid?: string;
  // container allows portaling the modal into a specific element (e.g. for Fullscreen support)
  container?: HTMLElement | null;
}

const ISSUES = [
  'Stream not working',
  'Buffering frequently',
  'Audio issue',
  'Video quality issue',
  'Wrong channel',
  'Other'
];

export default function ReportModal({ isOpen, onClose, channelName = 'Channel', channelUuid, container }: ReportModalProps) {
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [otherDescription, setOtherDescription] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  const { focusProps: closeFocus } = useTVFocus({
    onEnter: onClose,
    className: "p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
  });

  const { focusProps: submitFocus } = useTVFocus({
    onEnter: handleSubmit,
    className: "w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
  });

  const { focusProps: inputFocus } = useTVFocus({
    className: "w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:border-primary outline-none mt-3"
  });

  if (!isOpen || !mounted) return null;

  async function handleSubmit() {
    if (!selectedIssue) return;
    if (selectedIssue === 'Other' && !otherDescription.trim()) {
        toast.error('Please describe the issue');
        return;
    }
    
    if (!channelUuid) {
        toast.error('Channel information missing');
        return;
    }

    setIsSubmitting(true);
    
    try {
        const finalIssue = selectedIssue === 'Other' ? otherDescription : selectedIssue;
        
        await api.post(`/channels/${channelUuid}/report`, {
            issue_type: finalIssue,
            description: selectedIssue === 'Other' ? otherDescription : null
        });
        
        toast.success('Report submitted. Thanks for your feedback!');
        onClose();
        setSelectedIssue('');
        setOtherDescription('');
    } catch (error: any) {
        console.error('Error submitting report:', error);
        toast.error(error.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 transform transition-all animate-in fade-in zoom-in-95 duration-200 text-left">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle size={24} />
            <h2 className="text-xl font-bold text-white">Report Issue</h2>
          </div>
          <button {...closeFocus}>
            <X size={24} />
          </button>
        </div>

        <p className="text-slate-400 mb-4">
          What is wrong with <span className="text-white font-medium">{channelName}</span>?
        </p>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {ISSUES.map((issue) => (
             <div key={issue}>
                <label 
                  className={`flex items-center p-3 rounded-lg cursor-pointer border transition-all ${
                    selectedIssue === issue 
                      ? 'bg-red-500/10 border-red-500 text-white' 
                      : 'bg-slate-800 border-transparent text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="issue" 
                    value={issue}
                    checked={selectedIssue === issue}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                    className="mr-3 h-4 w-4 bg-transparent border-slate-500 text-red-500 focus:ring-red-500 accent-red-500"
                  />
                  <span className="flex-1">{issue}</span>
                </label>
                
                {/* Render input immediately if "Other" is selected */}
                {issue === 'Other' && selectedIssue === 'Other' && (
                    <div className="mt-2 ml-2 pl-4 border-l-2 border-slate-700 animate-in fade-in slide-in-from-top-2">
                        <textarea
                            {...inputFocus}
                            value={otherDescription}
                            onChange={(e) => setOtherDescription(e.target.value)}
                            placeholder="Please describe the issue..."
                            rows={3}
                            autoFocus
                        />
                    </div>
                )}
            </div>
          ))}
        </div>

        <button
          disabled={!selectedIssue || (selectedIssue === 'Other' && !otherDescription.trim()) || isSubmitting}
          {...submitFocus}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>
    </div>,
    container || document.body
  );
}
