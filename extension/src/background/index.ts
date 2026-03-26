/**
 * Proptimizer Background Service Worker
 * Includes: Auth Sync + Optimization + Chat
 * No chrome.notifications (crash prevention)
 * Unified payload handling for both optimize and chat
 */

const API_BASE_URL = import.meta.env['VITE_API_BASE_URL'];
const OPTIMIZE_STREAM_URL = import.meta.env['VITE_OPTIMIZE_STREAM_URL'];
const CHAT_STREAM_URL = import.meta.env['VITE_CHAT_STREAM_URL'];

// In-memory preferred model to avoid storage race conditions when user changes model in the popup
let inMemoryPreferredModel: string | null = null;
// In-memory preferred response mode (fast/full)
let inMemoryPreferredResponseMode: string | null = null;

interface ErrorWithCode extends Error {
  code?: string;
}

// ============================================================
// INTERNAL MESSAGE LISTENER (Content Script → Background)
// ============================================================

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Handle optimization request
  if (message.type === 'OPTIMIZE_PROMPT' || message.action === 'OPTIMIZE_PROMPT') {
    const prompt = message.prompt || message.text;
    handleOptimizeRequest(prompt, message.mode)
      .then(sendResponse)
      .catch((error) => {
        console.error('Optimize error:', error);
        sendResponse({
          success: false,
          error: error.message || 'Optimization failed',
          errorCode: error.code || 'UNKNOWN_ERROR',
        });
      });
    return true; // Keep channel open for async response
  }

  // Handle preference updates from popup (keeps an in-memory preference to avoid races)
  if (message.type === 'PREFERRED_MODEL_UPDATED') {
    try {
      inMemoryPreferredModel = message.model || null;
      // Mirror to storage for persistence
      chrome.storage.local.set({ preferredModel: inMemoryPreferredModel });
      sendResponse({ success: true });
    } catch (err) {
      console.error('Failed to update preferred model:', err);
      sendResponse({ success: false, error: (err as Error).message });
    }
    return true;
  }

  // Handle response mode updates from popup
  if (message.type === 'PREFERRED_RESPONSE_MODE_UPDATED') {
    try {
      inMemoryPreferredResponseMode = message.responseMode || null;
      chrome.storage.local.set({ preferredResponseMode: inMemoryPreferredResponseMode });
      sendResponse({ success: true });
    } catch (err) {
      console.error('Failed to update preferred responseMode:', err);
      sendResponse({ success: false, error: (err as Error).message });
    }
    return true;
  }

  // Handle chat request (distinct from optimization)
  if (message.action === 'PROCESS_CHAT') {
    // Allow optional model/responseMode override from sender
    handleChatRequest(message.text, message.query, message.chatId, message.model, message.responseMode)
      .then((result) => {
        sendResponse(result);
      })
      .catch((error) => {
        console.error('❌ Chat error:', error);
        sendResponse({
          success: false,
          error: error.message || 'Chat failed',
          errorCode: error.code || 'UNKNOWN_ERROR',
        });
      });
    return true; // Keep channel open for async response
  }

  // Handle chat request - unified with optimize
  if (message.type === 'CHAT_MESSAGE' || message.action === 'CHAT_MESSAGE' || message.type === 'CHAT_PROMPT') {
    const prompt = message.prompt || message.text;
    // Use optimize handler with chat-specific mode
    handleOptimizeRequest(prompt, 'chat')
      .then((response) => {
        // Transform response for chat format
        if (response.success && response.data) {
          sendResponse({
            success: true,
            data: {
              message: response.data.optimizedPrompt || 'No response',
            }
          });
        } else {
          sendResponse(response);
        }
      })
      .catch((error) => {
        console.error('❌ Chat error:', error);
        sendResponse({
          success: false,
          error: error.message || 'Chat failed',
          errorCode: error.code || 'UNKNOWN_ERROR',
        });
      });
    return true;
  }

  // Handle ping (health check)
  if (message.type === 'PING') {
    sendResponse({ installed: true });
    return false;
  }

  return false;
});

// ============================================================
// EXTERNAL MESSAGE LISTENER (Web App → Extension)
// ============================================================

chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  // Handle session sync from web app
  if (message.type === 'SYNC_SESSION') {
    handleSyncSession(message.accessToken, message.idToken, message.userId, message.email)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          success: false,
          error: error.message || 'Sync failed',
        });
      });
    return true;
  }

  // Handle logout from web app
  if (message.type === 'CLEAR_SESSION') {
    chrome.storage.local.remove(['accessToken', 'idToken', 'userId', 'email', 'syncedAt'])
      .then(() => sendResponse({ success: true }))
      .catch(() => sendResponse({ success: false }));
    return true;
  }

  // Handle ping from web app (extension detection)
  if (message.type === 'PING') {
    sendResponse({ success: true, installed: true });
    return false;
  }

  return false;
});

// Unified handler for optimize and chat requests

async function handleOptimizeRequest(prompt: string, mode: string = 'precision') {
  try {
    // Validate prompt - handle both 'prompt' and 'text' field names
    const textToProcess = prompt;
    
    if (!textToProcess || typeof textToProcess !== 'string' || textToProcess.trim().length === 0) {
      const error = new Error('Invalid prompt: empty or missing') as ErrorWithCode;
      error.code = 'INVALID_INPUT';
      throw error;
    }

    // Get auth tokens from storage
    const storage = await chrome.storage.local.get(['accessToken', 'idToken', 'userId']);
    const { accessToken, idToken, userId } = storage;

    if (!accessToken && !idToken) {
      const error = new Error('Please log in to the web app first') as ErrorWithCode;
      error.code = 'AUTH_REQUIRED';
      throw error;
    }

    // Use idToken for API (AWS Cognito expects ID token)
    const authToken = idToken || accessToken;

    // Build payload - include mode to satisfy Lambda validation
    const payload = {
      prompt: textToProcess.trim(),
      mode: mode || 'precision',
      userId: userId || 'extension-user'
    };

    const response = await fetch(`${API_BASE_URL}/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      const error = new Error('Session expired. Please log in again.') as ErrorWithCode;
      error.code = 'AUTH_EXPIRED';
      
      // Clear expired tokens from storage
      await chrome.storage.local.remove(['accessToken', 'idToken', 'userId']);
      
      throw error;
    }

    // Handle rate limiting
    if (response.status === 429) {
      const error = new Error('Daily limit exceeded. Try again tomorrow!') as ErrorWithCode;
      error.code = 'RATE_LIMIT';
      throw error;
    }

    // Handle validation errors
    if (response.status === 400) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error || errorData.message || 'Invalid request';
      const error = new Error(`Validation failed: ${errorMsg}`) as ErrorWithCode;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.message || errorData.error || `HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return {
      success: true,
      data: {
        optimizedPrompt: data.optimizedPrompt,
        mode: data.mode,
        modeDescription: data.modeDescription,
        metrics: data.metrics || {
          tokensUsed: 0,
          responseTime: '0s',
        },
      },
    };
  } catch (error) {
    const err = error as ErrorWithCode;
    return {
      success: false,
      error: err.message,
      errorCode: err.code,
    };
  }
}

// Handler for chat requests (DeepSeek Chat API)

async function handleChatRequest(context: string, query: string, chatId?: string, model?: string, responseMode?: string) {
  try {
    // Validate inputs
    if (!context || !query) {
      const error = new Error('Missing context or query') as ErrorWithCode;
      error.code = 'INVALID_INPUT';
      throw error;
    }

    // Get auth tokens from storage
    const storage = await chrome.storage.local.get(['accessToken', 'idToken', 'userId']);
    const { accessToken, idToken, userId } = storage;

    if (!accessToken && !idToken) {
      const error = new Error('Please log in to the web app first') as ErrorWithCode;
      error.code = 'AUTH_REQUIRED';
      throw error;
    }

    // Call DeepSeek Chat API (allow model + responseMode override)
    const result = await callDeepSeekChat(context, query, idToken || accessToken, userId, chatId, model, responseMode);

    return {
      success: true,
      data: {
        reply: result.reply,
        chatId: result.chatId
      },
    };
  } catch (error) {
    const err = error as ErrorWithCode;
    return {
      success: false,
      error: err.message,
      errorCode: err.code,
    };
  }
}

// DeepSeek Chat API call

async function callDeepSeekChat(
  _context: string,
  query: string,
  authToken: string,
  userId: string,
  chatId?: string,
  model?: string,
  responseMode?: string
): Promise<{ reply: string; chatId: string }> {
  // Use provided model override, then in-memory preference, then storage preference (default to deepseek)
  const selectedModel = model || inMemoryPreferredModel || await new Promise<string | null>((resolve) => {
    chrome.storage.local.get(['preferredModel'], (result) => {
      const val = result.preferredModel || localStorage.getItem('preferredModel');
      resolve(val || null);
    });
  });

  // Use provided responseMode override, then in-memory preference, then storage preference (default to full)
  const selectedResponseMode = responseMode || inMemoryPreferredResponseMode || await new Promise<string | null>((resolve) => {
    chrome.storage.local.get(['preferredResponseMode'], (result) => {
      const val = result.preferredResponseMode || localStorage.getItem('preferredResponseMode');
      resolve(val || null);
    });
  });

  // Send simple query format (backend handles history)
  const payload: any = {
    query: query,
    chatId: chatId || null,
    mode: 'chat',
    userId: userId || 'extension-user',
    model: selectedModel || 'gemini-2.5-flash',
    responseMode: selectedResponseMode || 'full'
  };

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  // Handle authentication errors
  if (response.status === 401 || response.status === 403) {
    const error = new Error('Session expired. Please log in again.') as ErrorWithCode;
    error.code = 'AUTH_EXPIRED';
    
    // Clear expired tokens from storage
    await chrome.storage.local.remove(['accessToken', 'idToken', 'userId']);
    
    throw error;
  }

  // Handle rate limiting
  if (response.status === 429) {
    const error = new Error('Daily limit exceeded. Try again tomorrow!') as ErrorWithCode;
    error.code = 'RATE_LIMIT';
    throw error;
  }

  // Handle validation errors
  if (response.status === 400) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.error || errorData.message || 'Invalid request';
    const error = new Error(`Validation failed: ${errorMsg}`) as ErrorWithCode;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  // Handle other errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.message || errorData.error || `HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Chat request failed');
  }

  // Extract and return chatId
  const returnedChatId = data.chatId || data.threadId;

  return {
    reply: data.reply || data.message || 'No response',
    chatId: returnedChatId || 'unknown'
  };
}

// Handler for session sync (from web app)

async function handleSyncSession(
  accessToken: string,
  idToken: string,
  userId: string,
  email: string
) {
  try {
    if (!accessToken || !idToken) {
      throw new Error('Missing required tokens');
    }

    // Decode JWT to get expiry time
    let tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // default 1 day
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      if (payload.exp) tokenExpiry = payload.exp * 1000;
    } catch (_) {}

    await chrome.storage.local.set({
      accessToken,
      idToken,
      userId,
      email,
      syncedAt: Date.now(),
      tokenExpiry,
    });

    return {
      success: true,
      message: 'Session synced successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    };
  }
}

// Initialization

// ============================================================
// PORT-BASED STREAMING (for optimize & chat streaming)
// ============================================================

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'optimize-stream') {
    port.onMessage.addListener(async (message: any) => {
      await handleStreamingOptimize(port, message);
    });
  }
  if (port.name === 'chat-stream') {
    port.onMessage.addListener(async (message: any) => {
      await handleStreamingChat(port, message);
    });
  }
});

async function handleStreamingOptimize(port: chrome.runtime.Port, message: any) {
  try {
    const storage = await chrome.storage.local.get(['idToken', 'accessToken', 'userId']);
    const authToken = storage.idToken || storage.accessToken;

    if (!authToken) {
      port.postMessage({ type: 'error', error: 'Please log in to the web app first', errorCode: 'AUTH_REQUIRED' });
      return;
    }

    const payload = {
      prompt: (message.text || '').trim(),
      mode: message.mode || 'precision',
      userId: storage.userId || 'extension-user',
    };

    const response = await fetch(OPTIMIZE_STREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401 || response.status === 403) {
      await chrome.storage.local.remove(['accessToken', 'idToken', 'userId']);
      port.postMessage({ type: 'error', error: 'Session expired. Please log in again.', errorCode: 'AUTH_EXPIRED' });
      return;
    }

    if (response.status === 429) {
      port.postMessage({ type: 'error', error: 'Daily limit exceeded. Try again tomorrow!', errorCode: 'RATE_LIMIT' });
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      port.postMessage({ type: 'error', error: errorData.error || errorData.message || `HTTP ${response.status}` });
      return;
    }

    if (!response.body) {
      port.postMessage({ type: 'error', error: 'Streaming not supported' });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        port.postMessage({ type: 'chunk', text: chunk });
      }
    }

    port.postMessage({ type: 'done' });
  } catch (error) {
    const err = error as Error;
    port.postMessage({ type: 'error', error: err.message || 'Streaming failed' });
  }
}

async function handleStreamingChat(port: chrome.runtime.Port, message: any) {
  try {
    const storage = await chrome.storage.local.get(['idToken', 'accessToken', 'userId']);
    const authToken = storage.idToken || storage.accessToken;

    if (!authToken) {
      port.postMessage({ type: 'error', error: 'Please log in to the web app first', errorCode: 'AUTH_REQUIRED' });
      return;
    }

    // Determine model and response mode
    const selectedModel = message.model || inMemoryPreferredModel || await new Promise<string | null>((resolve) => {
      chrome.storage.local.get(['preferredModel'], (result) => {
        resolve(result.preferredModel || null);
      });
    });

    const selectedResponseMode = message.responseMode || inMemoryPreferredResponseMode || await new Promise<string | null>((resolve) => {
      chrome.storage.local.get(['preferredResponseMode'], (result) => {
        resolve(result.preferredResponseMode || null);
      });
    });

    const payload: any = {
      query: message.query || '',
      chatId: message.chatId || null,
      mode: 'chat',
      userId: storage.userId || 'extension-user',
      model: selectedModel || 'gemini-2.5-flash',
      responseMode: selectedResponseMode || 'full',
    };

    const response = await fetch(CHAT_STREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401 || response.status === 403) {
      await chrome.storage.local.remove(['accessToken', 'idToken', 'userId']);
      port.postMessage({ type: 'error', error: 'Session expired. Please log in again.', errorCode: 'AUTH_EXPIRED' });
      return;
    }

    if (response.status === 429) {
      port.postMessage({ type: 'error', error: 'Daily limit exceeded. Try again tomorrow!', errorCode: 'RATE_LIMIT' });
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      port.postMessage({ type: 'error', error: errorData.error || errorData.message || `HTTP ${response.status}` });
      return;
    }

    if (!response.body) {
      port.postMessage({ type: 'error', error: 'Streaming not supported' });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let chatIdExtracted = false;
    let leftover = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      let chunk = decoder.decode(value, { stream: true });

      // Parse chatId metadata prefix from the first chunk(s)
      if (!chatIdExtracted) {
        chunk = leftover + chunk;
        leftover = '';
        const metaMatch = chunk.match(/^__CHAT_ID__:([^\n]+)\n/);
        if (metaMatch) {
          port.postMessage({ type: 'meta', chatId: metaMatch[1] });
          chunk = chunk.substring(metaMatch[0].length);
          chatIdExtracted = true;
          if (!chunk) continue;
        } else if (!chunk.includes('\n')) {
          // Haven't received a full line yet, buffer it
          leftover = chunk;
          continue;
        } else {
          // First line wasn't metadata, proceed normally
          chatIdExtracted = true;
        }
      }

      if (chunk) {
        port.postMessage({ type: 'chunk', text: chunk });
      }
    }

    port.postMessage({ type: 'done' });
  } catch (error) {
    const err = error as Error;
    port.postMessage({ type: 'error', error: err.message || 'Chat streaming failed' });
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First time installation
  } else if (details.reason === 'update') {
    // Extension updated
  }
});
