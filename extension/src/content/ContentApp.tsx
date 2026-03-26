import { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, Copy, CheckCircle, Loader2, X, ArrowLeft, LogIn, Replace, ArrowUp } from 'lucide-react';

type ViewState = 'menu' | 'loading' | 'result' | 'chat' | 'auth_required';

interface Position {
  left: number;
  top?: number;
  bottom?: number;
}

interface OptimizeResult {
  optimizedPrompt: string;
  mode: string;
  modeDescription: string;
  metrics: {
    tokensUsed: number;
    responseTime: string;
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ContentApp() {
  const [isVisible, setIsVisible] = useState(false);
  const [view, setView] = useState<ViewState>('menu');
  const [position, setPosition] = useState<Position>({ left: 0, top: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState<Range | null>(null); // CRITICAL: Store range for replace
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [replaced, setReplaced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // UI constants
  const EXPANDED_WIDTH = 380;
  const THRESHOLD = 500;
  const SAFETY_MARGIN = 10;

  /**
   * Anchor positioning calculation
   */
  const calculateAnchorPosition = (rect: DOMRect): Position => {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const isTopPlacement = spaceBelow < THRESHOLD;

    let left = rect.left + (rect.width / 2) - (EXPANDED_WIDTH / 2);
    
    if (left < SAFETY_MARGIN) {
      left = SAFETY_MARGIN;
    } else if (left + EXPANDED_WIDTH > viewportWidth - SAFETY_MARGIN) {
      left = viewportWidth - EXPANDED_WIDTH - SAFETY_MARGIN;
    }

    let verticalPosition: { top?: number; bottom?: number };
    
    if (isTopPlacement) {
      const bottomAnchor = viewportHeight - rect.top + SAFETY_MARGIN;
      verticalPosition = { bottom: bottomAnchor };
    } else {
      const topAnchor = rect.bottom + SAFETY_MARGIN;
      verticalPosition = { top: topAnchor };
    }

    return { left, ...verticalPosition };
  };

  // Listen for text selection
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0) {
        const range = selection!.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        const pos = calculateAnchorPosition(rect);

        setSelectedText(text);
        setSelectedRange(range.cloneRange()); // CRITICAL: Clone and store range
        setPosition(pos);
        setIsVisible(true);
        setView('menu');
        setResult(null);
        setError(null);
        setReplaced(false);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const clickedInsideContainer = containerRef.current.contains(e.target as Node);
      
      if (!clickedInsideContainer && isVisible && view === 'menu') {
        setIsVisible(false);
        setView('menu');
        setSelectedRange(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('mousedown', handleMouseDown, true);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp, true);
      document.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [isVisible, view]);

  // Recalculate position when view changes
  useEffect(() => {
    if (isVisible && containerRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        const newPos = calculateAnchorPosition(rect);
        setPosition(newPos);
      }
    }
  }, [view]);

  // Handle optimize
  const handleOptimize = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setView('loading');
    setError(null);

    await new Promise(resolve => setTimeout(resolve, 10));

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'OPTIMIZE_PROMPT',
        text: selectedText,
        mode: 'precision',
      });

      if (response && response.success) {
        setResult(response.data);
        setView('result');
      } else if (response && (response.errorCode === 'AUTH_REQUIRED' || response.errorCode === 'AUTH_EXPIRED')) {
        setError(response.error || 'Please log in to use Proptimizer');
        setView('auth_required');
      } else {
        setError(response?.error || 'Optimization failed. Please try again.');
        setView('menu');
      }
    } catch (err) {
      console.error('Exception:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      setView('menu');
    }
  };

  // Handle chat
  const handleOpenChat = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setView('chat');
    setError(null);
  };

  // Handle send chat message
  const handleSendMessage = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!chatInput.trim() || isSending) return;

    const userMessage = chatInput;
    setChatInput('');
    setIsSending(true);

    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // CRITICAL FIX: Fetch latest settings from chrome.storage RIGHT NOW (not stale state)
      const settings = await new Promise<{preferredModel?: string; preferredResponseMode?: string}>((resolve) => {
        chrome.storage.local.get(['preferredModel', 'preferredResponseMode'], (res) => {
          resolve(res);
        });
      });

      // Use fresh values from storage (defaults: deepseek-chat, full)
      const activeModel = settings.preferredModel || 'deepseek-chat';
      const activeMode = settings.preferredResponseMode || 'full';

      // Use PROCESS_CHAT to call the chat API with FRESH settings
      const response = await chrome.runtime.sendMessage({
        action: 'PROCESS_CHAT',
        text: selectedText,
        query: userMessage,
        model: activeModel,
        responseMode: activeMode
      });

      if (response && response.success) {
        const assistantText = response.data?.message || response.data?.reply || response.data?.optimizedPrompt || 'No response';
        setChatMessages(prev => [...prev, { role: 'assistant', content: assistantText }]);
      } else if (response && (response.errorCode === 'AUTH_REQUIRED' || response.errorCode === 'AUTH_EXPIRED')) {
        setError(response.error || 'Please log in to use chat');
        setView('auth_required');
      } else {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '❌ ' + (response?.error || 'Failed to send message. Please try again.')
        }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Connection error. Please check your internet and try again.'
      }]);
    } finally {
      setIsSending(false);
    }
  };

  // Handle copy
  const handleCopy = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (result) {
      try {
        await navigator.clipboard.writeText(result.optimizedPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }
  };

  // Handle replace selection
  const handleReplace = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!result || !selectedRange) {
      return;
    }

    try {
      
      // Delete old content
      selectedRange.deleteContents();
      
      // Insert new text
      const textNode = document.createTextNode(result.optimizedPrompt);
      selectedRange.insertNode(textNode);
      
      // Show success feedback
      setReplaced(true);
      setTimeout(() => {
        setReplaced(false);
        setIsVisible(false);
        setView('menu');
        setSelectedRange(null);
      }, 1500);
      
    } catch (err) {
      console.error('Replace failed:', err);
      setError('Failed to replace text. The page may not support editing.');
    }
  };

  // Handle back
  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setView('menu');
    setError(null);
  };

  // Handle close
  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsVisible(false);
    setView('menu');
    setResult(null);
    setError(null);
    setChatMessages([]);
    setSelectedRange(null);
  };

  // Handle open web app
  const handleOpenWebApp = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    window.open('https://d3jqm7so635aqb.cloudfront.net', '_blank');
  };

  if (!isVisible) return null;

  // Dynamic width
  const containerWidth = view === 'menu' || view === 'loading' || view === 'auth_required' ? 'auto' : `${EXPANDED_WIDTH}px`;

  // Build style
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${position.left}px`,
    ...(position.top !== undefined ? { top: `${position.top}px`, bottom: 'auto' } : {}),
    ...(position.bottom !== undefined ? { bottom: `${position.bottom}px`, top: 'auto' } : {}),
    zIndex: 2147483647,
    width: containerWidth,
    maxHeight: '80vh',
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className="proptimizer-container flex flex-col"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Menu View */}
      {view === 'menu' && (
        <div className="proptimizer-card proptimizer-menu animate-popIn">
          <div className="flex gap-2 whitespace-nowrap">
            <button
              onClick={handleOptimize}
              className="proptimizer-btn proptimizer-btn-primary"
            >
              <Sparkles className="w-4 h-4" />
              <span>Optimize</span>
            </button>
            <button
              onClick={handleOpenChat}
              className="proptimizer-btn proptimizer-btn-secondary"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat</span>
            </button>
            <button
              onClick={handleClose}
              className="proptimizer-icon-btn"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {error && (
            <div className="proptimizer-error mt-2">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Loading View */}
      {view === 'loading' && (
        <div className="proptimizer-card proptimizer-loading animate-fadeIn">
          <Loader2 className="proptimizer-spinner" />
          <div className="proptimizer-loading-text">
            <div className="proptimizer-loading-title">Optimizing with DeepSeek...</div>
            <div className="proptimizer-loading-subtitle">This may take a few seconds</div>
          </div>
        </div>
      )}

      {/* Auth Required View */}
      {view === 'auth_required' && (
        <div className="proptimizer-card animate-fadeIn" style={{ width: '320px' }}>
          <div className="proptimizer-auth-view">
            <div className="proptimizer-auth-header">
              <LogIn />
              <h3>Login Required</h3>
            </div>

            <div className="proptimizer-auth-message">
              {error || 'Please log in to use Proptimizer features.'}
            </div>

            <div className="proptimizer-auth-actions">
              <button
                onClick={handleOpenWebApp}
                className="proptimizer-btn proptimizer-btn-primary w-full"
                style={{ justifyContent: 'center' }}
              >
                <LogIn className="w-4 h-4" />
                <span>Open Web App to Login</span>
              </button>
              
              <div className="proptimizer-auth-note">
                After logging in, sync will happen automatically
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result View */}
      {view === 'result' && result && (
        <div className="proptimizer-card proptimizer-result animate-slideUp flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="proptimizer-header">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="proptimizer-icon-btn"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="proptimizer-header-title">
                <Sparkles className="proptimizer-header-icon" />
                Optimized Result
              </div>
            </div>
            <button
              onClick={handleClose}
              className="proptimizer-icon-btn"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="proptimizer-content">
            <span className="proptimizer-label">Mode: {result.mode}</span>
            <div className="proptimizer-text-box">
              {result.optimizedPrompt}
            </div>
          </div>

          {/* Footer Toolbar */}
          <div className="proptimizer-footer">
            <div className="proptimizer-footer-actions">
              <button
                onClick={handleCopy}
                className="proptimizer-btn proptimizer-btn-secondary"
                title="Copy to clipboard"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              
              {/* Replace Button */}
              <button
                onClick={handleReplace}
                className="proptimizer-btn proptimizer-btn-primary"
                title="Replace selected text"
                disabled={replaced}
              >
                {replaced ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Replaced!</span>
                  </>
                ) : (
                  <>
                    <Replace className="w-4 h-4" />
                    <span>Replace</span>
                  </>
                )}
              </button>
            </div>

            <div className="proptimizer-footer-meta">
              <span>{result.metrics.tokensUsed} tokens</span>
              <span>{result.metrics.responseTime}</span>
            </div>
          </div>
        </div>
      )}

      {/* Chat View */}
      {view === 'chat' && (
        <div className="proptimizer-card proptimizer-chat animate-slideUp flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="proptimizer-header">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="proptimizer-icon-btn"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="proptimizer-header-title">
                <MessageSquare className="proptimizer-header-icon" />
                Chat Assistant
              </div>
            </div>
            <button
              onClick={handleClose}
              className="proptimizer-icon-btn"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="proptimizer-messages">
            {chatMessages.length === 0 ? (
              <div className="proptimizer-empty-state">
                <MessageSquare />
                <p>Start a conversation about your selected text</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`proptimizer-message ${
                    msg.role === 'user' ? 'proptimizer-message-user' : 'proptimizer-message-assistant'
                  }`}
                >
                  <div className="proptimizer-message-bubble">
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Area with Internal Send Button */}
          <div className="proptimizer-chat-input-wrapper">
            <div className="relative flex-1">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type your message..."
                className="proptimizer-chat-input"
                disabled={isSending}
                rows={1}
                style={{ paddingRight: '44px' }}
              />
              
              {/* Send Button (Positioned Inside Input) */}
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isSending}
                className={
                  !chatInput.trim() || isSending
                    ? "absolute right-2 bottom-2 w-8 h-8 bg-gray-400 opacity-40 cursor-not-allowed rounded-full p-2 flex items-center justify-center transition-all duration-200"
                    : "absolute right-2 bottom-2 w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 rounded-full p-2 flex items-center justify-center transition-all duration-200 ease-in-out"
                }
                title="Send message"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4 text-white stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
