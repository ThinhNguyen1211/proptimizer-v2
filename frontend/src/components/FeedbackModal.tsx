import { useState } from 'react';
import { X, Loader2, CheckCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import { API_BASE_URL } from '../utils/api';

const FEEDBACK_TYPES = [
  { id: 'bug', label: 'Bug Report' },
  { id: 'feature', label: 'Feature Request' },
  { id: 'feedback', label: 'General Feedback' },
] as const;

type FeedbackType = typeof FEEDBACK_TYPES[number]['id'];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>('feedback');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError(null);

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      const userId = session.tokens?.idToken?.payload.sub as string;
      const email = session.tokens?.idToken?.payload.email as string;

      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type,
          message: message.trim(),
          userId: userId || 'anonymous',
          email: email || '',
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });

      if (!response.ok) throw new Error('Failed to send feedback');
      
      setSent(true);
      setTimeout(() => {
        onClose();
        // Reset state after close animation
        setTimeout(() => {
          setSent(false);
          setMessage('');
          setType('feedback');
        }, 200);
      }, 1500);
    } catch (err) {
      setError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-[420px] border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          /* Success State */
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-[15px] font-semibold text-gray-900 mb-1">Thank you!</h3>
            <p className="text-[13px] text-gray-500">Your feedback has been sent successfully.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-semibold text-gray-900">Send Feedback</h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Type Selection */}
              <div>
                <label className="text-[13px] font-medium text-gray-700 mb-2 block">Type</label>
                <div className="flex gap-2">
                  {FEEDBACK_TYPES.map((ft) => (
                    <button
                      key={ft.id}
                      onClick={() => setType(ft.id)}
                      className={`flex-1 px-3 py-2 rounded-xl text-[12px] font-medium border transition-all duration-150 ${
                        type === ft.id
                          ? 'border-[#00bcd4] bg-cyan-50 text-[#00838f]'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {ft.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-[13px] font-medium text-gray-700 mb-2 block">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    type === 'bug'
                      ? 'Describe the issue and steps to reproduce...'
                      : type === 'feature'
                      ? 'Describe the feature you would like...'
                      : 'Share your thoughts with us...'
                  }
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#00bcd4] focus:ring-1 focus:ring-cyan-200 resize-none transition-colors"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-[12px] text-red-500">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className="px-4 py-2 bg-gradient-to-r from-[#00bcd4] to-[#6366f1] text-white rounded-lg text-[13px] font-medium hover:shadow-md hover:shadow-cyan-200/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Feedback'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
