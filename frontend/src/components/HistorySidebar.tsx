import { useState, useEffect } from 'react';
import { Clock, Loader2, AlertCircle } from 'lucide-react';
import { fetchHistory } from '../utils/api';

interface HistoryItem {
  prompt_id: string;
  user_id: string;
  created_at: number;
  original_prompt: string;
  optimized_prompt: string;
  mode: string;
  mode_description: string;
  tokens_used: number;
  response_time_ms: number;
}

interface HistorySidebarProps {
  onSelectItem: (item: HistoryItem) => void;
  selectedItemId?: string;
}

export default function HistorySidebar({ onSelectItem, selectedItemId }: HistorySidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await fetchHistory();
      setHistory(items);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      precision: 'bg-cyan-100 text-cyan-700',
      exploratory: 'bg-cyan-100 text-cyan-700',
      structured: 'bg-green-100 text-green-700',
      multilingual: 'bg-orange-100 text-orange-700',
    };
    return colors[mode] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#00bcd4] animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="flex items-start space-x-2 text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Error loading history</p>
            <p className="text-xs text-red-500 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={loadHistory}
          className="mt-4 w-full text-sm text-[#00bcd4] hover:text-cyan-700 font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">History</h2>
          <button
            onClick={loadHistory}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Refresh"
          >
            <Clock className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <p className="text-xs text-gray-500">
          {history.length} {history.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-4 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No history yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Your optimizations will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map((item) => (
              <button
                key={item.prompt_id}
                onClick={() => onSelectItem(item)}
                className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                  selectedItemId === item.prompt_id ? 'bg-cyan-50 border-l-2 border-[#00bcd4]' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getModeColor(item.mode)}`}>
                    {item.mode}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(item.created_at)}
                  </span>
                </div>

                <p className="text-sm text-gray-900 font-medium line-clamp-2 mb-1">
                  {truncateText(item.original_prompt)}
                </p>

                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span>{item.tokens_used} tokens</span>
                  <span>•</span>
                  <span>{item.response_time_ms}ms</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          History stored for 30 days
        </p>
      </div>
    </div>
  );
}
