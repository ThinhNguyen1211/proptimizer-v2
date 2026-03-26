/**
 * PROPTIMIZER CONTENT SCRIPT
 * Clean Implementation with Lightning Logo
 */

const EXTENSION_STYLES = `
  #proptimizer-root {
    all: initial;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2147483647;
    pointer-events: none;
  }
  
  #proptimizer-root * {
    box-sizing: border-box;
    pointer-events: auto;
  }
  
  .proptimizer-floating-btn {
    position: absolute;
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #00bcd4 0%, #6366f1 100%);
    border: none;
    outline: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(0, 188, 212, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    animation: proptimizer-pop-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    z-index: 2147483647;
    padding: 0;
    margin: 0;
    pointer-events: auto;
  }
  
  .proptimizer-floating-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 188, 212, 0.5), 0 3px 10px rgba(0, 0, 0, 0.15);
  }
  
  .proptimizer-floating-btn:active {
    transform: scale(0.95);
  }
  
  .proptimizer-floating-btn svg {
    width: 28px;
    height: 28px;
  }
  
  .proptimizer-menu-card {
    position: absolute;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    pointer-events: auto;
  }
  
  /* Mode: Transparent (for Action Menu) */
  .proptimizer-mode-transparent {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
    animation: proptimizer-menu-appear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Mode: Card (for Loading & Result) */
  .proptimizer-mode-card {
    background: white;
    border: 1px solid #e5e7eb;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
    border-radius: 14px;
    padding: 0;
    animation: proptimizer-slide-up 0.2s ease-out;
    overflow: hidden;
  }
  
  .proptimizer-menu-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .proptimizer-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    border: none;
    outline: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    user-select: none;
  }
  
  .proptimizer-btn:active {
    transform: scale(0.98);
  }
  
  .proptimizer-btn-primary {
    background: linear-gradient(135deg, #00bcd4 0%, #6366f1 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(0, 188, 212, 0.4);
    border: none;
  }
  
  .proptimizer-btn-primary:hover {
    box-shadow: 0 8px 16px rgba(0, 188, 212, 0.5);
    transform: translateY(-2px);
  }
  
  .proptimizer-btn-secondary {
    background: rgba(255, 255, 255, 0.95);
    color: #1f2937;
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .proptimizer-btn-secondary:hover {
    background: white;
    box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
  
  .proptimizer-btn svg {
    width: 16px;
    height: 16px;
    stroke-width: 2;
  }
  
  .proptimizer-btn-logo {
    width: 20px;
    height: 20px;
    filter: brightness(0) invert(1);
  }
  
  .proptimizer-loading {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
  }
  
  .proptimizer-spinner {
    width: 20px;
    height: 20px;
    stroke: #00bcd4;
    animation: proptimizer-spin 1s linear infinite;
  }
  
  .proptimizer-loading-text {
    font-size: 14px;
    color: #111827;
    font-weight: 500;
  }
  
  @keyframes proptimizer-pop-in {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    60% {
      transform: scale(1.15);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes proptimizer-slide-up {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes proptimizer-menu-appear {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes proptimizer-spin {
    to { transform: rotate(360deg); }
  }
  
  .proptimizer-result-container {
    min-width: 360px;
    max-width: 520px;
  }
  
  .proptimizer-chat-container {
    width: 440px;
    max-height: 700px;
    display: flex;
    flex-direction: column;
    min-width: 320px;
    min-height: 300px;
  }
  
  .proptimizer-chat-messages {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    max-height: 500px;
    min-height: 200px;
  }
  
  /* Resize handle */
  .proptimizer-resize-handle {
    position: absolute;
    width: 18px;
    height: 18px;
    bottom: 0;
    right: 0;
    cursor: nwse-resize;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0 0 14px 0;
  }
  
  .proptimizer-resize-handle::after {
    content: '';
    display: block;
    width: 10px;
    height: 10px;
    border-right: 2px solid #c5c5c5;
    border-bottom: 2px solid #c5c5c5;
    margin: 0 2px 2px 0;
  }
  
  .proptimizer-resize-handle:hover::after {
    border-color: #00bcd4;
  }
  
  .proptimizer-chat-message {
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
  }
  
  .proptimizer-chat-message-system {
    align-items: flex-start;
  }
  
  .proptimizer-chat-bubble {
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.5;
    max-width: 85%;
  }
  
  .proptimizer-chat-bubble-system {
    background: #f3f4f6;
    color: #6b7280;
    border-bottom-left-radius: 4px;
  }
  
  .proptimizer-message-row {
    display: flex;
    margin-bottom: 12px;
  }
  
  .proptimizer-message-row-user {
    justify-content: flex-end;
  }
  
  .proptimizer-message-row-ai {
    justify-content: flex-start;
  }
  
  .proptimizer-message-row-error {
    justify-content: center;
  }
  
  .proptimizer-chat-bubble-user {
    background: linear-gradient(135deg, #00bcd4 0%, #6366f1 100%);
    color: white;
    border-radius: 12px;
    border-bottom-right-radius: 4px;
    max-width: 80%;
    padding: 10px 14px;
    font-size: 14px;
    line-height: 1.5;
    word-wrap: break-word;
    white-space: pre-wrap;
  }
  
  .proptimizer-chat-bubble-ai {
    background: #f9fafb;
    color: #1f2937;
    border-radius: 12px;
    border-bottom-left-radius: 4px;
    max-width: 95%;
    padding: 10px 14px;
    font-size: 14px;
    line-height: 1.5;
    word-wrap: break-word;
  }
  
  /* Markdown table styles */
  .proptimizer-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 13px;
    border: 1px solid #e5e7eb;
  }
  
  .proptimizer-table th {
    background: #f9fafb;
    font-weight: 600;
    padding: 8px;
    border: 1px solid #e5e7eb;
    text-align: left;
  }
  
  .proptimizer-table td {
    padding: 8px;
    border: 1px solid #e5e7eb;
  }
  
  /* Markdown list styles */
  .proptimizer-list {
    list-style-type: disc;
    padding-left: 20px;
    margin: 8px 0;
  }
  
  .proptimizer-chat-bubble-ai ul,
  .proptimizer-chat-bubble-ai ol {
    padding-left: 20px;
    margin: 8px 0;
  }
  
  .proptimizer-chat-bubble-ai ol {
    list-style-type: decimal;
  }
  
  .proptimizer-chat-bubble-ai ul {
    list-style-type: disc;
  }
  
  .proptimizer-chat-bubble-ai li {
    margin: 4px 0;
  }
  
  .proptimizer-chat-bubble-ai p {
    margin: 0 0 8px 0;
  }
  
  .proptimizer-chat-bubble-ai p:last-child {
    margin-bottom: 0;
  }
  
  .proptimizer-chat-bubble-ai strong {
    font-weight: 700;
    color: #0097a7;
  }
  
  .proptimizer-chat-bubble-ai h1,
  .proptimizer-chat-bubble-ai h2,
  .proptimizer-chat-bubble-ai h3,
  .proptimizer-chat-bubble-ai h4,
  .proptimizer-chat-bubble-ai h5,
  .proptimizer-chat-bubble-ai h6 {
    font-weight: 700;
    color: #0097a7;
    margin: 12px 0 8px 0;
    line-height: 1.3;
  }
  
  .proptimizer-chat-bubble-ai h1 { font-size: 18px; }
  .proptimizer-chat-bubble-ai h2 { font-size: 16px; }
  .proptimizer-chat-bubble-ai h3 { font-size: 15px; }
  .proptimizer-chat-bubble-ai h4 { font-size: 14px; }
  
  .proptimizer-chat-bubble-ai hr {
    border: none;
    border-top: 1px solid #d1d5db;
    margin: 12px 0;
  }
  
  .proptimizer-chat-bubble-ai code {
    background: #ecfeff;
    color: #0097a7;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
  }
  
  .proptimizer-chat-bubble-ai pre {
    background: #1f2937;
    color: #f3f4f6;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 8px 0;
    position: relative;
  }
  
  .proptimizer-chat-bubble-ai pre code {
    background: none;
    padding: 0;
    color: #f3f4f6;
    font-weight: normal;
    font-style: normal;
  }
  
  .proptimizer-code-block-wrapper code,
  .proptimizer-code-block-wrapper code * {
    color: #f3f4f6 !important;
    font-weight: normal !important;
    font-style: normal !important;
    background: none !important;
  }
  
  /* Code block wrapper with copy button - ChatGPT style */
  .proptimizer-code-block-wrapper {
    position: relative;
    margin: 8px 0;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #374151;
  }
  
  .proptimizer-code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    background: #1f2937;
    border-bottom: 1px solid #374151;
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  
  .proptimizer-code-lang {
    color: #e5e7eb;
    font-weight: 500;
    text-transform: capitalize;
  }
  
  .proptimizer-copy-code-btn {
    display: flex;
    align-items: center;
    padding: 4px;
    font-size: 0;
    background: transparent;
    color: #9ca3af;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .proptimizer-copy-code-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f3f4f6;
  }
  
  .proptimizer-copy-code-btn svg {
    width: 14px;
    height: 14px;
  }
  
  .proptimizer-code-block-wrapper pre {
    margin: 0 !important;
    border-radius: 0 !important;
    border: none !important;
  }
  
  .proptimizer-chat-bubble-ai a {
    color: #2563eb;
    text-decoration: underline;
  }
  
  .proptimizer-chat-bubble-ai a:hover {
    color: #1d4ed8;
  }
  
  /* Math/LaTeX styles */
  .proptimizer-math-block {
    display: block;
    text-align: center;
    padding: 8px 12px;
    margin: 8px 0;
    background: #f0fdfa;
    border-radius: 6px;
    font-family: 'Cambria Math', 'Times New Roman', serif;
    font-size: 15px;
    line-height: 1.6;
    overflow-x: auto;
  }
  
  .proptimizer-math-inline {
    font-family: 'Cambria Math', 'Times New Roman', serif;
    font-size: 14px;
    padding: 0 2px;
    color: #0f766e;
  }
  
  .proptimizer-math-frac {
    display: inline-flex;
    align-items: center;
    font-size: 0.9em;
  }
  
  .proptimizer-math-num,
  .proptimizer-math-den {
    padding: 0 1px;
  }
  
  .proptimizer-chat-bubble-error {
    background: #fee2e2;
    color: #dc2626;
    border-radius: 12px;
    padding: 10px 14px;
    font-size: 13px;
    line-height: 1.5;
  }
  
  .proptimizer-typing-indicator {
    display: flex;
    gap: 4px;
    padding: 10px 14px;
    background: #f3f4f6;
    border-radius: 12px;
    border-bottom-left-radius: 4px;
    width: fit-content;
  }
  
  .proptimizer-typing-dot {
    width: 8px;
    height: 8px;
    background: #9ca3af;
    border-radius: 50%;
    animation: proptimizer-typing-pulse 1.4s infinite;
  }
  
  .proptimizer-typing-dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .proptimizer-typing-dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes proptimizer-typing-pulse {
    0%, 60%, 100% {
      opacity: 0.3;
      transform: scale(0.8);
    }
    30% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .proptimizer-chat-input-area {
    padding: 12px 16px;
    border-top: 1px solid #e5e7eb;
    background: white !important;
    display: flex;
    gap: 8px;
    align-items: flex-end;
    border-radius: 0 0 14px 14px;
  }
  
  .proptimizer-chat-textarea {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    outline: none;
    resize: none;
    min-height: 44px;
    max-height: 100px;
    transition: border-color 0.2s;
    background: white !important;
    color: #1f2937 !important;
    -webkit-text-fill-color: #1f2937 !important;
    -webkit-appearance: none;
    appearance: none;
    line-height: 1.5;
    letter-spacing: normal;
    text-transform: none;
    text-indent: 0;
    text-shadow: none;
    text-decoration: none;
    box-shadow: none;
  }
  
  .proptimizer-chat-textarea:focus {
    border-color: #00bcd4;
    background: white !important;
    color: #1f2937 !important;
    -webkit-text-fill-color: #1f2937 !important;
  }
  
  .proptimizer-chat-textarea::placeholder {
    color: #9ca3af !important;
    -webkit-text-fill-color: #9ca3af !important;
    opacity: 1;
  }
  
  .proptimizer-chat-send-btn {
    width: 32px;
    height: 32px;
    padding: 6px;
    background: linear-gradient(135deg, #00bcd4 0%, #6366f1 100%);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  
  .proptimizer-chat-send-btn:hover {
    box-shadow: 0 0 16px rgba(0, 188, 212, 0.5);
    transform: scale(1.05);
  }
  
  .proptimizer-chat-send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .proptimizer-chat-send-btn svg {
    width: 16px;
    height: 16px;
    stroke: white;
  }
  
  .proptimizer-result-title {
    font-size: 14px;
    font-weight: 600;
    color: #0097a7;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .proptimizer-result-title svg {
    width: 18px;
    height: 18px;
    stroke: #00bcd4;
  }
  
  .proptimizer-result-content {
    padding: 16px;
    max-height: 320px;
    overflow-y: auto;
  }
  
  .proptimizer-result-text {
    font-size: 14px;
    line-height: 1.6;
    color: #374151;
    background: #f9fafb;
    padding: 12px;
    border-radius: 8px;
    word-wrap: break-word;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .proptimizer-result-text p {
    margin: 0 0 8px 0;
  }
  
  .proptimizer-result-text p:last-child {
    margin-bottom: 0;
  }
  
  .proptimizer-result-text strong {
    font-weight: 700;
    color: #0097a7;
  }
  
  .proptimizer-result-text em {
    font-style: italic;
  }
  
  .proptimizer-result-text ul {
    list-style-type: disc;
    padding-left: 20px;
    margin: 8px 0;
  }
  
  .proptimizer-result-text ol {
    list-style-type: decimal;
    padding-left: 20px;
    margin: 8px 0;
  }
  
  .proptimizer-result-text li {
    margin: 4px 0;
  }
  
  .proptimizer-result-text code {
    background: #e5e7eb;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
  }
  
  .proptimizer-result-text pre {
    background: #1f2937;
    color: #f3f4f6;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 8px 0;
    position: relative;
  }
  
  .proptimizer-result-text pre code {
    background: none;
    padding: 0;
    color: inherit;
  }
  
  .proptimizer-result-text h1,
  .proptimizer-result-text h2,
  .proptimizer-result-text h3,
  .proptimizer-result-text h4,
  .proptimizer-result-text h5,
  .proptimizer-result-text h6 {
    font-weight: 700;
    color: #0097a7;
    margin: 12px 0 8px 0;
    line-height: 1.3;
  }
  
  .proptimizer-result-text h1 { font-size: 18px; }
  .proptimizer-result-text h2 { font-size: 16px; }
  .proptimizer-result-text h3 { font-size: 15px; }
  .proptimizer-result-text h4 { font-size: 14px; }
  
  .proptimizer-result-text hr {
    border: none;
    border-top: 1px solid #d1d5db;
    margin: 12px 0;
  }
  
  .proptimizer-result-footer {
    padding: 12px 16px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  
  .proptimizer-btn-outline {
    background: white;
    color: #00bcd4;
    border: 2px solid #00bcd4;
  }
  
  .proptimizer-btn-outline:hover {
    background: #f3f4f6;
    transform: translateY(-1px);
  }
  
  /* Lock button */
  .proptimizer-lock-btn {
    width: 28px;
    height: 28px;
    padding: 4px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    color: #9ca3af;
  }
  
  .proptimizer-lock-btn:hover {
    background: rgba(0, 188, 212, 0.1);
    color: #00bcd4;
  }
  
  .proptimizer-lock-btn.locked {
    color: #00bcd4;
  }
  
  .proptimizer-lock-btn svg {
    width: 16px;
    height: 16px;
  }
  
  /* Drag handle */
  .proptimizer-drag-handle {
    cursor: move;
    flex: 1;
    user-select: none;
    -webkit-user-select: none;
  }
  
  /* Header with controls */
  .proptimizer-header-controls {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  /* Gradient text animation */
  .proptimizer-gradient-text {
    background: linear-gradient(135deg, #64ffda, #00bcd4, #6366f1, #64ffda);
    background-size: 300% 300%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: proptimizer-gradient-shift 8s ease infinite;
    font-weight: 700;
  }
  
  @keyframes proptimizer-gradient-shift {
    0% { background-position: 0% 50%; }
    25% { background-position: 50% 50%; }
    50% { background-position: 100% 50%; }
    75% { background-position: 50% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  /* Streaming result */
  .proptimizer-streaming-cursor::after {
    content: '▊';
    animation: proptimizer-blink 0.8s infinite;
    color: #00bcd4;
    font-weight: 400;
  }
  
  @keyframes proptimizer-blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  /* Enhanced header */
  .proptimizer-result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid rgba(0, 188, 212, 0.15);
    background: linear-gradient(135deg, rgba(0, 188, 212, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);
    cursor: move;
    user-select: none;
    -webkit-user-select: none;
  }

  .proptimizer-result-header:active {
    cursor: move;
  }
  
  .proptimizer-btn.proptimizer-btn-success {
    background: #10b981;
    color: white;
    border: 2px solid #10b981;
  }
`;

// ==================== SVG ICONS ====================
const ICONS = {
  logo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <defs>
      <linearGradient id="lightning-main" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#64ffda" />
        <stop offset="50%" style="stop-color:#6366f1" />
        <stop offset="100%" style="stop-color:#a855f7" />
      </linearGradient>
    </defs>
    <g transform="translate(20, 20)">
      <path d="M -8 -18 L 5 -5 L -1 -5 L 8 18 L -5 5 L 1 5 Z" fill="url(#lightning-main)" stroke="#ffffff" stroke-width="0.5" opacity="0.95"/>
      <path d="M -4 -12 L 2 -7 L -0.2 -7 L 4 12 L -2 7 L 0.2 7 Z" fill="#ffffff" opacity="0.9" />
    </g>
  </svg>`,
  
  sparkles: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4M19 17v4M3 5h4M17 19h4"/></svg>`,
  
  chat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  
  x: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  
  check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>`,
  
  copy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  
  replace: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>`,
  
  send: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  
  arrowUp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>`,
  
  loader: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>`,
  
  pin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>`,
  
  pinOff: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><line x1="12" y1="17" x2="12" y2="22"/><path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h12"/><path d="M15 9.34V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v2"/></svg>`,
  
  grip: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/></svg>`
};

// ==================== MAIN CLASS ====================
class ProptimizerExtension {
  constructor() {
    this.state = 'HIDDEN';
    this.selectedText = '';
    this.selectedRange = null;
    this.container = null;
    this.shadowRoot = null; // Shadow DOM reference
    this.selectionRect = null;
    this.optimizedResult = null;
    this.copiedTimeout = null;
    this.currentChatId = null;
    this.isLocked = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    
    this.init();
  }
  
  init() {
    this.createContainer();
    
    document.addEventListener('mouseup', (e) => {
      // Check if click is inside Shadow DOM
      if (this.isInsideShadowDOM(e)) {
        return;
      }
      setTimeout(() => this.handleTextSelection(), 50);
    });
    
    document.addEventListener('mousedown', (e) => this.handleClickOutside(e));
    
    // Keyboard shortcut listener (Ctrl+Q, can be disabled)
    document.addEventListener('keydown', async (e) => {
      if (this.shortcutEnabled === false) return; // disabled by user
      
      if (e.ctrlKey && e.key.toLowerCase() === 'q' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        
        if (this.state === 'CHAT') {
          // Already open, close it
          this.close();
        } else {
          // Check auth before opening chat
          try {
            const storage = await new Promise(resolve => chrome.storage.local.get(['accessToken', 'idToken', 'tokenExpiry'], resolve));
            const hasTokens = !!(storage.accessToken && storage.idToken);
            const isExpired = storage.tokenExpiry && Date.now() > storage.tokenExpiry;
            if (!hasTokens || isExpired) {
              this.selectedText = '';
              this.selectionRect = { top: 16, left: window.innerWidth - 320, bottom: 16, right: window.innerWidth - 16, width: 0, height: 0 };
              this.showAuthRequiredCard(!!isExpired);
              return;
            }
          } catch (_) {}
          
          // Open chat at top-right corner
          this.selectedText = '';
          this.selectionRect = {
            top: 16,
            left: window.innerWidth - 420,
            bottom: 16,
            right: window.innerWidth - 16,
            width: 0,
            height: 0
          };
          this.showChatUI();
        }
      }
    });
    
    // Load shortcut enabled state from storage
    try {
      chrome.storage.sync.get(['shortcutEnabled'], (result) => {
        if (result.shortcutEnabled !== undefined) this.shortcutEnabled = result.shortcutEnabled;
      });
    } catch (err) {}
  }
  
  // Helper to check if event is inside Shadow DOM
  isInsideShadowDOM(event) {
    if (!this.shadowRoot) return false;
    
    const path = event.composedPath();
    for (const element of path) {
      // Check if clicked on shadow root itself
      if (element === this.shadowRoot) {
        return true;
      }
      // Check if element is a Node before calling contains (composedPath includes Window object)
      if (element instanceof Node && this.shadowRoot.contains(element)) {
        return true;
      }
    }
    return false;
  }
  
  injectStyles() {
    // Styles are now injected into Shadow DOM, not document.head
    if (this.shadowRoot) {
      const styleId = 'proptimizer-extension-styles';
      if (this.shadowRoot.getElementById(styleId)) return;
      
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = EXTENSION_STYLES;
      this.shadowRoot.appendChild(style);
    }
  }
  
  createContainer() {
    if (this.container && this.shadowRoot) return;
    
    // Create host element that covers the entire viewport
    const hostElement = document.createElement('div');
    hostElement.id = 'proptimizer-extension-root';
    hostElement.style.cssText = `
      all: initial;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2147483647;
      pointer-events: none;
      display: block;
    `;
    document.body.appendChild(hostElement);
    
    // Attach Shadow DOM
    this.shadowRoot = hostElement.attachShadow({ mode: 'open' });
    
    // Inject styles into Shadow DOM
    this.injectStyles();
    
    // Create container inside Shadow DOM with pointer-events enabled
    this.container = document.createElement('div');
    this.container.id = 'proptimizer-root';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `;
    this.shadowRoot.appendChild(this.container);
    
    // Event delegation for copy code buttons inside Shadow DOM
    this.shadowRoot.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-copy-code]');
      if (!btn) return;
      const wrapper = btn.closest('.proptimizer-code-block-wrapper');
      if (!wrapper) return;
      const codeEl = wrapper.querySelector('code');
      if (!codeEl) return;
      const codeText = codeEl.textContent || '';
      
      const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
      const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      
      // Try modern clipboard API first, fallback to execCommand
      const doCopy = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(text);
        }
        return new Promise((resolve) => {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          resolve();
        });
      };
      
      doCopy(codeText).then(() => {
        btn.innerHTML = `${checkIcon} Copied!`;
        setTimeout(() => { btn.innerHTML = `${copyIcon} Copy`; }, 1500);
      });
    });
  }
  
  handleTextSelection() {
    const activeEl = document.activeElement;
    const isInputElement = activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT');
    
    let text = '';
    
    if (isInputElement) {
      // For textarea/input, use selectionStart/selectionEnd
      const start = activeEl.selectionStart;
      const end = activeEl.selectionEnd;
      if (start !== end && activeEl.value) {
        text = activeEl.value.substring(start, end).trim();
      }
    } else {
      const selection = window.getSelection();
      text = selection?.toString().trim() || '';
    }
    
    if (!text || text.length === 0) {
      // Don't close if panel is locked (chat/result)
      if (this.state !== 'HIDDEN' && !this.isLocked) {
        this.close();
      }
      return;
    }
    
    // Don't interrupt locked panels
    if (this.isLocked && (this.state === 'CHAT' || this.state === 'RESULT')) return;
    
    this.selectedText = text;
    
    try {
      if (isInputElement) {
        // For input/textarea, use the element's bounding rect
        const elRect = activeEl.getBoundingClientRect();
        this.selectedRange = null;
        this.selectionRect = {
          top: elRect.top,
          bottom: elRect.bottom,
          left: elRect.left,
          right: elRect.right,
          width: elRect.width,
          height: elRect.height
        };
      } else {
        const selection = window.getSelection();
        this.selectedRange = selection.getRangeAt(0).cloneRange();
        this.selectionRect = selection.getRangeAt(0).getBoundingClientRect();
      }
    } catch (e) {
      // Fallback: use active element or mouse position
      if (activeEl) {
        const elRect = activeEl.getBoundingClientRect();
        this.selectedRange = null;
        this.selectionRect = {
          top: elRect.top,
          bottom: elRect.bottom,
          left: elRect.left,
          right: elRect.right,
          width: elRect.width,
          height: elRect.height
        };
      } else {
        return;
      }
    }
    
    this.showFloatingButton();
  }
  
  showFloatingButton() {
    this.state = 'ICON';
    
    const button = document.createElement('button');
    button.className = 'proptimizer-floating-btn';
    button.innerHTML = ICONS.logo;
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', 'Open Proptimizer');
    
    const rect = this.selectionRect;
    const buttonSize = 48;
    const x = rect.left + (rect.width / 2) - (buttonSize / 2);
    const y = rect.bottom + 10;
    
    button.style.left = x + 'px';
    button.style.top = y + 'px';
    
    const self = this;
    button.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.checkAuthAndShowMenu();
    };
    
    this.container.innerHTML = '';
    this.container.appendChild(button);
  }
  
  async checkAuthAndShowMenu() {
    try {
      const storage = await chrome.storage.local.get(['accessToken', 'idToken', 'tokenExpiry']);
      const hasTokens = !!(storage.accessToken && storage.idToken);
      const isExpired = storage.tokenExpiry && Date.now() > storage.tokenExpiry;
      
      if (!hasTokens || isExpired) {
        this.showAuthRequiredCard(isExpired);
        return;
      }
    } catch (_) {}
    this.showActionMenu();
  }
  
  showAuthRequiredCard(isExpired) {
    this.state = 'MENU';
    
    const card = document.createElement('div');
    card.className = 'proptimizer-menu-card proptimizer-mode-card';
    card.style.cssText = 'padding: 20px 24px; text-align: center; max-width: 280px;';
    
    const icon = document.createElement('div');
    icon.style.cssText = 'font-size: 28px; margin-bottom: 10px;';
    icon.textContent = isExpired ? '🔄' : '🔑';
    
    const title = document.createElement('div');
    title.style.cssText = 'font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 6px;';
    title.textContent = isExpired ? 'Session Expired' : 'Sign In Required';
    
    const desc = document.createElement('div');
    desc.style.cssText = 'font-size: 12px; color: #6b7280; line-height: 1.5; margin-bottom: 14px;';
    desc.textContent = isExpired 
      ? 'Your session has expired. Open the web app to reconnect.' 
      : 'Sign in on the Proptimizer web app to use this feature.';
    
    const btn = document.createElement('a');
    btn.href = 'https://d3jqm7so635aqb.cloudfront.net';
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.textContent = isExpired ? 'Reconnect →' : 'Open Web App →';
    btn.style.cssText = 'display: inline-block; padding: 8px 20px; background: linear-gradient(135deg, #06b6d4, #6366f1); color: white; border-radius: 10px; font-size: 12px; font-weight: 600; text-decoration: none; cursor: pointer; transition: opacity 0.2s;';
    btn.onmouseenter = () => { btn.style.opacity = '0.9'; };
    btn.onmouseleave = () => { btn.style.opacity = '1'; };
    
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size: 10px; color: #9ca3af; margin-top: 10px;';
    hint.textContent = 'Extension syncs automatically after sign in';
    
    card.appendChild(icon);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(btn);
    card.appendChild(hint);
    
    this.positionCard(card);
    this.container.innerHTML = '';
    this.container.appendChild(card);
  }
  
  showActionMenu() {
    this.state = 'MENU';
    
    const card = document.createElement('div');
    card.className = 'proptimizer-menu-card proptimizer-mode-transparent';
    
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'proptimizer-menu-actions';
    
    const self = this;
    
    // Optimize Button with Logo
    const optimizeBtn = document.createElement('button');
    optimizeBtn.className = 'proptimizer-btn proptimizer-btn-primary';
    optimizeBtn.setAttribute('type', 'button');
    
    const logoImg = document.createElement('img');
    logoImg.className = 'proptimizer-btn-logo';
    logoImg.src = chrome.runtime.getURL('assets/proptimizer-48x48.svg');
    logoImg.alt = 'Proptimizer';
    
    const optimizeText = document.createElement('span');
    optimizeText.textContent = 'Optimize';
    
    optimizeBtn.appendChild(logoImg);
    optimizeBtn.appendChild(optimizeText);
    
    optimizeBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.handleOptimize();
    };
    
    // Ask Proptimizer Button
    const chatBtn = document.createElement('button');
    chatBtn.className = 'proptimizer-btn proptimizer-btn-secondary';
    chatBtn.innerHTML = `${ICONS.chat}<span class="proptimizer-gradient-text">Ask Proptimizer</span>`;
    chatBtn.setAttribute('type', 'button');
    chatBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.handleChat();
    };
    
    actionsContainer.appendChild(optimizeBtn);
    actionsContainer.appendChild(chatBtn);
    card.appendChild(actionsContainer);
    
    this.positionCard(card);
    
    this.container.innerHTML = '';
    this.container.appendChild(card);
  }
  
  positionCard(card) {
    const rect = this.selectionRect;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Measure card size by temporarily adding to shadow DOM
    card.style.visibility = 'hidden';
    card.style.position = 'absolute';
    this.shadowRoot.appendChild(card);
    const cardWidth = card.offsetWidth;
    const cardHeight = card.offsetHeight;
    this.shadowRoot.removeChild(card);
    card.style.visibility = 'visible';
    
    // Calculate horizontal position (centered on selection)
    let x = rect.left + (rect.width / 2) - (cardWidth / 2);
    
    // Keep within viewport bounds
    if (x < 10) x = 10;
    if (x + cardWidth > viewportWidth - 10) {
      x = viewportWidth - cardWidth - 10;
    }
    
    // Calculate vertical position
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const margin = 10;
    let y;
    
    if (spaceBelow >= cardHeight + margin) {
      // Enough space below selection
      y = rect.bottom + margin;
    } else if (spaceAbove >= cardHeight + margin) {
      // Enough space above selection
      y = rect.top - cardHeight - margin;
    } else {
      // Not enough space either way — position to show as much as possible
      // Prefer above if more space, otherwise push to top with margin
      if (spaceAbove > spaceBelow) {
        y = Math.max(margin, rect.top - cardHeight - margin);
      } else {
        y = margin;
      }
    }
    
    // Final clamp: always ensure card top is at least 10px from viewport top
    // and card bottom is at least 10px from viewport bottom
    if (y < margin) y = margin;
    if (y + cardHeight > viewportHeight - margin) {
      y = viewportHeight - cardHeight - margin;
    }
    // If card is taller than viewport, pin to top
    if (y < margin) y = margin;
    
    card.style.left = x + 'px';
    card.style.top = y + 'px';
  }
  
  showLoading() {
    this.state = 'LOADING';
    
    const card = document.createElement('div');
    card.className = 'proptimizer-menu-card proptimizer-mode-card';
    
    const loading = document.createElement('div');
    loading.className = 'proptimizer-loading';
    loading.innerHTML = `
      <div class="proptimizer-spinner">${ICONS.loader}</div>
      <div class="proptimizer-loading-text">Optimizing...</div>
    `;
    
    card.appendChild(loading);
    this.positionCard(card);
    
    this.container.innerHTML = '';
    this.container.appendChild(card);
  }
  
  async handleOptimize() {
    if (!this.selectedText) {
      return;
    }
    
    this.showLoading();
    
    // Get optimization mode from storage
    const settings = await chrome.storage.sync.get('optimizationMode');
    const mode = settings.optimizationMode || 'precision';
    
    const self = this;
    let streamedText = '';
    let hasShownResult = false;
    
    try {
      // Use port-based streaming for real-time updates
      const port = chrome.runtime.connect({ name: 'optimize-stream' });
      
      port.onMessage.addListener(function(msg) {
        if (msg.type === 'chunk') {
          streamedText += msg.text;
          
          // Switch to result view on first chunk
          if (!hasShownResult) {
            hasShownResult = true;
            self.showStreamingResultUI(streamedText);
          } else {
            // Update existing result text
            self.updateStreamingText(streamedText);
          }
        } else if (msg.type === 'done') {
          // Remove streaming cursor and finalize
          self.finalizeStreamingResult(streamedText);
          self.optimizedResult = { success: true, data: { optimizedPrompt: streamedText } };
          port.disconnect();
        } else if (msg.type === 'error') {
          console.error('Optimize stream error:', msg.error);
          if (msg.errorCode === 'AUTH_EXPIRED' || msg.errorCode === 'AUTH_REQUIRED') {
            // Show auth error in result card instead of just closing
            if (!hasShownResult) {
              hasShownResult = true;
              self.showStreamingResultUI('');
            }
            const textDiv = self.shadowRoot?.getElementById('proptimizer-streaming-text');
            if (textDiv) {
              textDiv.classList.remove('proptimizer-streaming-cursor');
              textDiv.innerHTML = '<div style="text-align:center;padding:16px 0;">' +
                '<div style="font-size:24px;margin-bottom:8px;">⚠️</div>' +
                '<div style="font-size:13px;color:#991b1b;margin-bottom:12px;">Session expired. Please log in on the web app to continue.</div>' +
                '<a href="https://d3jqm7so635aqb.cloudfront.net" target="_blank" rel="noopener noreferrer" ' +
                'style="display:inline-block;padding:8px 16px;background:linear-gradient(135deg,#00bcd4,#6366f1);color:white;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;">Open Web App to Login →</a>' +
                '</div>';
            }
          } else {
            self.close();
          }
          port.disconnect();
        }
      });
      
      port.onDisconnect.addListener(function() {
        if (!hasShownResult && !streamedText) {
          self.close();
        }
      });
      
      // Send the optimize request
      port.postMessage({
        action: 'OPTIMIZE_PROMPT',
        text: this.selectedText,
        mode: mode
      });
    } catch (error) {
      console.error('Failed to start streaming:', error);
      this.close();
    }
  }
  
  showStreamingResultUI(initialText) {
    this.state = 'RESULT';
    
    const card = document.createElement('div');
    card.className = 'proptimizer-menu-card proptimizer-mode-card proptimizer-result-container';
    
    // Header
    const header = document.createElement('div');
    header.className = 'proptimizer-result-header';
    
    const titleWrap = document.createElement('div');
    titleWrap.className = 'proptimizer-drag-handle';
    
    const title = document.createElement('div');
    title.className = 'proptimizer-result-title';
    title.innerHTML = `${ICONS.check}<span class="proptimizer-gradient-text">Optimized Result</span>`;
    
    titleWrap.appendChild(title);
    
    const controls = document.createElement('div');
    controls.className = 'proptimizer-header-controls';
    
    const self = this;
    
    // Lock button
    const lockBtn = document.createElement('button');
    lockBtn.className = 'proptimizer-lock-btn' + (this.isLocked ? ' locked' : '');
    lockBtn.innerHTML = this.isLocked ? ICONS.pin : ICONS.pinOff;
    lockBtn.setAttribute('type', 'button');
    lockBtn.setAttribute('aria-label', 'Toggle pin');
    lockBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.isLocked = !self.isLocked;
      lockBtn.className = 'proptimizer-lock-btn' + (self.isLocked ? ' locked' : '');
      lockBtn.innerHTML = self.isLocked ? ICONS.pin : ICONS.pinOff;
    };
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'proptimizer-lock-btn';
    closeBtn.innerHTML = ICONS.x;
    closeBtn.setAttribute('type', 'button');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.close();
    };
    
    controls.appendChild(lockBtn);
    controls.appendChild(closeBtn);
    
    header.appendChild(titleWrap);
    header.appendChild(controls);
    
    // Content
    const content = document.createElement('div');
    content.className = 'proptimizer-result-content';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'proptimizer-result-text proptimizer-streaming-cursor';
    textDiv.id = 'proptimizer-streaming-text';
    textDiv.innerHTML = this.parseMarkdown(initialText);
    
    content.appendChild(textDiv);
    
    // Footer (hidden during streaming)
    const footer = document.createElement('div');
    footer.className = 'proptimizer-result-footer';
    footer.id = 'proptimizer-result-footer';
    footer.style.display = 'none';
    
    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(footer);
    
    // Setup drag on header
    this.setupDrag(header, card);
    
    this.positionCard(card);
    
    this.container.innerHTML = '';
    this.container.appendChild(card);
  }
  
  updateStreamingText(text) {
    const textDiv = this.shadowRoot?.getElementById('proptimizer-streaming-text');
    if (textDiv) {
      textDiv.innerHTML = this.parseMarkdown(text);
      // Auto-scroll only if user is near the bottom
      const content = textDiv.parentElement;
      if (content) {
        const isNearBottom = content.scrollHeight - content.scrollTop - content.clientHeight < 80;
        if (isNearBottom) content.scrollTop = content.scrollHeight;
      }
    }
  }
  
  finalizeStreamingResult(optimizedText) {
    const textDiv = this.shadowRoot?.getElementById('proptimizer-streaming-text');
    if (textDiv) {
      textDiv.classList.remove('proptimizer-streaming-cursor');
      textDiv.innerHTML = this.parseMarkdown(optimizedText);
    }
    
    // Update header title - keep gradient animation
    const title = this.container?.querySelector('.proptimizer-result-title');
    if (title) {
      title.innerHTML = `${ICONS.check}<span class="proptimizer-gradient-text">Optimized Result</span>`;
    }
    
    // Show footer with buttons
    const footer = this.shadowRoot?.getElementById('proptimizer-result-footer');
    if (footer) {
      footer.style.display = 'flex';
      
      const self = this;
      
      // Copy Button
      const copyBtn = document.createElement('button');
      copyBtn.className = 'proptimizer-btn proptimizer-btn-outline';
      copyBtn.innerHTML = `${ICONS.copy}<span>Copy</span>`;
      copyBtn.setAttribute('type', 'button');
      copyBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.handleCopy(optimizedText, copyBtn);
      };
      
      // Replace Button
      const replaceBtn = document.createElement('button');
      replaceBtn.className = 'proptimizer-btn proptimizer-btn-primary';
      replaceBtn.innerHTML = `${ICONS.replace}<span>Replace</span>`;
      replaceBtn.setAttribute('type', 'button');
      replaceBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.handleReplace(optimizedText);
      };
      
      footer.appendChild(copyBtn);
      footer.appendChild(replaceBtn);
    }
  }
  
  handleChat() {
    if (!this.selectedText) {
      return;
    }
    
    this.showChatUI();
  }
  
  showChatUI() {
    this.state = 'CHAT';
    // Each showChatUI call is a new chat session
    this.currentChatId = null;
    
    const card = document.createElement('div');
    card.className = 'proptimizer-menu-card proptimizer-mode-card proptimizer-chat-container';
    
    // Header with drag handle
    const header = document.createElement('div');
    header.className = 'proptimizer-result-header';
    
    const titleWrap = document.createElement('div');
    titleWrap.className = 'proptimizer-drag-handle';
    
    const title = document.createElement('div');
    title.className = 'proptimizer-result-title';
    title.innerHTML = `${ICONS.chat}<span class="proptimizer-gradient-text">Ask Proptimizer</span>`;
    
    titleWrap.appendChild(title);
    
    const controls = document.createElement('div');
    controls.className = 'proptimizer-header-controls';
    
    const self = this;
    
    // Open on Web button
    const openWebBtn = document.createElement('button');
    openWebBtn.className = 'proptimizer-lock-btn';
    openWebBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
    openWebBtn.setAttribute('type', 'button');
    openWebBtn.setAttribute('aria-label', 'Continue this chat on web');
    openWebBtn.setAttribute('title', 'Continue this chat on web');
    openWebBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      const chatId = self.currentChatId;
      const url = chatId
        ? `https://d3jqm7so635aqb.cloudfront.net/chat?threadId=${encodeURIComponent(chatId)}`
        : 'https://d3jqm7so635aqb.cloudfront.net/chat';
      window.open(url, '_blank');
    };
    
    // Lock/Pin button
    const lockBtn = document.createElement('button');
    lockBtn.className = 'proptimizer-lock-btn' + (this.isLocked ? ' locked' : '');
    lockBtn.innerHTML = this.isLocked ? ICONS.pin : ICONS.pinOff;
    lockBtn.setAttribute('type', 'button');
    lockBtn.setAttribute('aria-label', 'Pin this chat');
    lockBtn.setAttribute('title', this.isLocked ? 'Unpin — chat will close when clicking outside' : 'Pin — keep chat open when clicking outside');
    lockBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.isLocked = !self.isLocked;
      lockBtn.className = 'proptimizer-lock-btn' + (self.isLocked ? ' locked' : '');
      lockBtn.innerHTML = self.isLocked ? ICONS.pin : ICONS.pinOff;
      lockBtn.setAttribute('title', self.isLocked ? 'Unpin — chat will close when clicking outside' : 'Pin — keep chat open when clicking outside');
    };
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'proptimizer-lock-btn';
    closeBtn.innerHTML = ICONS.x;
    closeBtn.setAttribute('type', 'button');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.setAttribute('title', 'Close');
    closeBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.close();
    };
    
    controls.appendChild(openWebBtn);
    controls.appendChild(lockBtn);
    controls.appendChild(closeBtn);
    
    header.appendChild(titleWrap);
    header.appendChild(controls);
    
    // Messages Area
    const messagesArea = document.createElement('div');
    messagesArea.className = 'proptimizer-chat-messages';
    messagesArea.id = 'proptimizer-chat-body';
    this.chatMessagesContainer = messagesArea;
    
    // System message
    const systemMessage = document.createElement('div');
    systemMessage.className = 'proptimizer-chat-message proptimizer-chat-message-system';
    
    const systemBubble = document.createElement('div');
    systemBubble.className = 'proptimizer-chat-bubble proptimizer-chat-bubble-system';
    systemBubble.textContent = 'How can I help you with this text?';
    
    systemMessage.appendChild(systemBubble);
    messagesArea.appendChild(systemMessage);
    
    // Input Area
    const inputArea = document.createElement('div');
    inputArea.className = 'proptimizer-chat-input-area';
    
    const textarea = document.createElement('textarea');
    textarea.className = 'proptimizer-chat-textarea';
    textarea.placeholder = 'Ask Proptimizer...';
    textarea.value = this.selectedText;
    textarea.rows = 1;
    
    // Auto-expand textarea
    textarea.addEventListener('input', function(e) {
      e.stopPropagation();
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });
    
    // Prevent ALL keyboard events from leaking to the host page
    // (fixes: can't type 'k','p' on YouTube; '/' jumps to search on many sites)
    const stopKeyLeak = function(e) {
      e.stopPropagation();
    };
    textarea.addEventListener('keydown', stopKeyLeak, true);
    textarea.addEventListener('keyup', stopKeyLeak, true);
    textarea.addEventListener('keypress', stopKeyLeak, true);
    
    // Send on Enter (without Shift)
    textarea.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
      }
    });
    
    const sendBtn = document.createElement('button');
    sendBtn.className = 'proptimizer-chat-send-btn';
    sendBtn.innerHTML = ICONS.arrowUp;
    sendBtn.setAttribute('type', 'button');
    sendBtn.setAttribute('aria-label', 'Send message');
    
    sendBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.handleSendChat(textarea, sendBtn);
    };
    
    inputArea.appendChild(textarea);
    inputArea.appendChild(sendBtn);
    
    // Resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'proptimizer-resize-handle';
    resizeHandle.setAttribute('title', 'Drag to resize');
    
    // Assemble card
    card.style.position = 'absolute';
    card.appendChild(header);
    card.appendChild(messagesArea);
    card.appendChild(inputArea);
    card.appendChild(resizeHandle);
    
    // Setup resize on handle
    this.setupResize(resizeHandle, card, messagesArea);
    
    // Setup drag on header
    this.setupDrag(header, card);
    
    this.positionCard(card);
    
    this.container.innerHTML = '';
    this.container.appendChild(card);
    
    // Auto-focus textarea
    setTimeout(function() {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }, 100);
  }
  
  async handleSendChat(textarea, sendBtn) {
    const message = textarea.value.trim();
    
    // Validation
    if (!message) return;
    
    // Show user message immediately
    this.appendMessage(message, 'user');
    
    // Clear input
    textarea.value = '';
    textarea.style.height = 'auto';
    
    // Disable send button
    sendBtn.disabled = true;
    
    // Show typing indicator
    this.showTypingIndicator();
    
    const self = this;
    
    try {
      // Use port-based streaming for real-time chat responses
      const port = chrome.runtime.connect({ name: 'chat-stream' });
      let streamedReply = '';
      let aiBubble = null;
      
      port.onMessage.addListener(function(msg) {
        if (msg.type === 'meta' && msg.chatId) {
          self.currentChatId = msg.chatId;
        } else if (msg.type === 'chunk') {
          streamedReply += msg.text;
          
          // Remove typing indicator and create AI bubble on first chunk
          if (!aiBubble) {
            self.removeTypingIndicator();
            aiBubble = self.appendStreamingMessage();
          }
          
          // Update AI bubble with parsed markdown
          aiBubble.innerHTML = self.parseMarkdown(streamedReply);
          
          // Auto-scroll only if user is near the bottom
          if (self.chatMessagesContainer) {
            const c = self.chatMessagesContainer;
            const isNearBottom = c.scrollHeight - c.scrollTop - c.clientHeight < 80;
            if (isNearBottom) c.scrollTop = c.scrollHeight;
          }
        } else if (msg.type === 'done') {
          // Finalize
          if (!aiBubble && streamedReply) {
            self.removeTypingIndicator();
            self.appendMessage(streamedReply, 'ai');
          }
          sendBtn.disabled = false;
          textarea.focus();
          port.disconnect();
        } else if (msg.type === 'error') {
          self.removeTypingIndicator();
          
          if (msg.errorCode === 'AUTH_EXPIRED') {
            self.appendAuthExpiredMessage();
          } else {
            self.appendMessage(`Error: ${msg.error || 'Failed to get response'}`, 'error');
          }
          
          sendBtn.disabled = false;
          textarea.focus();
          port.disconnect();
        }
      });
      
      port.onDisconnect.addListener(function() {
        sendBtn.disabled = false;
        // If we got a response but no 'done' message, that's ok
        if (!aiBubble && !streamedReply) {
          self.removeTypingIndicator();
        }
      });
      
      // Send the chat request
      port.postMessage({
        query: message,
        chatId: this.currentChatId
      });
    } catch (error) {
      this.removeTypingIndicator();
      this.appendMessage('Error: Unable to send message', 'error');
      sendBtn.disabled = false;
      textarea.focus();
    }
  }
  
  appendStreamingMessage() {
    if (!this.chatMessagesContainer) return null;
    
    const messageRow = document.createElement('div');
    messageRow.className = 'proptimizer-message-row proptimizer-message-row-ai';
    
    const bubble = document.createElement('div');
    bubble.className = 'proptimizer-chat-bubble-ai';
    
    messageRow.appendChild(bubble);
    this.chatMessagesContainer.appendChild(messageRow);
    
    return bubble;
  }
  
  stripMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/~~(.+?)~~/g, '$1')
      .replace(/`{3}[\s\S]*?`{3}/g, function(m) { return m.replace(/`{3}.*\n?/g, ''); })
      .replace(/`(.+?)`/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '• ')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/^>\s?/gm, '')
      .replace(/^---$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  
  processLatex(text) {
    if (!text) return text;
    let result = text;
    
    // Block math: $$...$$  → styled div
    result = result.replace(/\$\$([\s\S]*?)\$\$/g, (match, expr) => {
      return `<div class="proptimizer-math-block">${this.latexToHtml(expr.trim())}</div>`;
    });
    
    // Inline math: $...$  (but not $$)
    result = result.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, (match, expr) => {
      return `<span class="proptimizer-math-inline">${this.latexToHtml(expr.trim())}</span>`;
    });
    
    // Standalone LaTeX commands outside of $...$
    result = this.latexToHtml(result);
    
    return result;
  }
  
  latexToHtml(text) {
    if (!text) return text;
    let r = text;
    
    // \frac{a}{b} → a⁄b  (fraction slash)
    r = r.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '<span class="proptimizer-math-frac"><span class="proptimizer-math-num">$1</span>⁄<span class="proptimizer-math-den">$2</span></span>');
    
    // \sqrt{x} → √x
    r = r.replace(/\\sqrt\{([^}]*)\}/g, '√($1)');
    
    // \textbf{...} → <strong>...</strong>
    r = r.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>');
    
    // \textit{...} → <em>...</em>
    r = r.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>');
    
    // \text{...} → plain text
    r = r.replace(/\\text\{([^}]*)\}/g, '$1');
    
    // \mathrm{...}, \mathbf{...}, \mathit{...}
    r = r.replace(/\\mathrm\{([^}]*)\}/g, '$1');
    r = r.replace(/\\mathbf\{([^}]*)\}/g, '<strong>$1</strong>');
    r = r.replace(/\\mathit\{([^}]*)\}/g, '<em>$1</em>');
    
    // Superscript: x^{n} or x^n
    r = r.replace(/\^{([^}]*)}/g, '<sup>$1</sup>');
    r = r.replace(/\^(\w)/g, '<sup>$1</sup>');
    
    // Subscript: x_{n} or x_n
    r = r.replace(/_{([^}]*)}/g, '<sub>$1</sub>');
    r = r.replace(/_(\w)/g, '<sub>$1</sub>');
    
    // Greek letters
    const greeks = {
      'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ', 'epsilon': 'ε',
      'zeta': 'ζ', 'eta': 'η', 'theta': 'θ', 'iota': 'ι', 'kappa': 'κ',
      'lambda': 'λ', 'mu': 'μ', 'nu': 'ν', 'xi': 'ξ', 'pi': 'π',
      'rho': 'ρ', 'sigma': 'σ', 'tau': 'τ', 'upsilon': 'υ', 'phi': 'φ',
      'chi': 'χ', 'psi': 'ψ', 'omega': 'ω',
      'Alpha': 'Α', 'Beta': 'Β', 'Gamma': 'Γ', 'Delta': 'Δ', 'Epsilon': 'Ε',
      'Theta': 'Θ', 'Lambda': 'Λ', 'Pi': 'Π', 'Sigma': 'Σ', 'Phi': 'Φ',
      'Psi': 'Ψ', 'Omega': 'Ω'
    };
    for (const [name, symbol] of Object.entries(greeks)) {
      r = r.replace(new RegExp('\\\\' + name + '(?![a-zA-Z])', 'g'), symbol);
    }
    
    // Common math symbols
    const symbols = {
      '\\\\times': '×', '\\\\div': '÷', '\\\\pm': '±', '\\\\mp': '∓',
      '\\\\cdot': '·', '\\\\ast': '∗', '\\\\star': '⋆',
      '\\\\leq': '≤', '\\\\geq': '≥', '\\\\neq': '≠', '\\\\approx': '≈',
      '\\\\equiv': '≡', '\\\\sim': '∼', '\\\\propto': '∝',
      '\\\\infty': '∞', '\\\\partial': '∂', '\\\\nabla': '∇',
      '\\\\sum': '∑', '\\\\prod': '∏', '\\\\int': '∫',
      '\\\\forall': '∀', '\\\\exists': '∃', '\\\\in': '∈', '\\\\notin': '∉',
      '\\\\subset': '⊂', '\\\\supset': '⊃', '\\\\subseteq': '⊆', '\\\\supseteq': '⊇',
      '\\\\cup': '∪', '\\\\cap': '∩', '\\\\emptyset': '∅',
      '\\\\to': '→', '\\\\rightarrow': '→', '\\\\leftarrow': '←',
      '\\\\Rightarrow': '⇒', '\\\\Leftarrow': '⇐', '\\\\leftrightarrow': '↔',
      '\\\\implies': '⟹', '\\\\iff': '⟺',
      '\\\\neg': '¬', '\\\\land': '∧', '\\\\lor': '∨',
      '\\\\ldots': '…', '\\\\cdots': '⋯', '\\\\vdots': '⋮',
      '\\\\angle': '∠', '\\\\triangle': '△', '\\\\square': '□',
      '\\\\circ': '∘', '\\\\degree': '°',
      '\\\\prime': '′', '\\\\dprime': '″',
      '\\\\lfloor': '⌊', '\\\\rfloor': '⌋', '\\\\lceil': '⌈', '\\\\rceil': '⌉',
      '\\\\langle': '⟨', '\\\\rangle': '⟩',
      '\\\\quad': ' &ensp; ', '\\\\qquad': ' &emsp; ',
      '\\\\,': ' ', '\\\\;': ' ', '\\\\!': '',
      '\\\\left\\(': '(', '\\\\right\\)': ')',
      '\\\\left\\[': '[', '\\\\right\\]': ']',
      '\\\\left\\\\{': '{', '\\\\right\\\\}': '}',
      '\\\\{': '{', '\\\\}': '}',
      '\\\\%': '%',
    };
    for (const [pattern, replacement] of Object.entries(symbols)) {
      r = r.replace(new RegExp(pattern, 'g'), replacement);
    }
    
    // \begin{...}...\end{...} → clean up environment markers
    r = r.replace(/\\begin\{[^}]*\}/g, '');
    r = r.replace(/\\end\{[^}]*\}/g, '');
    
    // \hline, \\, \newline → line break
    r = r.replace(/\\hline/g, '');
    r = r.replace(/\\\\\\/g, '<br>');
    r = r.replace(/\\newline/g, '<br>');
    
    // Clean up remaining \commandName patterns (unknown commands) → just show content
    r = r.replace(/\\([a-zA-Z]+)/g, (match, cmd) => {
      // If it's a common command we missed, just show the command name nicely
      return cmd;
    });
    
    return r;
  }
  
  parseMarkdown(text) {
    if (!text) return '';
    
    let html = text;
    
    // Escape HTML to prevent XSS
    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');
    
    // Code blocks - extract into placeholders to protect from bold/italic processing
    const codeBlocks = [];
    const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      const escaped = code.trim();
      const langLabel = lang || 'Code';
      const block = `<div class="proptimizer-code-block-wrapper"><div class="proptimizer-code-header"><span class="proptimizer-code-lang">${langLabel}</span><button class="proptimizer-copy-code-btn" data-copy-code="true" title="Copy">${copyIcon}</button></div><pre><code>${escaped}</code></pre></div>`;
      codeBlocks.push(block);
      return `\x00CODEBLOCK-${codeBlocks.length - 1}\x00`;
    });
    
    // Inline code - also protect with placeholders
    const inlineCodes = [];
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      inlineCodes.push(`<code>${code}</code>`);
      return `\x00INLINECODE-${inlineCodes.length - 1}\x00`;
    });
    
    // Process LaTeX/math expressions (after code extraction, before markdown)
    html = this.processLatex(html);
    
    // Bold (must be before italic)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Parse tables (must be before paragraph splitting)
    html = this.parseTables(html);
    
    // Split into lines for block-level processing
    const allLines = html.split('\n');
    let result = [];
    // Track nested list state: { type: 'ul'|'ol', items: [{text, subItems:[]}] }
    let currentOl = null;
    let currentUl = null;
    let currentSubUl = []; // sub-bullets under an ol item
    
    const flushSubUl = () => {
      if (currentSubUl.length > 0 && currentOl && currentOl.items.length > 0) {
        // Attach sub-items to last ol item
        const lastItem = currentOl.items[currentOl.items.length - 1];
        lastItem.subItems = currentSubUl;
        currentSubUl = [];
      }
    };
    
    const flushOl = () => {
      flushSubUl();
      if (currentOl && currentOl.items.length > 0) {
        let olHtml = '<ol class="proptimizer-list">';
        currentOl.items.forEach(item => {
          olHtml += '<li>' + item.text;
          if (item.subItems && item.subItems.length > 0) {
            olHtml += '<ul class="proptimizer-list">';
            item.subItems.forEach(sub => { olHtml += '<li>' + sub + '</li>'; });
            olHtml += '</ul>';
          }
          olHtml += '</li>';
        });
        olHtml += '</ol>';
        result.push(olHtml);
        currentOl = null;
      }
    };
    
    const flushUl = () => {
      if (currentUl && currentUl.length > 0) {
        result.push('<ul class="proptimizer-list">' + currentUl.map(item => '<li>' + item + '</li>').join('') + '</ul>');
        currentUl = null;
      }
    };
    
    const flushAll = () => {
      flushOl();
      flushUl();
    };
    
    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i].trim();
      
      // Empty line - skip but don't break lists (allow continuation)
      if (!line) {
        continue;
      }
      
      // Skip if it's already a table/pre block
      if (line.startsWith('&lt;table') || line.startsWith('<table') || line.startsWith('<pre>')) {
        flushAll();
        result.push(line);
        continue;
      }
      
      // Headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        flushAll();
        const level = headingMatch[1].length;
        result.push('<h' + level + '>' + headingMatch[2] + '</h' + level + '>');
        continue;
      }
      
      // Horizontal rule
      if (line.match(/^([-*_])\1{2,}$/)) {
        flushAll();
        result.push('<hr>');
        continue;
      }
      
      // Ordered list item (e.g., "1. Item")
      const olMatch = line.match(/^\d+\.\s+(.+)/);
      if (olMatch) {
        // If we were in a UL (not sub-items of OL), flush it
        if (currentUl) flushUl();
        
        // Continue or start OL
        if (!currentOl) {
          currentOl = { items: [] };
        } else {
          flushSubUl(); // attach any sub-bullets to previous item
        }
        currentOl.items.push({ text: olMatch[1], subItems: [] });
        continue;
      }
      
      // Unordered list item (e.g., "- Item" or "* Item")
      const ulMatch = line.match(/^[-*+]\s+(.+)/);
      if (ulMatch) {
        if (currentOl) {
          // We're inside an ordered list — treat bullets as sub-items of last ol item
          currentSubUl.push(ulMatch[1]);
        } else {
          // Standalone unordered list
          if (!currentUl) currentUl = [];
          currentUl.push(ulMatch[1]);
        }
        continue;
      }
      
      // Regular text line — treat as paragraph
      flushAll();
      let paraLines = [line];
      while (i + 1 < allLines.length) {
        const nextLine = allLines[i + 1].trim();
        if (!nextLine || nextLine.match(/^(#{1,6})\s/) || nextLine.match(/^[-*+]\s/) || nextLine.match(/^\d+\.\s/) || nextLine.match(/^([-*_])\1{2,}$/) || nextLine.startsWith('<table') || nextLine.startsWith('&lt;table') || nextLine.startsWith('<pre>')) {
          break;
        }
        paraLines.push(nextLine);
        i++;
      }
      result.push('<p>' + paraLines.join('<br>') + '</p>');
    }
    
    flushAll();
    let finalHtml = result.join('');
    
    // Restore code block and inline code placeholders
    codeBlocks.forEach((block, i) => {
      finalHtml = finalHtml.replace(`\x00CODEBLOCK-${i}\x00`, block);
    });
    inlineCodes.forEach((code, i) => {
      finalHtml = finalHtml.replace(`\x00INLINECODE-${i}\x00`, code);
    });
    
    return finalHtml;
  }
  
  parseTables(text) {
    // Find table blocks (consecutive lines starting with |)
    const lines = text.split('\n');
    let result = [];
    let inTable = false;
    let tableLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this is a table row
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableLines = [];
        }
        tableLines.push(line);
      } else {
        // End of table
        if (inTable) {
          result.push(this.renderTable(tableLines));
          inTable = false;
          tableLines = [];
        }
        result.push(line);
      }
    }
    
    // Handle table at end of text
    if (inTable && tableLines.length > 0) {
      result.push(this.renderTable(tableLines));
    }
    
    return result.join('\n');
  }
  
  renderTable(lines) {
    if (lines.length < 2) return lines.join('\n');
    
    let html = '<table class="proptimizer-table">';
    let hasHeader = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip separator line (|---|---|)
      if (line.match(/^\|[\s-:|]+\|$/)) {
        hasHeader = true;
        continue;
      }
      
      // Split cells by |
      const cells = line
        .substring(1, line.length - 1)
        .split('|')
        .map(cell => cell.trim().replace(/&lt;br&gt;/g, '<br>').replace(/\\n/g, '<br>'));
      
      // First row is header if followed by separator
      if (i === 0 && lines[1] && lines[1].match(/^\|[\s-:|]+\|$/)) {
        html += '<thead><tr>';
        cells.forEach(cell => {
          html += `<th>${cell}</th>`;
        });
        html += '</tr></thead><tbody>';
      } else {
        // Data row
        if (i === 1 && hasHeader) {
          // Already in tbody
        } else if (i === 0 && !hasHeader) {
          html += '<tbody>';
        }
        html += '<tr>';
        cells.forEach(cell => {
          html += `<td>${cell}</td>`;
        });
        html += '</tr>';
      }
    }
    
    html += '</tbody></table>';
    return html;
  }
  
  appendMessage(text, sender) {
    if (!this.chatMessagesContainer) return;
    
    const messageRow = document.createElement('div');
    messageRow.className = `proptimizer-message-row proptimizer-message-row-${sender}`;
    
    const bubble = document.createElement('div');
    bubble.className = `proptimizer-chat-bubble-${sender}`;
    
    // User messages: plain text (security)
    // AI messages: parsed markdown (HTML)
    if (sender === 'user' || sender === 'error') {
      bubble.textContent = text;
    } else if (sender === 'ai') {
      bubble.innerHTML = this.parseMarkdown(text);
    }
    
    messageRow.appendChild(bubble);
    this.chatMessagesContainer.appendChild(messageRow);
    
    // Auto-scroll to bottom
    this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
  }
  
  appendAuthExpiredMessage() {
    if (!this.chatMessagesContainer) return;
    
    const messageRow = document.createElement('div');
    messageRow.className = 'proptimizer-message-row proptimizer-message-row-ai';
    
    const bubble = document.createElement('div');
    bubble.className = 'proptimizer-chat-bubble-error';
    bubble.style.cssText = 'background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 16px; max-width: 95%; text-align: center;';
    
    const icon = document.createElement('div');
    icon.textContent = '⚠️';
    icon.style.cssText = 'font-size: 24px; margin-bottom: 8px;';
    
    const msg = document.createElement('div');
    msg.textContent = 'Session expired. Please log in on the web app to continue.';
    msg.style.cssText = 'font-size: 13px; color: #991b1b; margin-bottom: 10px; line-height: 1.4;';
    
    const btn = document.createElement('a');
    btn.href = 'https://d3jqm7so635aqb.cloudfront.net';
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.textContent = 'Open Web App to Login →';
    btn.style.cssText = 'display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, #00bcd4, #6366f1); color: white; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none; cursor: pointer;';
    
    bubble.appendChild(icon);
    bubble.appendChild(msg);
    bubble.appendChild(btn);
    messageRow.appendChild(bubble);
    this.chatMessagesContainer.appendChild(messageRow);
    this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
  }
  
  showTypingIndicator() {
    if (!this.chatMessagesContainer) return;
    
    const messageRow = document.createElement('div');
    messageRow.className = 'proptimizer-message-row proptimizer-message-row-ai';
    messageRow.id = 'proptimizer-typing-indicator';
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'proptimizer-typing-indicator';
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'proptimizer-typing-dot';
      typingDiv.appendChild(dot);
    }
    
    messageRow.appendChild(typingDiv);
    this.chatMessagesContainer.appendChild(messageRow);
    
    // Auto-scroll to bottom
    this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
  }
  
  removeTypingIndicator() {
    // Use shadowRoot.getElementById instead of document.getElementById
    const indicator = this.shadowRoot?.getElementById('proptimizer-typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
  
  showResultUI(optimizedText) {
    this.state = 'RESULT';
    
    const card = document.createElement('div');
    card.className = 'proptimizer-menu-card proptimizer-mode-card proptimizer-result-container';
    
    // Header with drag handle
    const header = document.createElement('div');
    header.className = 'proptimizer-result-header';
    
    const titleWrap = document.createElement('div');
    titleWrap.className = 'proptimizer-drag-handle';
    
    const title = document.createElement('div');
    title.className = 'proptimizer-result-title';
    title.innerHTML = `${ICONS.check}<span class="proptimizer-gradient-text">Optimized Result</span>`;
    
    titleWrap.appendChild(title);
    
    const controls = document.createElement('div');
    controls.className = 'proptimizer-header-controls';
    
    const self = this;
    
    // Lock/Pin button
    const lockBtn = document.createElement('button');
    lockBtn.className = 'proptimizer-lock-btn' + (this.isLocked ? ' locked' : '');
    lockBtn.innerHTML = this.isLocked ? ICONS.pin : ICONS.pinOff;
    lockBtn.setAttribute('type', 'button');
    lockBtn.setAttribute('aria-label', 'Toggle pin');
    lockBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.isLocked = !self.isLocked;
      lockBtn.className = 'proptimizer-lock-btn' + (self.isLocked ? ' locked' : '');
      lockBtn.innerHTML = self.isLocked ? ICONS.pin : ICONS.pinOff;
    };
    
    const closeHeaderBtn = document.createElement('button');
    closeHeaderBtn.className = 'proptimizer-lock-btn';
    closeHeaderBtn.innerHTML = ICONS.x;
    closeHeaderBtn.setAttribute('type', 'button');
    closeHeaderBtn.setAttribute('aria-label', 'Close');
    closeHeaderBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.close();
    };
    
    controls.appendChild(lockBtn);
    controls.appendChild(closeHeaderBtn);
    
    header.appendChild(titleWrap);
    header.appendChild(controls);
    
    // Content
    const content = document.createElement('div');
    content.className = 'proptimizer-result-content';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'proptimizer-result-text';
    textDiv.innerHTML = this.parseMarkdown(optimizedText);
    
    content.appendChild(textDiv);
    
    // Footer with actions
    const footer = document.createElement('div');
    footer.className = 'proptimizer-result-footer';
    
    // Copy Button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'proptimizer-btn proptimizer-btn-outline';
    copyBtn.innerHTML = `${ICONS.copy}<span>Copy</span>`;
    copyBtn.setAttribute('type', 'button');
    copyBtn.setAttribute('id', 'proptimizer-copy-btn');
    copyBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.handleCopy(optimizedText, copyBtn);
    };
    
    // Replace Button
    const replaceBtn = document.createElement('button');
    replaceBtn.className = 'proptimizer-btn proptimizer-btn-primary';
    replaceBtn.innerHTML = `${ICONS.replace}<span>Replace</span>`;
    replaceBtn.setAttribute('type', 'button');
    replaceBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.handleReplace(optimizedText);
    };
    
    footer.appendChild(copyBtn);
    footer.appendChild(replaceBtn);
    
    // Assemble card
    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(footer);
    
    // Setup drag on header
    this.setupDrag(header, card);
    
    this.positionCard(card);
    
    this.container.innerHTML = '';
    this.container.appendChild(card);
  }
  
  handleCopy(text, button) {
    const cleanText = this.stripMarkdown(text);
    const self = this;
    
    navigator.clipboard.writeText(cleanText).then(function() {
      
      // Show success feedback
      button.className = 'proptimizer-btn proptimizer-btn-success';
      button.innerHTML = `${ICONS.check}<span>Copied!</span>`;
      
      // Reset after 2 seconds
      setTimeout(function() {
        button.className = 'proptimizer-btn proptimizer-btn-outline';
        button.innerHTML = `${ICONS.copy}<span>Copy</span>`;
      }, 2000);
    }).catch(function(err) {
      // Copy failed silently
    });
  }
  
  handleReplace(newText) {
    const cleanText = this.stripMarkdown(newText);
    
    if (!this.selectedRange) {
      alert('Cannot replace: Original selection lost. Please select text again.');
      this.close();
      return;
    }
    
    try {
      // Try to find and focus the original element
      const commonAncestor = this.selectedRange.commonAncestorContainer;
      let targetElement = commonAncestor.nodeType === Node.TEXT_NODE 
        ? commonAncestor.parentElement 
        : commonAncestor;
      
      // Check if element is editable (input, textarea, contenteditable)
      const isEditable = targetElement.isContentEditable || 
                        targetElement.tagName === 'INPUT' || 
                        targetElement.tagName === 'TEXTAREA';
      
      if (isEditable) {
        targetElement.focus();
        
        // Try document.execCommand first (preserves undo)
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(this.selectedRange);
        
        const success = document.execCommand('insertText', false, cleanText);
        
        if (!success) {
          throw new Error('execCommand failed, using fallback');
        }
        
      } else {
        // Fallback: Manual DOM manipulation
        this.selectedRange.deleteContents();
        const textNode = document.createTextNode(cleanText);
        this.selectedRange.insertNode(textNode);
        
      }
      
      // Close UI after successful replace
      const self = this;
      setTimeout(function() {
        self.close();
      }, 500);
      
    } catch (err) {
      alert('Failed to replace text. The page may not support editing.');
    }
  }
  
  setupResize(handleElement, cardElement, messagesArea) {
    const self = this;
    const MIN_WIDTH = 320;
    const MAX_WIDTH = 680;
    const MIN_HEIGHT = 300;
    const MAX_HEIGHT = 800;
    
    handleElement.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = cardElement.offsetWidth;
      const startHeight = cardElement.offsetHeight;
      
      function onMouseMove(ev) {
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + (ev.clientX - startX)));
        const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeight + (ev.clientY - startY)));
        
        cardElement.style.width = newWidth + 'px';
        cardElement.style.height = newHeight + 'px';
        
        // Update messages area to fill available space
        if (messagesArea) {
          const headerH = cardElement.querySelector('.proptimizer-result-header')?.offsetHeight || 50;
          const inputH = cardElement.querySelector('.proptimizer-chat-input-area')?.offsetHeight || 68;
          const availableH = newHeight - headerH - inputH;
          messagesArea.style.maxHeight = Math.max(100, availableH) + 'px';
        }
      }
      
      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }
  
  setupDrag(handleElement, cardElement) {
    const self = this;
    
    handleElement.addEventListener('mousedown', function(e) {
      // Only drag from the handle area, not buttons
      if (e.target.closest('button') || e.target.closest('.proptimizer-header-controls')) return;
      
      self.isDragging = true;
      const rect = cardElement.getBoundingClientRect();
      self.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      e.preventDefault();
      e.stopPropagation();
      
      function onMouseMove(ev) {
        if (!self.isDragging) return;
        
        const newX = ev.clientX - self.dragOffset.x;
        const newY = ev.clientY - self.dragOffset.y;
        
        // Keep card within viewport
        const maxX = window.innerWidth - cardElement.offsetWidth - 10;
        const maxY = window.innerHeight - cardElement.offsetHeight - 10;
        
        cardElement.style.left = Math.max(10, Math.min(newX, maxX)) + 'px';
        cardElement.style.top = Math.max(10, Math.min(newY, maxY)) + 'px';
      }
      
      function onMouseUp() {
        self.isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }
  
  handleClickOutside(e) {
    if (!this.container) return;
    if (this.state === 'HIDDEN') return;
    if (this.isDragging) return;
    
    // When locked, don't close on outside click (except for ICON and MENU states)
    if (this.isLocked && this.state !== 'ICON' && this.state !== 'MENU') return;
    
    // Check if click is inside Shadow DOM
    const clickedInside = this.isInsideShadowDOM(e);
    
    if (!clickedInside) {
      this.close();
    }
  }
  
  close() {
    this.state = 'HIDDEN';
    // Preserve chatId for continuation when user re-opens
    // this.currentChatId = null; // Removed - preserve chatId for continuation
    
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    if (this.copiedTimeout) {
      clearTimeout(this.copiedTimeout);
      this.copiedTimeout = null;
    }
    
    this.selectedText = '';
    this.selectedRange = null;
    this.selectionRect = null;
    this.optimizedResult = null;
  }
}

// Initialization
let extensionInstance = null;

function initExtension() {
  if (extensionInstance) return;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      extensionInstance = new ProptimizerExtension();
    });
  } else {
    extensionInstance = new ProptimizerExtension();
  }
}

initExtension();
