import { useState, useRef } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { X, ImageIcon, Loader2 } from 'lucide-react';
import { API_BASE_URL, getAuthToken } from '../utils/api';

interface CreateTemplateModalProps {
  initialData?: {
    templateId: string;
    title: string;
    description: string;
    promptContent: string;
    tags: string[];
    isPublic?: string;
    imageUrl?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTemplateModal({ initialData, onClose, onSuccess }: CreateTemplateModalProps) {
  const { user } = useAuthenticator((context) => [context.user]);
  
  const isEditMode = !!initialData;
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [promptContent, setPromptContent] = useState(initialData?.promptContent || '');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');
  const [isPublic, setIsPublic] = useState(initialData?.isPublic === 'true' || (initialData?.isPublic as any) === true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl || '');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(initialData?.imageUrl || '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUserId = (): string | null => {
    if (!user) {
      console.warn('No user object available');
      return null;
    }

    const possibleIds = [
      user.userId,
      user.username,
      (user as any).attributes?.sub,
      (user as any).signInDetails?.loginId,
    ];

    for (const id of possibleIds) {
      if (id && typeof id === 'string') {
        return id;
      }
    }

    console.error('No valid user ID found in:', Object.keys(user));
    return null;
  };

  function handleImageSelect(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    setImageFile(file);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function uploadImage(): Promise<string> {
    if (!imageFile) return '';
    
    try {
      setUploading(true);
      setError(null);
      
      const userId = getUserId();
      if (!userId) {
        throw new Error('Authentication required: No User ID found. Please sign in again.');
      }
      
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required: No auth token found. Please sign in again.');
      }
      
      const urlResponse = await fetch(`${API_BASE_URL}/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: imageFile.name,
          contentType: imageFile.type,
        }),
      });
      
      if (!urlResponse.ok) {
        const errorData = await urlResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${urlResponse.status}`);
      }
      
      const { uploadUrl, publicUrl } = await urlResponse.json();
      
      if (!uploadUrl || !publicUrl) {
        throw new Error('Invalid response from server: missing upload URL');
      }
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: imageFile,
        headers: {
          'Content-Type': imageFile.type,
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }
      
      setUploadedImageUrl(publicUrl);
      return publicUrl;
      
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      return '';
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!title || !promptContent) {
      setError('Title and prompt content are required');
      return;
    }
    
    const userId = getUserId();
    if (!userId && !isEditMode) {
      setError('Authentication required: No User ID found. Please sign in again.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      let imageUrl = uploadedImageUrl;
      if (imageFile && !uploadedImageUrl) {
        imageUrl = await uploadImage();
        if (!imageUrl && error) {
          console.warn('Image upload failed, proceeding without image');
          setError(null);
        }
      }
      
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required: No auth token found. Please sign in again.');
      }
      
      const url = isEditMode 
        ? `${API_BASE_URL}/templates/${initialData.templateId}`
        : `${API_BASE_URL}/templates`;
      
      const method = isEditMode ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(isEditMode ? {} : { userId }),
          title,
          description,
          promptContent,
          imageUrl: imageUrl || '',
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          isPublic,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      await response.json();
      
      onSuccess();
      
    } catch (err) {
      console.error('❌ Submit error:', err);
      const errorMessage = err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} template`;
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Template' : 'Create Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image (Optional)
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500 transition-colors min-h-[300px] flex items-center justify-center"
              >
                {imagePreview ? (
                  <div className="relative w-full">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-80 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview('');
                        setUploadedImageUrl('');
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Drag and drop an image here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelect(file);
                }}
                className="hidden"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Professional Email Template"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this prompt does. You can also include usage instructions or tips here..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt Content *
                </label>
                <textarea
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  placeholder="Write your optimized prompt here..."
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {promptContent.length} characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., business, email, professional"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-[#00bcd4] border-gray-300 rounded focus:ring-cyan-500"
                />
                <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                  Make this template public
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#00bcd4] to-[#6366f1] text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting || uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploading ? 'Uploading...' : isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Update Template' : 'Create Template'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
