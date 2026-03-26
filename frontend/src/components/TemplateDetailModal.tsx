import { X, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import UserAvatar from './UserAvatar';
import UserProfilePopup from './UserProfilePopup';

interface Template {
  templateId: string;
  userId: string;
  username: string;
  authorName?: string;
  authorAvatar?: string | null;
  title: string;
  description: string;
  promptContent: string;
  imageUrl?: string;
  tags: string[];
  createdAt: number;
}

interface TemplateDetailModalProps {
  template: Template;
  onClose: () => void;
}

export default function TemplateDetailModal({ template, onClose }: TemplateDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(template.promptContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Left Side - Image (Desktop: 50%, Mobile: Top) */}
        {template.imageUrl && (
          <div className="md:w-1/2 bg-gray-100 flex items-center justify-center overflow-hidden">
            <img
              src={template.imageUrl}
              alt={template.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Right Side - Content (Desktop: 50%, Mobile: Bottom) */}
        <div className={`${template.imageUrl ? 'md:w-1/2' : 'w-full'} flex flex-col`}>
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex-1 pr-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {template.title}
              </h2>
              <button
                onClick={() => setShowUserProfile(true)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#00bcd4] transition-colors cursor-pointer group"
              >
                <UserAvatar 
                  src={template.authorAvatar}
                  alt={template.authorName || template.username}
                  size="sm"
                />
                <span className="group-hover:underline">
                  by {template.authorName || template.username || 'Anonymous'}
                </span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Description */}
            {template.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {template.description}
                </p>
              </div>
            )}

            {/* The Prompt - Hero Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Prompt Template
                </h3>
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00bcd4] to-[#6366f1] text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Prompt
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-100 rounded-xl p-5 border border-gray-200">
                <pre className="text-sm text-gray-900 font-mono whitespace-pre-wrap break-words leading-relaxed">
                  {template.promptContent}
                </pre>
              </div>
            </div>

            {/* Tags */}
            {template.tags && template.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-cyan-100 text-cyan-700 text-sm rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Created {new Date(template.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* User Profile Popup */}
      <UserProfilePopup
        userId={template.userId}
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />
    </>
  );
}
