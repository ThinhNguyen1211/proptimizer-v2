import { MessageSquare, Trash2, Loader2, SquarePen, RefreshCw, MoreHorizontal, Pin, Pencil, Check, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { API_CONFIG } from '../amplify-config';
import ConfirmationModal from './ConfirmationModal';

export interface ChatThread {
  threadId: string;
  userId: string;
  title: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  isPinned?: boolean;
}

interface ChatSidebarProps {
  threads: ChatThread[];
  currentThreadId: string | null;
  loading: boolean;
  isOpen: boolean;
  onNewChat: () => void;
  onSelectThread: (thread: ChatThread) => void;
  onDeleteThread: (threadId: string, e: React.MouseEvent) => void;
  onRefresh: () => void;
}

export default function ChatSidebar({
  threads,
  currentThreadId,
  loading,
  isOpen,
  onNewChat,
  onSelectThread,
  onDeleteThread,
  onRefresh
}: ChatSidebarProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chatIdToDelete, setChatIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sort threads: Pinned first, then by updatedAt
  const pinnedThreads = threads.filter(t => t.isPinned).sort((a, b) => b.updatedAt - a.updatedAt);
  const otherThreads = threads.filter(t => !t.isPinned).sort((a, b) => b.updatedAt - a.updatedAt);

  const handleDeleteClick = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatIdToDelete(threadId);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleConfirmDelete = async () => {
    if (!chatIdToDelete) return;
    
    setIsDeleting(true);
    try {
      await onDeleteThread(chatIdToDelete, new MouseEvent('click') as any);
      setIsDeleteModalOpen(false);
      setChatIdToDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
      setChatIdToDelete(null);
    }
  };

  const handleTogglePin = async (threadId: string, currentPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) return;

      const response = await fetch(`${API_CONFIG.baseUrl}/chat/threads/${threadId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPinned: !currentPinned })
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleStartRename = (thread: ChatThread, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(thread.threadId);
    setEditingTitle(thread.title || 'New Conversation');
    setOpenMenuId(null);
  };

  const handleSaveRename = async (threadId: string) => {
    if (!editingTitle.trim()) {
      setEditingThreadId(null);
      return;
    }

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        console.error('No auth token');
        return;
      }

      const response = await fetch(`${API_CONFIG.baseUrl}/chat/threads/${threadId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: editingTitle.trim() })
      });

      if (response.ok) {
        onRefresh(); // Refresh thread list
      }
    } catch (error) {
      console.error('Failed to rename:', error);
    } finally {
      setEditingThreadId(null);
    }
  };

  const handleCancelRename = () => {
    setEditingThreadId(null);
    setEditingTitle('');
  };

  const renderThreadItem = (thread: ChatThread) => {
    const isEditing = editingThreadId === thread.threadId;
    const isMenuOpen = openMenuId === thread.threadId;

    return (
      <div
        key={thread.threadId}
        role="button"
        onClick={() => !isEditing && onSelectThread(thread)}
        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group relative cursor-pointer mb-0.5 ${
          currentThreadId === thread.threadId 
            ? 'bg-white shadow-sm' 
            : 'hover:bg-white/60'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(thread.threadId);
                    if (e.key === 'Escape') handleCancelRename();
                  }}
                  onBlur={() => handleSaveRename(thread.threadId)}
                  className="flex-1 px-2 py-1 text-sm border border-cyan-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveRename(thread.threadId)}
                  className="p-1 hover:bg-green-50 rounded-lg"
                >
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </button>
                <button
                  onClick={handleCancelRename}
                  className="p-1 hover:bg-red-50 rounded-lg"
                >
                  <X className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  {thread.isPinned && <Pin className="w-3 h-3 text-[#00bcd4] flex-shrink-0" />}
                  <p className="text-sm text-gray-700 truncate leading-snug">
                    {thread.title || 'New Conversation'}
                  </p>
                </div>
              </>
            )}
          </div>
          
          {!isEditing && (
            <div className="relative" ref={isMenuOpen ? menuRef : null}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(isMenuOpen ? null : thread.threadId);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200/80 rounded-lg transition-all"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200/80 py-1 z-50">
                  <button
                    onClick={(e) => handleTogglePin(thread.threadId, !!thread.isPinned, e)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg mx-0 transition-colors"
                  >
                    <Pin className="w-3.5 h-3.5" />
                    {thread.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  
                  <button
                    onClick={(e) => handleStartRename(thread, e)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg mx-0 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Rename
                  </button>
                  
                  <div className="border-t border-gray-100 my-1" />
                  
                  <button
                    onClick={(e) => handleDeleteClick(thread.threadId, e)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg mx-0 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 top-16 z-40 w-[280px] bg-[#f0f0f0] transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Action Buttons */}
        <div className="p-3 pt-4">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200/60 rounded-full shadow-sm hover:shadow transition-all duration-200 group"
          >
            <SquarePen className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">New Chat</span>
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-full transition-all duration-200 disabled:opacity-50"
            title="Sync chat history from Extension"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs font-medium">Sync from Extension</span>
          </button>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : threads.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a new chat</p>
            </div>
          ) : (
            <div className="py-1">
              {/* Pinned Section */}
              {pinnedThreads.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 flex items-center gap-1.5">
                    <Pin className="w-3 h-3 text-gray-400" />
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Pinned</span>
                  </div>
                  {pinnedThreads.map(renderThreadItem)}
                </div>
              )}
              
              {/* Recent Section */}
              {otherThreads.length > 0 && (
                <div>
                  {pinnedThreads.length > 0 && (
                    <div className="px-3 py-2">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Recent</span>
                    </div>
                  )}
                  {otherThreads.map(renderThreadItem)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Conversation?"
        message="This conversation will be permanently deleted. This action cannot be undone."
        isLoading={isDeleting}
      />
    </aside>
  );
}
