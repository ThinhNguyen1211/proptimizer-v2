import { useState, useEffect } from 'react';
import { X, Globe, Mail, Phone, AlertCircle } from 'lucide-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import UserAvatar from './UserAvatar';
import { API_BASE_URL } from '../utils/api';

interface UserProfilePopupProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface PublicProfile {
  userId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string | null;
  socialLinks?: SocialLink[];
  email?: string;
  phoneNumber?: string;
}

export default function UserProfilePopup({ userId, isOpen, onClose }: UserProfilePopupProps) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId]);

  async function fetchProfile() {
    try {
      setLoading(true);
      setError(null);

      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/profile?userId=${userId}`, {
        headers
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Profile not found');
        }
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      setProfile(data.profile);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  // Handle ESC key to close
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading State */}
        {loading && (
          <div className="p-8">
            {/* Loading Skeleton */}
            <div className="flex flex-col items-center">
              {/* Avatar Skeleton */}
              <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse mb-4"></div>
              
              {/* Name Skeleton */}
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              
              {/* Bio Skeleton */}
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-6"></div>
              
              {/* Contact Info Skeleton */}
              <div className="w-full space-y-3">
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">Error Loading Profile</p>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Profile Content */}
        {profile && !loading && !error && (
          <>
            {/* Header */}
            <div className="relative bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-8">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              {/* Avatar & Name */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-4">
                  <UserAvatar 
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    size="2xl"
                  />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {profile.displayName}
                </h2>

                {profile.bio && (
                  <p className="text-gray-600 text-sm max-w-md leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Info Section */}
            <div className="px-6 py-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Contact Information
              </h3>

              <div className="space-y-3">
                {/* Social Links */}
                {profile.socialLinks && profile.socialLinks.length > 0 && profile.socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-cyan-50 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                      <Globe className="w-5 h-5 text-[#00bcd4]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">{link.platform}</p>
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#00bcd4]">
                        {link.url.replace(/^https?:\/\//, '')}
                      </p>
                    </div>
                  </a>
                ))}

                {/* Email (Only if public) */}
                {profile.email && profile.email.trim() !== '' && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-cyan-50 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                      <Mail className="w-5 h-5 text-[#00bcd4]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#00bcd4]">
                        {profile.email}
                      </p>
                    </div>
                  </a>
                )}

                {/* Phone (Only if public) */}
                {profile.phoneNumber && (
                  <a
                    href={`tel:${profile.phoneNumber}`}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-cyan-50 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                      <Phone className="w-5 h-5 text-[#00bcd4]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#00bcd4]">
                        {profile.phoneNumber}
                      </p>
                    </div>
                  </a>
                )}
              </div>

              {/* No Contact Info Available */}
              {(!profile.socialLinks || profile.socialLinks.length === 0) && !profile.email && !profile.phoneNumber && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">
                    No public contact information available
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-cyan-300 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
