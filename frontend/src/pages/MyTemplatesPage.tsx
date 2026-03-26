import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { BookOpen, Trash2, AlertCircle, User, Plus } from 'lucide-react';
import { fetchMyTemplates, deleteTemplate } from '../utils/api';
import CreateTemplateModal from '../components/CreateTemplateModal';
import TemplateDetailModal from '../components/TemplateDetailModal';

interface Template {
  templateId: string;
  userId: string;
  username: string;
  title: string;
  description: string;
  promptContent: string;
  imageUrl?: string;
  tags: string[];
  createdAt: number;
  isPublic: string;
}

export default function MyTemplatesPage() {
  useAuthenticator((context) => [context.user]);
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadMyTemplates();
  }, [refreshTrigger]);

  async function loadMyTemplates() {
    try {
      setLoading(true);
      setError(null);
      
      const myTemplates = await fetchMyTemplates();
      
      setTemplates(myTemplates);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(templateId: string, title: string) {
    const confirmed = window.confirm(`Are you sure you want to delete "${title}"?\n\nThis action cannot be undone.`);
    
    if (!confirmed) return;

    try {
      setDeletingId(templateId);
      
      await deleteTemplate(templateId);
      
      // Remove from UI
      setTemplates(prev => prev.filter(t => t.templateId !== templateId));
      
      // Show success message briefly
      setError(null);
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  }

  function handleTemplateCreated() {
    setShowCreateModal(false);
    setRefreshTrigger(prev => prev + 1);
  }

  function handleCardClick(template: Template) {
    setSelectedTemplate(template);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-[#6366f1] rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
                <p className="text-sm text-gray-600">Manage your template collection</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00bcd4] to-[#6366f1] text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Template
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00bcd4] border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your templates...</p>
            </div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No templates yet</h3>
            <p className="text-gray-500 mb-6">Create your first template to get started!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00bcd4] to-[#6366f1] text-white rounded-xl font-medium hover:opacity-90 transition-all"
            >
              <Plus className="w-5 h-5" />
              Create First Template
            </button>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {templates.map((template) => (
              <div
                key={template.templateId}
                className="break-inside-avoid mb-4 group relative"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                  {/* Image */}
                  {template.imageUrl ? (
                    <div 
                      className="relative overflow-hidden aspect-[4/3] cursor-pointer"
                      onClick={() => handleCardClick(template)}
                    >
                      <img
                        src={template.imageUrl}
                        alt={template.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div 
                      className="relative overflow-hidden aspect-[4/3] bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center cursor-pointer"
                      onClick={() => handleCardClick(template)}
                    >
                      <BookOpen className="w-16 h-16 text-cyan-300" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 
                        className="font-bold text-gray-900 text-lg line-clamp-2 flex-1 cursor-pointer hover:text-[#00bcd4]"
                        onClick={() => handleCardClick(template)}
                      >
                        {template.title}
                      </h3>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template.templateId, template.title);
                        }}
                        disabled={deletingId === template.templateId}
                        className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete template"
                      >
                        {deletingId === template.templateId ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    
                    {/* Description */}
                    {template.description && (
                      <p 
                        className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed cursor-pointer"
                        onClick={() => handleCardClick(template)}
                      >
                        {template.description}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <span>{template.username || 'Anonymous'}</span>
                      </div>
                      
                      {/* Visibility Badge */}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        template.isPublic === 'true' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {template.isPublic === 'true' ? '🌐 Public' : '🔒 Private'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleTemplateCreated}
        />
      )}

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}
