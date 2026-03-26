import { useState, useEffect, useRef, Children, isValidElement } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Loader2, AlertCircle, PanelLeft, ArrowUp, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import proptimizerLogo from '../assets/proptimizer-logo.svg';
import { API_CONFIG } from '../amplify-config';
import SEO from '../components/SEO';
import ChatSidebar, { type ChatThread } from '../components/ChatSidebar';
import { AI_MODELS, type AIModel } from '../components/ModelSelector';

// Chat streaming Function URL (Lambda Response Streaming, bypasses API Gateway)
const CHAT_STREAM_URL = import.meta.env['VITE_CHAT_STREAM_URL'];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_PROMPTS = [
  {
    title: "Help me write",
    description: "Professional email to client",
    icon: "✉️"
  },
  {
    title: "Explain concept",
    description: "Quantum computing basics",
    icon: "🧬"
  },
  {
    title: "Brainstorm ideas",
    description: "Marketing campaign themes",
    icon: "💡"
  },
  {
    title: "Code review",
    description: "React component best practices",
    icon: "💻"
  }
];

// Code block wrapper with language header + copy button (ChatGPT style)
function CodeBlockWrapper({ children, ...props }: any) {
  const [copied, setCopied] = useState(false);

  // Extract language from the <code> child's className
  let language = 'Code';
  let codeString = '';
  
  // Extract text content for copy
  const extractText = (node: any): string => {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (isValidElement(node) && (node as any).props?.children) return extractText((node as any).props.children);
    return '';
  };
  
  const allChildren = Children.toArray(children);
  const codeChild = allChildren.find(
    (child: any) => isValidElement(child) && (child as any).type === 'code'
  ) as any;
  if (codeChild?.props?.className) {
    const match = codeChild.props.className.match(/language-(\w+)/);
    if (match) language = match[1];
  }
  if (codeChild?.props?.children) {
    codeString = extractText(codeChild.props.children);
  } else {
    codeString = extractText(children);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="not-prose relative my-3 rounded-lg overflow-hidden border border-gray-700">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-300 font-medium capitalize">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center p-1 text-gray-400 hover:text-gray-100 transition-colors rounded hover:bg-white/10"
          title={copied ? 'Copied!' : 'Copy'}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre className="!m-0 !rounded-none !border-0 bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm" {...props}>
        {children}
      </pre>
    </div>
  );
}

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThread, setCurrentThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    const saved = localStorage.getItem('selectedModel');
    if (saved) {
      const match = AI_MODELS.find(m => m.id === saved);
      if (match) return match;
    }
    return AI_MODELS[0];
  });

  const [responseMode, setResponseMode] = useState<'fast' | 'full'>(() => {
    const saved = localStorage.getItem('responseMode');
    return saved === 'fast' ? 'fast' : 'full';
  });

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('responseMode', responseMode); } catch (e) {}
  }, [responseMode]);

  // Adapter so the premium control uses simple model string API
  const model = selectedModel.id;
  const setModel = (id: string) => {
    const match = AI_MODELS.find(m => m.id === id);
    if (match) setSelectedModel(match);
  };

  useEffect(() => {
    // persist model selection
    try { localStorage.setItem('selectedModel', selectedModel.id); } catch (e) {}
  }, [selectedModel]);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  // Load threads on mount
  useEffect(() => {
    loadThreads();
  }, []);

  // Auto-select thread from URL ?threadId=xxx (e.g. from extension "Continue on web")
  useEffect(() => {
    const threadId = searchParams.get('threadId');
    if (threadId && threads.length > 0 && currentThread !== threadId) {
      const thread = threads.find(t => t.threadId === threadId);
      if (thread) {
        setCurrentThread(thread.threadId);
        setMessages(thread.messages);
        // Clean up URL param after selecting
        setSearchParams({}, { replace: true });
      }
    }
  }, [threads, searchParams]);

  // Track if user has scrolled up during streaming
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Consider "at bottom" if within 100px of the bottom
      isUserScrolledUp.current = scrollHeight - scrollTop - clientHeight > 100;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom ONLY if user hasn't scrolled up
  useEffect(() => {
    if (!isUserScrolledUp.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Reset height to auto to get the correct scrollHeight
    const target = e.target;
    target.style.height = 'auto';
    
    // Set height to scrollHeight (capped at 200px by CSS max-height)
    const newHeight = Math.min(target.scrollHeight, 200);
    target.style.height = `${newHeight}px`;
  };

  const loadThreads = async () => {
    setLoadingThreads(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      const userId = session.tokens?.idToken?.payload.sub as string;

      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_CONFIG.baseUrl}/chat/threads?userId=${userId}`, {
        headers: { 'Authorization': token },
      });

      if (!response.ok) throw new Error('Failed to load threads');

      const data = await response.json();
      setThreads(data.threads || []);
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setLoadingThreads(false);
    }
  };

  const handleNewChat = () => {
    setCurrentThread(null);
    setMessages([]);
    setError(null);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleSelectThread = (thread: ChatThread) => {
    setCurrentThread(thread.threadId);
    setMessages(thread.messages);
    setError(null);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const deleteUrl = `${API_CONFIG.baseUrl}/chat/threads/${threadId}`;

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete conversation');
      }

      // Remove from local state
      setThreads(threads.filter(t => t.threadId !== threadId));
      
      // If current thread was deleted, clear messages
      if (currentThread === threadId) {
        setCurrentThread(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting thread:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages: Message[] = [...messages, userMessage];
    // Add an empty assistant message that will be filled by the stream
    const emptyAssistant: Message = { role: 'assistant', content: '' };
    
    setMessages([...newMessages, emptyAssistant]);
    setInput('');
    setLoading(true);
    setError(null);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      const userId = session.tokens?.idToken?.payload.sub as string;

      if (!token) throw new Error('Not authenticated');

      const response = await fetch(CHAT_STREAM_URL, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          threadId: currentThread,
          userId,
          model: selectedModel.id,
          responseMode
        }),
      });

      if (!response.ok) {
        // Try to read error from body
        const errText = await response.text();
        let errMsg = 'Failed to send message';
        try {
          const errData = JSON.parse(errText);
          errMsg = errData.error || errData.details || errMsg;
        } catch { errMsg = errText || errMsg; }
        if (response.status === 429) {
          throw new Error('⏳ Rate limit exceeded. Please try again later.');
        }
        throw new Error(errMsg);
      }

      // Read thread/conversation IDs from response headers
      const threadIdFromHeader = response.headers.get('X-Thread-Id');

      // Consume the ReadableStream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      const decoder = new TextDecoder();
      let done = false;
      let chatIdExtracted = false;
      let leftover = '';

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          let chunk = decoder.decode(value, { stream: !done });

          // Strip __CHAT_ID__ metadata prefix from the first chunk(s)
          if (!chatIdExtracted) {
            chunk = leftover + chunk;
            leftover = '';
            const metaMatch = chunk.match(/^__CHAT_ID__:([^\n]+)\n/);
            if (metaMatch) {
              chunk = chunk.substring(metaMatch[0].length);
              chatIdExtracted = true;
              if (!chunk) continue;
            } else if (!chunk.includes('\n')) {
              leftover = chunk;
              continue;
            } else {
              chatIdExtracted = true;
            }
          }

          if (chunk) {
            // Append chunk to the last (assistant) message
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'assistant') {
                updated[updated.length - 1] = { ...last, content: last.content + chunk };
              }
              return updated;
            });
          }
        }
      }

      // After stream completes, update thread tracking
      if (threadIdFromHeader && !currentThread) {
        setCurrentThread(threadIdFromHeader);
      }
      // Always refresh threads to keep history in sync
      await loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove the empty assistant message and revert to pre-send state
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStarterPrompt = (prompt: typeof STARTER_PROMPTS[0]) => {
    setInput(prompt.description);
    inputRef.current?.focus();
  };

  return (
    <>
      <SEO
        title="AI Chat"
        description="Chat with AI models powered by advanced prompt engineering. Get instant, precise answers to your questions."
        url="https://d3jqm7so635aqb.cloudfront.net/chat"
      />
      <div className="flex h-[calc(100vh-4rem)] bg-[#f8f9fa] relative overflow-hidden">
      {/* Sidebar Component */}
      <ChatSidebar
        threads={threads}
        currentThreadId={currentThread}
        loading={loadingThreads}
        isOpen={isSidebarOpen}
        onNewChat={handleNewChat}
        onSelectThread={handleSelectThread}
        onDeleteThread={handleDeleteThread}
        onRefresh={loadThreads}
      />

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'ml-[280px]' : 'ml-0'
        }`}
      >
        {/* Toggle Sidebar Button */}
        <div className="absolute top-4 left-4 z-30">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-200/60 rounded-lg transition-colors"
            title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <PanelLeft className={`w-5 h-5 text-gray-500 transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
          <div className="max-w-[820px] mx-auto h-full flex flex-col px-6 py-8">
            {messages.length === 0 ? (
              // Empty State
              <div className="flex-1 flex flex-col items-center justify-center space-y-10">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl  to-indigo-600 flex items-center justify-center ">
                    <img src={proptimizerLogo} alt="Proptimizer" className="w-16 h-16 object-contain" />
                  </div>
                  <h1 className="text-3xl font-semibold text-gray-800 mb-2">
                    How can I help you today?
                  </h1>
                  <p className="text-gray-500 text-base">
                    Start a conversation or choose a prompt below
                  </p>
                </div>

                {/* Starter Prompts */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-[600px]">
                  {STARTER_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleStarterPrompt(prompt)}
                      className="p-4 text-left bg-white border border-gray-200/80 rounded-2xl hover:border-cyan-300 hover:bg-cyan-50/30 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-xl mt-0.5">{prompt.icon}</span>
                        <div>
                          <h3 className="font-medium text-gray-800 text-sm group-hover:text-cyan-700 transition-colors">
                            {prompt.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {prompt.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Messages List
              <div className="flex-1 space-y-8 pb-6">
                {messages.map((message, index) => (
                  <div key={index}>
                    {message.role === 'user' ? (
                      /* User Message — right-aligned bubble */
                      <div className="flex justify-end">
                        <div className="max-w-[85%] bg-gradient-to-r from-[#00bcd4] to-[#6366f1] text-white rounded-2xl px-5 py-3 shadow-sm">
                          <p className="whitespace-pre-wrap leading-relaxed text-[15px]">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Assistant Message — full width, clean layout like Gemini */
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full from-cyan-100 to-blue-100 flex items-center justify-center mt-1">
                          <img 
                            src={proptimizerLogo} 
                            alt="Proptimizer" 
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-gray-800">
                          {loading && message.role === 'assistant' && message.content === '' ? (
                            <div className="flex items-center gap-1.5 py-2">
                              <div className="w-2 h-2 bg-[#00bcd4] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-[#00bcd4] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-[#00bcd4] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          ) : (
                          <div className="prose prose-sm max-w-none prose-p:my-2 prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:border-0 prose-headings:mt-5 prose-headings:mb-2 prose-headings:font-semibold prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-hr:my-4">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                strong: ({node, children, ...props}) => (
                                  <strong className="font-bold text-[#00bcd4]" {...props}>{children}</strong>
                                ),
                                h1: ({node, children, ...props}) => (
                                  <h1 className="text-xl font-bold text-[#0097a7]" {...props}>{children}</h1>
                                ),
                                h2: ({node, children, ...props}) => (
                                  <h2 className="text-lg font-semibold text-[#0097a7]" {...props}>{children}</h2>
                                ),
                                h3: ({node, children, ...props}) => (
                                  <h3 className="text-base font-semibold text-[#0097a7]" {...props}>{children}</h3>
                                ),
                                pre: ({node, children, ...props}) => (
                                  <CodeBlockWrapper {...props}>{children}</CodeBlockWrapper>
                                ),
                                code: ({node, className: codeClassName, children, ...props}) => {
                                  const isInline = !codeClassName;
                                  return isInline ? (
                                    <code className="px-1.5 py-0.5 bg-cyan-50 text-[#0097a7] rounded-md text-[13px] font-mono" {...props}>{children}</code>
                                  ) : (
                                    <code className="text-gray-100" {...props}>{children}</code>
                                  );
                                },
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
                                      return parts.flatMap((part, i) => i === 0 ? [part] : [<br key={i} />, part]);
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
                                      return parts.flatMap((part, i) => i === 0 ? [part] : [<br key={i} />, part]);
                                    }
                                    if (Array.isArray(kids)) return kids.flatMap((c: any) => typeof c === 'string' ? processChildren(c) : [c]);
                                    return kids;
                                  };
                                  return <td className="border-b border-gray-100 px-4 py-2.5" {...props}>{processChildren(children)}</td>;
                                },
                                a: ({node, ...props}) => (
                                  <a className="text-[#00bcd4] hover:text-[#00838f] underline decoration-cyan-300 underline-offset-2 transition-colors" {...props} />
                                ),
                                blockquote: ({node, ...props}) => (
                                  <blockquote className="border-l-4 border-cyan-300 bg-cyan-50/50 pl-4 py-2 my-3 text-gray-700 italic rounded-r-lg" {...props} />
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="border-t border-red-100 bg-red-50/80 px-6 py-3">
            <div className="max-w-[820px] mx-auto flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-[#f8f9fa] px-6 py-4">
          <div className="max-w-[820px] mx-auto relative z-50">
            {/* Model & Mode Controls */}
            <div className="flex items-center gap-3 mb-3">
              {/* Model Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                >
                  <span className="text-sm font-medium text-gray-700">{selectedModel.name}</span>
                  <svg 
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isModelDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsModelDropdownOpen(false)} />
                    <div className="absolute bottom-full left-0 mb-2 min-w-[200px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
                      {AI_MODELS.map((modelOption) => (
                        <button
                          key={modelOption.id}
                          onClick={() => { setModel(modelOption.id); setIsModelDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            model === modelOption.id
                              ? 'bg-cyan-50 text-cyan-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {modelOption.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Response Mode Toggle */}
              <div className="inline-flex bg-white border border-gray-200 rounded-xl p-0.5">
                <button
                  onClick={() => setResponseMode('fast')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 border ${
                    responseMode === 'fast'
                      ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                      : 'bg-transparent text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Fast
                </button>
                <button
                  onClick={() => setResponseMode('full')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 border ${
                    responseMode === 'full'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-transparent text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Detailed
                </button>
              </div>
            </div>

            {/* Chat Input */}
            <div className="flex items-end gap-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-300 focus-within:shadow-md focus-within:border-cyan-300 px-4 py-3 transition-all duration-200">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Message Proptimizer..."
                rows={1}
                spellCheck={false}
                className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none text-gray-800 placeholder-gray-400 text-[15px] leading-relaxed max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                style={{ minHeight: '28px', height: 'auto' }}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  !input.trim() || loading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#00bcd4] to-[#6366f1] hover:shadow-lg hover:shadow-cyan-200/40 text-white hover:scale-105'
                }`}
                title="Send message"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </div>

            <p className="text-[11px] text-gray-400 text-center mt-2.5">
              Proptimizer can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </main>
      </div>
    </>
  );
}
