import { useState, useEffect, useRef } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { BookOpen, Plus, AlertCircle, Search, Heart, Bookmark, Share2, Check, Pencil, Trash2, Globe, Lock } from 'lucide-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import CreateTemplateModal from '../components/CreateTemplateModal';
import TemplateDetailModal from '../components/TemplateDetailModal';
import TemplatesSidebar from '../components/TemplatesSidebar';
import { API_BASE_URL } from '../utils/api';

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
  isPublic?: string;
  likesCount?: number;
  savesCount?: number; // 🔥 NEW: Save counter
  isLiked?: boolean;
  isSaved?: boolean;
}

interface TemplatesPageProps {
  view?: 'feed' | 'library' | 'saved';
}

export default function TemplatesPage({ view = 'feed' }: TemplatesPageProps) {
  const { user } = useAuthenticator((context) => [context.user]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [nextKey, setNextKey] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Infinite scroll ref
  const observerTarget = useRef<HTMLDivElement>(null);

  // Debounced search (500ms delay)
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check URL for deep linking template parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('templateId');
    
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.templateId === templateId);
      if (template) {
        setSelectedTemplate(template);
      }
    }
  }, [templates]);

  // Re-call API when switching between Feed/Library/Saved
  useEffect(() => {
    loadTemplates(false);
  }, [refreshTrigger, view, debouncedSearchQuery]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        // Trigger load more when:
        // 1. Observer target is visible
        // 2. Not currently loading
        // 3. More data available (nextKey exists)
        if (entry.isIntersecting && !loading && !loadingMore && nextKey) {
          loadTemplates(true);
        }
      },
      {
        root: null, // viewport
        rootMargin: '100px', // Trigger 100px before reaching the element
        threshold: 0.1
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loading, loadingMore, nextKey]); // Re-run when these change

  async function loadTemplates(isLoadMore = false) {
    try {
      if (!isLoadMore) {
        setLoading(true);
        setTemplates([]);
        setNextKey(null);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      // Check authentication for protected views
      if ((view === 'saved' || view === 'library') && !user) {
        throw new Error('Please sign in to view your saved templates');
      }
      
      // Unified API call for all views
      let url = `${API_BASE_URL}/templates?limit=20&view=${view}`;
      
      if (isLoadMore && nextKey) {
        url += `&nextKey=${encodeURIComponent(nextKey)}`;
      }
      
      // Server-side search (only for feed view)
      if (debouncedSearchQuery && view === 'feed') {
        url += `&q=${encodeURIComponent(debouncedSearchQuery)}`;
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      let token: string | undefined;
      
      try {
        const session = await fetchAuthSession();
        token = session.tokens?.idToken?.toString();
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          // For protected views, require authentication
          if (view === 'saved' || view === 'library') {
            throw new Error('Authentication required. Please sign in again.');
          }
        }
      } catch (authError) {
        console.error('Failed to get auth session:', authError);
        
        // For protected views, fail fast
        if (view === 'saved' || view === 'library') {
          throw new Error('Authentication failed. Please sign in again.');
        }
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.');
        }
        throw new Error(`Failed to load templates: ${response.status}`);
      }
      
      const data = await response.json();
      const newItems = data.items || data.templates || [];
      
      // Append or replace based on isLoadMore
      if (isLoadMore) {
        setTemplates(prev => [...prev, ...newItems]);
      } else {
        setTemplates(newItems);
      }
      
      setNextKey(data.nextKey || null);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      if (!isLoadMore) {
        setTemplates([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleOpenCreateModal() {
    if (!user) {
      setError('Please sign in to create templates');
      return;
    }
    setEditingTemplate(null);
    setShowCreateModal(true);
  }

  function handleTemplateCreated() {
    setShowCreateModal(false);
    setEditingTemplate(null);
    setRefreshTrigger(prev => prev + 1);
  }

  function handleModalClose() {
    setShowCreateModal(false);
    setEditingTemplate(null);
    setError(null);
  }

  function handleCardClick(template: Template) {
    setSelectedTemplate(template);
    
    const url = new URL(window.location.href);
    url.searchParams.set('templateId', template.templateId);
    window.history.pushState({}, '', url);
  }

  function handleCloseDetailModal() {
    setSelectedTemplate(null);
    
    const url = new URL(window.location.href);
    url.searchParams.delete('templateId');
    window.history.pushState({}, '', url);
  }

  async function toggleLike(templateId: string, e: React.MouseEvent) {
    e.stopPropagation();
    
    const template = templates.find(t => t.templateId === templateId);
    if (!template) return;

    const currentIsLiked = template.isLiked || false;
    const currentCount = template.likesCount || 0;

    // Optimistic UI update
    setTemplates(prev => prev.map(t => 
      t.templateId === templateId 
        ? { 
            ...t, 
            isLiked: !currentIsLiked,
            likesCount: currentIsLiked ? Math.max(0, currentCount - 1) : currentCount + 1
          }
        : t
    ));

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/templates/${templateId}/like`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        
        setTemplates(prev => prev.map(t => 
          t.templateId === templateId 
            ? { ...t, likesCount: data.likesCount, isLiked: data.isLiked }
            : t
        ));
      } else {
        setTemplates(prev => prev.map(t => 
          t.templateId === templateId 
            ? { ...t, isLiked: currentIsLiked, likesCount: currentCount }
            : t
        ));
      }
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      setTemplates(prev => prev.map(t => 
        t.templateId === templateId 
          ? { ...t, isLiked: currentIsLiked, likesCount: currentCount }
          : t
      ));
    }
  }

  async function toggleSave(templateId: string, e: React.MouseEvent) {
    e.stopPropagation();
    
    const template = templates.find(t => t.templateId === templateId);
    if (!template) return;

    const currentIsSaved = template.isSaved || false;
    const currentSavesCount = template.savesCount || 0;

    // Optimistic UI update - update both isSaved and savesCount
    setTemplates(prev => prev.map(t => 
      t.templateId === templateId 
        ? { 
            ...t, 
            isSaved: !currentIsSaved,
            savesCount: currentIsSaved ? currentSavesCount - 1 : currentSavesCount + 1
          }
        : t
    ));

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/templates/${templateId}/save`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update with actual server data
        setTemplates(prev => prev.map(t => 
          t.templateId === templateId 
            ? { 
                ...t, 
                isSaved: data.isSaved,
                savesCount: data.savesCount !== undefined ? data.savesCount : t.savesCount
              }
            : t
        ));
        
        // If we're in saved view and item was unsaved, remove it from list
        if (view === 'saved' && !data.isSaved) {
          setTemplates(prev => prev.filter(t => t.templateId !== templateId));
        }
      } else {
        console.error('Failed to toggle save');
        // Revert optimistic update
        setTemplates(prev => prev.map(t => 
          t.templateId === templateId 
            ? { ...t, isSaved: currentIsSaved, savesCount: currentSavesCount }
            : t
        ));
      }
    } catch (error) {
      console.error('❌ Error toggling save:', error);
      // Revert optimistic update
      setTemplates(prev => prev.map(t => 
        t.templateId === templateId 
          ? { ...t, isSaved: currentIsSaved, savesCount: currentSavesCount }
          : t
      ));
    }
  }

  async function handleShare(template: Template, e: React.MouseEvent) {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/templates?templateId=${template.templateId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(template.templateId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }

  async function handleEditTemplate(template: Template, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingTemplate(template);
    setShowCreateModal(true);
  }

  // Toggle public/private status
  async function handleTogglePublic(template: Template, e: React.MouseEvent) {
    e.stopPropagation();
    const newPublicStatus = template.isPublic === 'true' ? false : true;
    
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        throw new Error('No auth token found');
      }

      const response = await fetch(`${API_BASE_URL}/templates/${template.templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          isPublic: newPublicStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update template visibility');
      }
      
      // Trigger refresh to reload templates
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to toggle template visibility:', err);
    }
  }

  // Delete template (just open confirmation modal)
  async function handleDeleteTemplate(template: Template, e: React.MouseEvent) {
    e.stopPropagation();
    setTemplateToDelete(template);
  }

  // Confirm and execute delete
  async function confirmDelete() {
    if (!templateToDelete) return;
    
    setIsDeleting(true);

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        setError('Authentication required to delete templates');
        setTemplateToDelete(null);
        setIsDeleting(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/templates/${templateToDelete.templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove from local state
        setTemplates(prev => prev.filter(t => t.templateId !== templateToDelete.templateId));
        setTemplateToDelete(null);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete template');
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete template');
      setTemplateToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }

  // Cancel delete
  function cancelDelete() {
    setTemplateToDelete(null);
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
      {/* SIDEBAR: Fixed width, stays in place */}
      <aside className="w-64 h-full flex-shrink-0 border-r bg-white overflow-hidden md:block scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <TemplatesSidebar
          currentView={view}
          onCreateClick={handleOpenCreateModal}
        />
      </aside>

      {/* MAIN CONTENT: Takes remaining space, handles scroll */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Search Bar - Only show on Home Feed */}
        {view === 'feed' && (
          <div className="flex-shrink-0 bg-white border-b shadow-sm">
            <div className="w-full px-6 py-4">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={isSearching ? "Searching..." : "Search by title or tags..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#00bcd4] border-t-transparent"></div>
                  </div>
                )}
              </div>
              {debouncedSearchQuery && (
                <p className="text-sm text-gray-600 mt-2 ml-1">
                  Found {templates.length} result{templates.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="flex-shrink-0 px-6 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">×</button>
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6" id="scrollable-content">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00bcd4] border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Loading templates...</p>
              </div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {view === 'saved' ? 'No saved templates yet' : view === 'library' ? 'No templates yet' : 'No templates available'}
              </h3>
              <p className="text-gray-500 mb-6">
                {view === 'saved' ? 'Start saving templates you like!' : view === 'library' ? 'Create your first template!' : 'Be the first to share a template!'}
              </p>
              {view === 'library' && (
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00bcd4] to-[#6366f1] text-white rounded-xl font-medium hover:opacity-90 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create First Template
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Pinterest-style Masonry Grid - 5 columns on desktop */}
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
                {templates.map((template) => {
                  const isLiked = template.isLiked || false;
                  const isSaved = template.isSaved || false;
                  const isLinkCopied = copiedLink === template.templateId;
                  
                  return (
                    <div
                      key={template.templateId}
                      className="break-inside-avoid mb-4 cursor-pointer group"
                      onClick={() => handleCardClick(template)}
                    >
                      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
                        {/* Image - Fill width, auto height with max limit */}
                        {template.imageUrl ? (
                          <div className="relative overflow-hidden" style={{ maxHeight: '1200px' }}>
                            <img
                              src={template.imageUrl}
                              alt={template.title}
                              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {/* Public/Private Badge Overlay - Only for owner */}
                            {user && template.userId === user.username && (
                              <button
                                onClick={(e) => handleTogglePublic(template, e)}
                                className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition-all border shadow-sm ${
                                  template.isPublic === 'true'
                                    ? 'bg-white/25 text-white border-white/30 hover:bg-white/35'
                                    : 'bg-black/30 text-white border-white/20 hover:bg-black/40'
                                }`}
                                title={template.isPublic === 'true' ? 'Click to make private' : 'Click to make public'}
                              >
                                {template.isPublic === 'true' ? (
                                  <>
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>Public</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Private</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="relative overflow-hidden bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center" style={{ height: '200px' }}>
                            <BookOpen className="w-16 h-16 text-cyan-300" />
                            {/* Public/Private Badge Overlay - Only for owner */}
                            {user && template.userId === user.username && (
                              <button
                                onClick={(e) => handleTogglePublic(template, e)}
                                className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition-all border shadow-sm ${
                                  template.isPublic === 'true'
                                    ? 'bg-cyan-500/30 text-cyan-900 border-cyan-300/50 hover:bg-cyan-500/40'
                                    : 'bg-gray-700/30 text-gray-800 border-gray-400/50 hover:bg-gray-700/40'
                                }`}
                                title={template.isPublic === 'true' ? 'Click to make private' : 'Click to make public'}
                              >
                                {template.isPublic === 'true' ? (
                                  <>
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>Public</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Private</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 mb-2 text-lg truncate">
                            {template.title}
                          </h3>
                          
                          {template.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                              {template.description}
                            </p>
                          )}

                          {template.tags && template.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {template.tags.slice(0, 2).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                              {template.tags.length > 2 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{template.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Footer - Action Bar */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-4">
                              {/* CRITICAL FIX: Heart icon visual state */}
                              <button
                                onClick={(e) => toggleLike(template.templateId, e)}
                                className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors"
                              >
                                <Heart 
                                  className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} 
                                />
                                <span className="text-xs">{template.likesCount || 0}</span>
                              </button>
                              
                              {/* CRITICAL FIX: Bookmark icon visual state with counter */}
                              <button
                                onClick={(e) => toggleSave(template.templateId, e)}
                                className="flex items-center gap-1 text-gray-600 hover:text-[#00bcd4] transition-colors"
                              >
                                <Bookmark 
                                  className={`w-4 h-4 ${isSaved ? 'fill-[#00bcd4] text-[#00bcd4]' : 'text-gray-500'}`} 
                                />
                                <span className="text-xs">{template.savesCount || 0}</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Owner Actions - Only show for template owner */}
                              {user && template.userId === user.username && (
                                <>
                                  <button
                                    onClick={(e) => handleEditTemplate(template, e)}
                                    className="flex items-center gap-1 text-gray-600 hover:text-[#00bcd4] transition-colors"
                                    title="Edit template"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteTemplate(template, e)}
                                    className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors"
                                    title="Delete template"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              
                              <button
                                onClick={(e) => handleShare(template, e)}
                                className="flex items-center gap-1 text-gray-600 hover:text-[#00bcd4] transition-colors"
                                title="Copy link to clipboard"
                              >
                                {isLinkCopied ? (
                                  <>
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span className="text-xs text-green-500">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Share2 className="w-4 h-4" />
                                    <span className="text-xs">Share</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Infinite Scroll Trigger */}
              <div 
                ref={observerTarget} 
                className="h-20 w-full flex justify-center items-center py-8"
              >
                {loadingMore && (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#00bcd4] border-t-transparent"></div>
                    <p className="text-gray-600 font-medium">Loading more templates...</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreateTemplateModal
          initialData={editingTemplate || undefined}
          onClose={handleModalClose}
          onSuccess={handleTemplateCreated}
        />
      )}

      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={handleCloseDetailModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {templateToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={cancelDelete}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Template?</h2>
            </div>

            {/* Body */}
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900">"{templateToDelete.title}"</span>?{' '}
              This action cannot be undone.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
