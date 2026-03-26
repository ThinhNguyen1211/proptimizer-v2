import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Lock, Brain, Zap } from 'lucide-react';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  locked: boolean;
  comingSoon: boolean;
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    description: 'Optimized for coding & logic',
    locked: false,
    comingSoon: false
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast, multimodal reasoning',
    locked: false,
    comingSoon: false
  }
];

interface ModelSelectorProps {
  selectedModel: AIModel;
  onSelectModel: (model: AIModel) => void;
}

export default function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Dropdown Menu - Positioned above the button with high z-index */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-3 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-visible z-[9999]">
          <div className="p-2">
            {AI_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  if (!model.locked) {
                    onSelectModel(model);
                    setIsOpen(false);
                  }
                }}
                disabled={model.locked}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                  model.locked
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100 cursor-pointer'
                } ${selectedModel.id === model.id ? 'bg-cyan-50 border border-cyan-200' : ''}`}
                title={model.locked ? 'Coming soon' : ''}
              >
                <div className="flex items-center space-x-3 flex-1">
                  {model.id === 'deepseek-chat' ? (
                    <Brain className="w-5 h-5 text-[#00bcd4]" />
                  ) : model.id === 'gemini-1.5-flash' ? (
                    <Zap className="w-5 h-5 text-yellow-500" />
                  ) : model.id === 'gemini-1.5-pro' ? (
                    <Brain className="w-5 h-5 text-[#6366f1]" />
                  ) : model.locked ? (
                    <Lock className="w-4 h-4 text-gray-400" />
                  ) : (
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedModel.id === model.id
                        ? 'border-[#00bcd4] bg-[#00bcd4]'
                        : 'border-gray-300'
                    } flex items-center justify-center`}>
                      {selectedModel.id === model.id && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  )}
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${
                        model.locked ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {model.name}
                      </p>
                      {model.comingSoon && (
                        <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-medium rounded uppercase">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${
                      model.locked ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {model.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Brain className="w-4 h-4 text-[#00bcd4]" />
        <span>{selectedModel.name}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}
