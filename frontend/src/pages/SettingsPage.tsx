import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { 
  User, 
  Mail, 
  FileText, 
  Camera, 
  Save, 
  AlertCircle, 
  CheckCircle,
  Loader,
  ArrowLeft,
  Phone,
  Globe,
  Plus,
  X
} from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import { API_BASE_URL } from '../utils/api';

interface SocialLink {
  platform: string;
  url: string;
}

interface Profile {
  userId: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  phoneNumber?: string;
  socialLinks?: SocialLink[];
  privacySettings?: {
    showEmail?: boolean;
    showPhone?: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuthenticator((context) => [context.user]);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([{ platform: '', url: '' }]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Privacy toggles
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  
  // Change detection
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  // Detect changes
  useEffect(() => {
    if (!initialData) {
      setHasChanges(false);
      return;
    }

    const changed = 
      displayName !== initialData.displayName ||
      bio !== initialData.bio ||
      phoneNumber !== initialData.phoneNumber ||
      showEmail !== initialData.showEmail ||
      showPhone !== initialData.showPhone ||
      JSON.stringify(socialLinks) !== JSON.stringify(initialData.socialLinks);

    setHasChanges(changed);
  }, [displayName, bio, phoneNumber, socialLinks, showEmail, showPhone, initialData]);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);

      // Get Cognito email as fallback
      let cognitoEmail = '';
      try {
        const userAttributes = await fetchUserAttributes();
        cognitoEmail = userAttributes.email || '';
      } catch (cognitoError) {
        console.warn('Could not fetch Cognito attributes:', cognitoError);
        cognitoEmail = user?.signInDetails?.loginId || '';
      }

      // Fetch profile from backend
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      const profileData = data.profile;

      // Use fallback logic for email
      const finalEmail = profileData.email && profileData.email.trim() !== '' 
        ? profileData.email 
        : cognitoEmail;

      setProfile({ ...profileData, email: finalEmail });
      const name = profileData.displayName || '';
      const bioText = profileData.bio || '';
      const phone = profileData.phoneNumber || '';
      const links = profileData.socialLinks && profileData.socialLinks.length > 0 
        ? profileData.socialLinks 
        : [{ platform: '', url: '' }];
      const emailVis = profileData.privacySettings?.showEmail || false;
      const phoneVis = profileData.privacySettings?.showPhone || false;
      
      setDisplayName(name);
      setEmail(finalEmail);
      setBio(bioText);
      setPhoneNumber(phone);
      setSocialLinks(links);
      setAvatarPreview(profileData.avatarUrl);
      setShowEmail(emailVis);
      setShowPhone(phoneVis);
      
      // Store initial data for change detection
      setInitialData({
        displayName: name,
        bio: bioText,
        phoneNumber: phone,
        socialLinks: JSON.parse(JSON.stringify(links)),
        showEmail: emailVis,
        showPhone: phoneVis
      });
    } catch (err) {
      console.error('Load profile error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    if (displayName.length > 50) {
      setError('Display name cannot exceed 50 characters');
      return;
    }

    if (bio.length > 500) {
      setError('Bio cannot exceed 500 characters');
      return;
    }

    // Validate social links
    const validLinks = socialLinks.filter(link => link.platform.trim() && link.url.trim());
    for (const link of validLinks) {
      if (!isValidUrl(link.url)) {
        setError(`Invalid URL for ${link.platform}`);
        return;
      }
    }

    if (phoneNumber && !isValidPhone(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim(),
          phoneNumber: phoneNumber.trim(),
          socialLinks: validLinks,
          avatarUrl: avatarPreview,
          privacySettings: {
            showEmail,
            showPhone
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      const data = await response.json();
      
      // Ensure email stays populated after save
      const updatedProfile = {
        ...data.profile,
        email: email
      };
      
      setProfile(updatedProfile);
      
      // Update initial data to new saved state
      setInitialData({
        displayName: displayName.trim(),
        bio: bio.trim(),
        phoneNumber: phoneNumber.trim(),
        socialLinks: JSON.parse(JSON.stringify(socialLinks.filter(l => l.platform.trim() && l.url.trim()))),
        showEmail,
        showPhone
      });
      
      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Save profile error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  function addSocialLink() {
    setSocialLinks([...socialLinks, { platform: '', url: '' }]);
  }

  function removeSocialLink(index: number) {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  }

  function updateSocialLink(index: number, field: 'platform' | 'url', value: string) {
    const updated = [...socialLinks];
    updated[index][field] = value;
    setSocialLinks(updated);
  }

  function isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function isValidPhone(phone: string): boolean {
    // Basic phone validation (10+ digits)
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  }

  async function handleAvatarSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      setError(null);

      // Get presigned URL
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const urlResponse = await fetch(`${API_BASE_URL}/profile/avatar-url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fileType: file.type
        })
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const urlData = await urlResponse.json();
      const { uploadUrl, publicUrl } = urlData;

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      // Update preview immediately
      setAvatarPreview(publicUrl);
      
      setSuccessMessage('Avatar uploaded! Click "Save Changes" to confirm.');

    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-[#00bcd4] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/templates')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Templates</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700">
              ×
            </button>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Success</p>
              <p className="text-sm text-green-700 mt-1">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Avatar Section */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-8 sm:px-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="ring-4 ring-white shadow-lg rounded-full">
                  <UserAvatar 
                    src={avatarPreview}
                    alt={displayName}
                    size="2xl"
                  />
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <Loader className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Avatar Actions */}
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Profile Picture
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  JPG, PNG or WebP. Max size 5MB.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-cyan-300 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                </button>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-6 py-8 sm:px-8 space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                {displayName.length}/50 characters
              </p>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900"
              />
              
              {/* Email Privacy Toggle */}
              <div className="flex items-center gap-3 mt-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showEmail} 
                    onChange={(e) => setShowEmail(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-[#00bcd4] rounded-full peer-focus:ring-4 peer-focus:ring-cyan-300 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
                <span className="text-sm text-gray-700 flex-1">
                  Show email on public profile
                  <span className={`ml-2 ${showEmail ? 'text-green-600' : 'text-gray-500'}`}>
                    {showEmail ? '(Visible to others)' : '(Hidden)'}
                  </span>
                </span>
              </div>
              
              <p className="mt-1 text-xs text-gray-500">
                Contact support to change your login email
              </p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={5}
                placeholder="Tell the community about yourself..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                {bio.length}/500 characters
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              
              {/* Phone Privacy Toggle */}
              <div className="flex items-center gap-3 mt-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showPhone} 
                    onChange={(e) => setShowPhone(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-[#00bcd4] rounded-full peer-focus:ring-4 peer-focus:ring-cyan-300 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
                <span className="text-sm text-gray-700 flex-1">
                  Show phone on public profile
                  <span className={`ml-2 ${showPhone ? 'text-green-600' : 'text-gray-500'}`}>
                    {showPhone ? '(Visible to others)' : '(Hidden)'}
                  </span>
                </span>
              </div>
              
              <p className="mt-1 text-xs text-gray-500">
                Optional • Used for contact purposes
              </p>
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Globe className="w-4 h-4 inline mr-2" />
                Social Links & Portfolio
              </label>
              <p className="text-xs text-gray-500 mb-4">
                Add links to your social profiles and portfolio websites
              </p>
              
              <div className="space-y-3">
                {socialLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={link.platform}
                      onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                      placeholder="Platform (e.g., LinkedIn, GitHub)"
                      className="w-1/3 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                    {socialLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSocialLink(index)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Remove link"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={addSocialLink}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-[#00bcd4] hover:bg-cyan-50 rounded-xl transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Another Link
              </button>
            </div>

            {/* Error Message (inline) */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Success Message (inline) */}
            {successMessage && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={saving || !hasChanges}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  hasChanges
                    ? 'bg-gradient-to-r from-[#00bcd4] to-[#6366f1] text-white hover:shadow-lg hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } disabled:opacity-50`}
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {hasChanges ? 'Save Changes' : 'No Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Profile created {profile && new Date(profile.createdAt).toLocaleDateString()}</p>
          <p className="mt-1">
            Last updated {profile && new Date(profile.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
