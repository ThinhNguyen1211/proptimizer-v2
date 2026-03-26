import { useState, useEffect } from 'react';
import { Target, Brain, Code2, Globe, ExternalLink, Keyboard } from 'lucide-react';

type OptimizationMode = 'precision' | 'exploratory' | 'developer' | 'multilingual';

interface ModeConfig {
  id: OptimizationMode;
  icon: typeof Target;
  label: string;
  description: string;
}

const MODES: ModeConfig[] = [
  {
    id: 'precision',
    icon: Target,
    label: 'Precision',
    description: 'Concise & direct',
  },
  {
    id: 'exploratory',
    icon: Brain,
    label: 'Exploratory',
    description: 'Deep exploration',
  },
  {
    id: 'developer',
    icon: Code2,
    label: 'Developer',
    description: 'Code-optimized',
  },
  {
    id: 'multilingual',
    icon: Globe,
    label: 'Multilingual',
    description: 'Multi-language',
  },
];

function App() {
  const [selectedMode, setSelectedMode] = useState<OptimizationMode>('precision');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const [responseMode, setResponseMode] = useState<'fast' | 'full'>('full');
  const [shortcutEnabled, setShortcutEnabled] = useState(true);

  const MODEL_OPTIONS = [
    { id: 'deepseek-chat', name: 'DeepSeek V3' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }
  ];

  useEffect(() => {
    // Check authentication status + token expiry
    chrome.storage.local.get(['accessToken', 'idToken', 'tokenExpiry'], (result) => {
      const hasTokens = !!(result.accessToken && result.idToken);
      if (!hasTokens) {
        setIsAuthenticated(false);
        setIsTokenExpired(false);
        return;
      }
      // Check if token is expired
      if (result.tokenExpiry && Date.now() > result.tokenExpiry) {
        setIsAuthenticated(false);
        setIsTokenExpired(true);
        return;
      }
      setIsAuthenticated(true);
      setIsTokenExpired(false);
    });

    // Listen for storage changes (logout from web / token refresh)
    const onStorageChanged = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.accessToken || changes.idToken) {
        const newAccess = changes.accessToken?.newValue;
        const newId = changes.idToken?.newValue;
        if (!newAccess && !newId) {
          setIsAuthenticated(false);
        } else if (newAccess && newId) {
          setIsAuthenticated(true);
          setIsTokenExpired(false);
        }
      }
    };
    chrome.storage.local.onChanged.addListener(onStorageChanged);

    // Load saved mode from storage
    chrome.storage.sync.get(['optimizationMode'], (result) => {
      if (result.optimizationMode) {
        setSelectedMode(result.optimizationMode);
      }
    });

    // Load saved model preference
    chrome.storage.local.get(['preferredModel'], (result) => {
      const saved = result.preferredModel || localStorage.getItem('preferredModel');
      if (saved) setSelectedModel(saved);
    });

    // Load saved response mode preference
    chrome.storage.local.get(['preferredResponseMode'], (result) => {
      const saved = result.preferredResponseMode || localStorage.getItem('preferredResponseMode');
      if (saved === 'fast' || saved === 'full') setResponseMode(saved);
    });

    // Load saved shortcut preference
    chrome.storage.sync.get(['shortcutEnabled'], (result) => {
      if (result.shortcutEnabled !== undefined) setShortcutEnabled(result.shortcutEnabled);
    });
  }, []);

  const handleModeChange = (mode: OptimizationMode) => {
    setSelectedMode(mode);
    
    // Save to storage so content.js can read it
    chrome.storage.sync.set({ optimizationMode: mode });
  };

  const openWebApp = () => {
    window.open('https://d3jqm7so635aqb.cloudfront.net', '_blank');
  };

  const toggleShortcut = () => {
    const newVal = !shortcutEnabled;
    setShortcutEnabled(newVal);
    chrome.storage.sync.set({ shortcutEnabled: newVal });
  };

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="w-[360px] h-[340px] bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login/expired prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="w-[360px] bg-white">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="flex items-center justify-center gap-2">
            <img src="/assets/proptimizer-logo-transparent.svg" alt="Proptimizer Logo" className="w-8 h-8" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-500 bg-[length:200%_auto] animate-gradient-x">
              Proptimizer
            </h1>
          </div>
        </div>

        <div className="flex flex-col items-center px-6 py-8 space-y-5">
          {/* Status icon */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
            isTokenExpired ? 'bg-amber-50' : 'bg-gray-50'
          }`}>
            {isTokenExpired ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>

          {/* Title + Description */}
          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-bold text-gray-900">
              {isTokenExpired ? 'Session Expired' : 'Sign In Required'}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-[260px]">
              {isTokenExpired
                ? 'Your session has expired. Please open the web app to refresh your connection.'
                : 'Open the Proptimizer web app and sign in to start using the extension.'}
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={openWebApp}
            className="w-full max-w-[240px] py-2.5 px-5 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-200/50 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
          >
            <span>{isTokenExpired ? 'Reconnect Account' : 'Open Web App'}</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Helper text */}
          <p className="text-[11px] text-gray-400 text-center leading-relaxed max-w-[260px]">
            {isTokenExpired
              ? 'Once signed in, your extension will automatically reconnect.'
              : 'After signing in, the extension will sync with your account automatically.'}
          </p>
        </div>
      </div>
    );
  }

  // Main app UI for authenticated users

  return (
    <div className="w-[360px] bg-white">
      {/* Header with Logo - compact */}
      <div className="px-5 py-3 border-b border-gray-200">
        <div className="flex items-center justify-center gap-2">
          <img 
            src="/assets/proptimizer-logo-transparent.svg" 
            alt="Proptimizer Logo" 
            className="w-8 h-8"
          />
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-500 bg-[length:200%_auto] animate-gradient-x">
            Proptimizer
          </h1>
        </div>
      </div>

      {/* Main Content - tighter spacing */}
      <div className="px-5 py-4 space-y-4">
        {/* Model Selector + Response Toggle - side by side */}
        <div className="flex items-start gap-3">
          {/* Model Dropdown */}
          <div className="flex-1">
            <h2 className="text-xs font-semibold text-gray-600 mb-1">AI Model</h2>
            <div className="relative">
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all duration-200 group"
              >
                <span className="text-xs font-medium text-gray-700">
                  {MODEL_OPTIONS.find(m => m.id === selectedModel)?.name}
                </span>
                <svg 
                  className={`w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-500 transition-all duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isModelDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsModelDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">
                    {MODEL_OPTIONS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModel(m.id);
                          try { localStorage.setItem('preferredModel', m.id); } catch (err) {}
                          chrome.storage.local.set({ preferredModel: m.id });
                          try { chrome.runtime.sendMessage({ type: 'PREFERRED_MODEL_UPDATED', model: m.id }); } catch (err) {}
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                          selectedModel === m.id
                            ? 'bg-cyan-50 text-cyan-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Response Mode Toggle */}
          <div>
            <h2 className="text-xs font-semibold text-gray-600 mb-1">Speed</h2>
            <div className="inline-flex bg-gray-50 border border-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => {
                  setResponseMode('fast');
                  try { localStorage.setItem('preferredResponseMode', 'fast'); } catch (e) {}
                  chrome.storage.local.set({ preferredResponseMode: 'fast' });
                  try { chrome.runtime.sendMessage({ type: 'PREFERRED_RESPONSE_MODE_UPDATED', responseMode: 'fast' }); } catch (err) {}
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 border ${
                  responseMode === 'fast'
                    ? 'bg-white text-cyan-700 border-cyan-200 shadow-sm'
                    : 'bg-transparent text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Fast
              </button>
              <button
                onClick={() => {
                  setResponseMode('full');
                  try { localStorage.setItem('preferredResponseMode', 'full'); } catch (e) {}
                  chrome.storage.local.set({ preferredResponseMode: 'full' });
                  try { chrome.runtime.sendMessage({ type: 'PREFERRED_RESPONSE_MODE_UPDATED', responseMode: 'full' }); } catch (err) {}
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 border ${
                  responseMode === 'full'
                    ? 'bg-white text-indigo-700 border-indigo-200 shadow-sm'
                    : 'bg-transparent text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Detailed
              </button>
            </div>
          </div>
        </div>
        <p className="text-[9px] text-gray-400 -mt-2.5">Speed controls AI chat response length & detail</p>

        {/* Mode Selection - compact grid */}
        <div>
          <h2 className="text-xs font-semibold text-gray-600 mb-1.5">Optimization Mode</h2>
          <div className="grid grid-cols-2 gap-1.5">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isActive = selectedMode === mode.id;
              
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeChange(mode.id)}
                  className={`
                    px-3 py-2 rounded-lg transition-colors duration-200 text-left border-2 flex items-center gap-2.5
                    ${isActive 
                      ? 'bg-cyan-50 border-cyan-400' 
                      : 'bg-white border-gray-200 hover:border-cyan-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-cyan-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-600' : 'text-gray-500'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold leading-tight ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                      {mode.label}
                    </p>
                    <p className={`text-[9px] leading-tight ${isActive ? 'text-cyan-600' : 'text-gray-400'}`}>
                      {mode.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Open Web App Button - compact */}
        <button
          onClick={openWebApp}
          className="w-full py-2 px-4 border-2 border-cyan-600 text-cyan-600 font-semibold rounded-lg hover:bg-cyan-50 transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
        >
          <span>Open AI Chat</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        {/* Shortcut Toggle */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5 text-gray-500" />
            <div>
              <span className="text-xs font-medium text-gray-600">Ctrl + Q Shortcut</span>
              <p className="text-[9px] text-gray-400">Open AI Chat instantly on any page</p>
            </div>
          </div>
          <button
            onClick={toggleShortcut}
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
              shortcutEnabled ? 'bg-cyan-500' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
              shortcutEnabled ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* Footer Hint - compact */}
      <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200">
        <p className="text-[10px] text-center text-gray-500">
          Select text on any page, then click the <span className="font-semibold text-cyan-600">lightning icon</span>
        </p>
        <p className="text-[10px] text-center text-gray-400 mt-0.5">
          Press <span className="font-semibold text-cyan-600">Ctrl+Q</span> to instantly open AI Chat
        </p>
      </div>
    </div>
  );
}

export default App;