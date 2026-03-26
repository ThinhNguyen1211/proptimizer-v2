import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Sparkles, Copy, CheckCircle, AlertCircle, Loader2, Target, Brain, Code2, Globe, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import proptimizerLogo from '../assets/proptimizer-logo.svg';

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

interface OptimizerProps {
  initialHistoryItem?: HistoryItem | null;
  isLoggedIn?: boolean;
}

interface OptimizationMode {
  id: 'precision' | 'exploratory' | 'developer' | 'multilingual';
  name: string;
  description: string;
  icon: React.ReactNode;
  detail: string;
}

const OPTIMIZATION_MODES: OptimizationMode[] = [
  {
    id: 'precision',
    name: 'Precision',
    description: 'Concise, direct, and unambiguous instructions',
    icon: <Target className="w-6 h-6" />,
    detail: 'Strips away fluff to focus on concise, actionable instructions.'
  },
  {
    id: 'exploratory',
    name: 'Exploratory',
    description: 'Comprehensive educational exploration with multiple perspectives',
    icon: <Brain className="w-6 h-6" />,
    detail: 'Expands the prompt to cover multiple angles and educational context.'
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Best-practice code prompts with full architecture',
    icon: <Code2 className="w-6 h-6" />,
    detail: 'Transforms raw coding requests into comprehensive, production-ready prompts.'
  },
  {
    id: 'multilingual',
    name: 'Multilingual',
    description: 'Token-efficient, high-density English translation',
    icon: <Globe className="w-6 h-6" />,
    detail: 'Optimizes the prompt structure for translation tasks.'
  }
];

interface OptimizationResult {
  optimizedPrompt: string;
  mode: string;
  modeDescription: string;
  metrics: {
    tokensUsed: number;
    inputTokens: number;
    outputTokens: number;
    responseTime: string;
    originalLength: number;
    optimizedLength: number;
  };
}

export default function Optimizer({ initialHistoryItem, isLoggedIn = false }: OptimizerProps = {}) {
  const [selectedMode, setSelectedMode] = useState<OptimizationMode>(OPTIMIZATION_MODES[0]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load history item when provided
  useEffect(() => {
    if (initialHistoryItem) {
      // Set input prompt
      setInputPrompt(initialHistoryItem.original_prompt);
      
      // Find and set the mode
      const mode = OPTIMIZATION_MODES.find(m => m.id === initialHistoryItem.mode) || OPTIMIZATION_MODES[0];
      setSelectedMode(mode);
      
      // Pre-populate result
      setResult({
        optimizedPrompt: initialHistoryItem.optimized_prompt,
        mode: initialHistoryItem.mode,
        modeDescription: initialHistoryItem.mode_description,
        metrics: {
          tokensUsed: initialHistoryItem.tokens_used,
          inputTokens: 0,
          outputTokens: 0,
          responseTime: `${initialHistoryItem.response_time_ms}ms`,
          originalLength: initialHistoryItem.original_prompt.length,
          optimizedLength: initialHistoryItem.optimized_prompt.length
        }
      });
      
      // Clear error
      setError(null);
    }
  }, [initialHistoryItem]);

  // Lambda Function URL for streaming responses
  const OPTIMIZE_STREAM_URL = import.meta.env['VITE_OPTIMIZE_STREAM_URL'];

  const handleOptimize = async () => {
    if (!inputPrompt.trim()) {
      setError('Please enter a prompt to optimize');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const startTime = Date.now();

    try {
      // Get auth token
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        throw new Error('Not authenticated');
      }

      // Get user ID from token payload
      const userId = session.tokens?.idToken?.payload.sub as string;

      // Call the streaming Lambda Function URL
      const response = await fetch(OPTIMIZE_STREAM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({
          prompt: inputPrompt,
          mode: selectedMode.id,
          userId,
        }),
      });

      // Handle HTTP-level errors (non-streaming error responses)
      if (!response.ok) {
        let errorMessage = 'Optimization failed';
        try {
          const errorData = await response.json();
          if (response.status === 429) {
            errorMessage = errorData.message?.includes('daily limit')
              ? `Daily limit reached! You've used all ${errorData.limit} optimizations for today. Resets at midnight UTC.`
              : 'Service is temporarily at capacity. Please try again in a few minutes.';
          } else {
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } catch {
          errorMessage = `HTTP ${response.status}: Request failed`;
        }
        throw new Error(errorMessage);
      }

      // Ensure browser supports ReadableStream
      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser');
      }

      // Read the stream chunk-by-chunk
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk (Uint8Array -> string)
        const chunkText = decoder.decode(value, { stream: true });
        streamedText += chunkText;

        // Update the UI state immediately with each new chunk
        const elapsed = Date.now() - startTime;
        setResult({
          optimizedPrompt: streamedText,
          mode: selectedMode.id,
          modeDescription: selectedMode.description,
          metrics: {
            tokensUsed: Math.ceil(inputPrompt.length / 4) + Math.ceil(streamedText.length / 4),
            inputTokens: Math.ceil(inputPrompt.length / 4),
            outputTokens: Math.ceil(streamedText.length / 4),
            responseTime: `${elapsed}ms`,
            originalLength: inputPrompt.length,
            optimizedLength: streamedText.length,
          },
        });
      }

      // Check if the streamed text contains an error marker from the backend
      if (streamedText.includes('[ERROR:')) {
        const errorMatch = streamedText.match(/\[ERROR:\s*(.+?)\]/);
        setError(errorMatch ? errorMatch[1] : 'Stream interrupted. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize prompt');
      console.error('Optimization error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Strip markdown formatting for plain-text copy
  const stripMarkdown = (md: string): string => {
    return md
      .replace(/^#{1,6}\s+/gm, '')        // headings
      .replace(/\*\*(.+?)\*\*/g, '$1')     // bold
      .replace(/\*(.+?)\*/g, '$1')         // italic
      .replace(/__(.+?)__/g, '$1')         // bold alt
      .replace(/_(.+?)_/g, '$1')           // italic alt
      .replace(/~~(.+?)~~/g, '$1')         // strikethrough
      .replace(/`{3}[\s\S]*?`{3}/g, (m) => m.replace(/`{3}.*\n?/g, ''))  // code blocks
      .replace(/`(.+?)`/g, '$1')           // inline code
      .replace(/^\s*[-*+]\s+/gm, '• ')     // unordered lists
      .replace(/^\s*\d+\.\s+/gm, (m) => m) // keep numbered lists
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')  // links
      .replace(/^>\s?/gm, '')              // blockquotes
      .replace(/^---$/gm, '')              // horizontal rules
      .replace(/\n{3,}/g, '\n\n')          // excessive newlines
      .trim();
  };

  const handleCopy = () => {
    if (result?.optimizedPrompt) {
      navigator.clipboard.writeText(stripMarkdown(result.optimizedPrompt));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Hero Section */}
      <div className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo + Title */}
            <div className="flex items-center justify-center space-x-4 mb-5">
              <img src={proptimizerLogo} alt="Proptimizer Logo" className="w-12 h-12" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#64ffda] via-[#00bcd4] to-[#6366f1] bg-clip-text text-transparent animate-gradient-text bg-[length:300%_300%]">
                Welcome to Proptimizer
              </h1>
            </div>
            
            <p className="text-base text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
              Transform your prompts with AI-powered optimization. Choose your mode and start crafting better prompts instantly.
            </p>

            {/* Status Indicator */}
            {isLoggedIn ? (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-sm">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Account Connected • Ready to use in Extension</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-sm">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Please Log In to sync with Extension</span>
              </div>
            )}

            {/* Extension Download */}
            <div className="mt-4">
              <a
                href="https://chromewebstore.google.com/detail/proptimizer/fgnjfohkickjglglihmaojajigpnccbe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#00bcd4] to-[#6366f1] text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-cyan-200/40 transition-all duration-200 hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                Install Chrome Extension
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* Mode Selection */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Optimization Mode
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {OPTIMIZATION_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode)}
              className={`relative p-4 rounded-2xl border transition-all duration-200 text-left group ${
                selectedMode.id === mode.id
                  ? 'border-cyan-400 bg-cyan-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3 transition-colors ${
                selectedMode.id === mode.id
                  ? 'bg-cyan-100 text-[#00bcd4]'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-500'
              }`}>
                {mode.icon}
              </div>
              <h3 className={`font-semibold text-sm mb-1 transition-colors ${
                selectedMode.id === mode.id ? 'text-cyan-700' : 'text-gray-800'
              }`}>
                {mode.name}
              </h3>
              <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">
                {mode.description}
              </p>
            </button>
          ))}
        </div>
        
        {/* Selected Mode Detail */}
        <div className="mt-4 px-4 py-3 bg-white border border-gray-200 rounded-xl">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-[#00bcd4]">{selectedMode.name}:</span> {selectedMode.detail}
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="mb-8">
        <label htmlFor="input-prompt" className="block text-lg font-semibold text-gray-800 mb-3">
          Your Prompt
        </label>
        <textarea
          id="input-prompt"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Enter your prompt here... For example: 'Explain quantum computing'"
          spellCheck={false}
          className="w-full h-44 p-5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 resize-none text-gray-800 placeholder-gray-400 transition-all duration-200"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-gray-400 font-medium">
            {inputPrompt.length} characters
          </span>
          <button
            onClick={handleOptimize}
            disabled={loading || !inputPrompt.trim()}
            className="px-7 py-3.5 bg-gradient-to-r from-[#00bcd4] to-[#6366f1] text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Optimize Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800 text-sm mb-0.5">Optimization Failed</h4>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="space-y-5">
          {/* Optimized Prompt */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                Optimized Prompt
              </h3>
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-all duration-200 ${
                  copied 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="p-6">
              <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed prose-p:my-2 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-hr:my-4">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    strong: ({node, children, ...props}) => (
                      <strong className="font-bold text-[#00bcd4]" {...props}>{children}</strong>
                    ),
                    h1: ({node, children, ...props}) => (
                      <h1 className="text-lg font-bold text-gray-900 mt-4 mb-2" {...props}>{children}</h1>
                    ),
                    h2: ({node, children, ...props}) => (
                      <h2 className="text-base font-semibold text-gray-900 mt-3 mb-1.5" {...props}>{children}</h2>
                    ),
                    h3: ({node, children, ...props}) => (
                      <h3 className="text-sm font-semibold text-gray-900 mt-3 mb-1" {...props}>{children}</h3>
                    ),
                    code: ({node, className: codeClassName, children, ...props}) => {
                      const isInline = !codeClassName;
                      return isInline ? (
                        <code className="px-1.5 py-0.5 bg-cyan-50 text-[#0097a7] rounded-md text-[13px] font-mono" {...props}>{children}</code>
                      ) : (
                        <code className={codeClassName} {...props}>{children}</code>
                      );
                    },
                    a: ({node, ...props}) => (
                      <a className="text-[#00bcd4] hover:text-[#00838f] underline decoration-cyan-300 underline-offset-2" {...props} />
                    ),
                    table: ({node, ...props}) => (
                      <div className="overflow-x-auto my-3 rounded-xl border border-gray-200">
                        <table className="border-collapse w-full text-sm" {...props} />
                      </div>
                    ),
                    thead: ({node, ...props}) => (
                      <thead className="bg-cyan-50" {...props} />
                    ),
                    th: ({node, children, ...props}) => {
                      const processChildren = (kids: any): any => {
                        if (!kids) return kids;
                        if (typeof kids === 'string') {
                          const parts = kids.split(/<br\s*\/?>/gi);
                          if (parts.length <= 1) return kids;
                          return parts.flatMap((part: string, i: number) => i === 0 ? [part] : [<br key={i} />, part]);
                        }
                        if (Array.isArray(kids)) return kids.flatMap((c: any) => typeof c === 'string' ? processChildren(c) : [c]);
                        return kids;
                      };
                      return <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-[#0097a7] text-xs uppercase tracking-wide" {...props}>{processChildren(children)}</th>;
                    },
                    td: ({node, children, ...props}) => {
                      const processChildren = (kids: any): any => {
                        if (!kids) return kids;
                        if (typeof kids === 'string') {
                          const parts = kids.split(/<br\s*\/?>/gi);
                          if (parts.length <= 1) return kids;
                          return parts.flatMap((part: string, i: number) => i === 0 ? [part] : [<br key={i} />, part]);
                        }
                        if (Array.isArray(kids)) return kids.flatMap((c: any) => typeof c === 'string' ? processChildren(c) : [c]);
                        return kids;
                      };
                      return <td className="border-b border-gray-100 px-4 py-2.5" {...props}>{processChildren(children)}</td>;
                    },
                    blockquote: ({node, ...props}) => (
                      <blockquote className="border-l-4 border-cyan-300 bg-cyan-50/50 pl-4 py-2 my-3 text-gray-700 italic rounded-r-lg" {...props} />
                    ),
                  }}
                >
                  {result.optimizedPrompt}
                </ReactMarkdown>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-[#00bcd4]">{result.mode}</span> — {result.modeDescription}
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-5">
              Metrics
            </h3>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-[#00bcd4]">{result.metrics.tokensUsed}</p>
                <p className="text-[11px] text-gray-500 mt-1 font-medium">Total Tokens</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{result.metrics.inputTokens}</p>
                <p className="text-[11px] text-gray-500 mt-1 font-medium">Input Tokens</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-emerald-600">{result.metrics.outputTokens}</p>
                <p className="text-[11px] text-gray-500 mt-1 font-medium">Output Tokens</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-cyan-600">{result.metrics.responseTime}</p>
                <p className="text-[11px] text-gray-500 mt-1 font-medium">Response Time</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-orange-600">{result.metrics.originalLength}</p>
                <p className="text-[11px] text-gray-500 mt-1 font-medium">Original Len</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-indigo-600">{result.metrics.optimizedLength}</p>
                <p className="text-[11px] text-gray-500 mt-1 font-medium">Optimized Len</p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
