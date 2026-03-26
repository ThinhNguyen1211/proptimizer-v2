/**
 * Extension Sync Utility
 * Syncs user session from web app to Chrome extension
 */

import { fetchAuthSession } from 'aws-amplify/auth';

declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (extensionId: string, message: any, responseCallback: (response: any) => void) => void;
        lastError?: { message: string };
      };
    };
  }
}

const DEV_EXTENSION_ID = 'fbdngnnpcfnnlkdeldlmchibhjaonceo';
const PROD_EXTENSION_ID = 'fgnjfohkickjglglihmaojajigpnccbe';
const EXTENSION_IDS = [PROD_EXTENSION_ID, DEV_EXTENSION_ID];

export const EXTENSION_ID = PROD_EXTENSION_ID;

/**
 * Check if Chrome extension API is available
 */
export function isChromeExtensionAvailable(): boolean {
  return typeof window !== 'undefined' && 
         typeof window.chrome !== 'undefined' && 
         typeof window.chrome.runtime !== 'undefined';
}

export async function isExtensionInstalled(): Promise<boolean> {
  if (!isChromeExtensionAvailable()) {
    return false;
  }

  // Try each extension ID (prod first, then dev)
  for (const extId of EXTENSION_IDS) {
    const installed = await new Promise<boolean>((resolve) => {
      try {
        window.chrome!.runtime!.sendMessage(
          extId,
          { type: 'PING' },
          (response) => {
            if (window.chrome!.runtime!.lastError) {
              resolve(false);
            } else {
              resolve(response?.installed === true);
            }
          }
        );
        setTimeout(() => resolve(false), 1500);
      } catch (error) {
        resolve(false);
      }
    });
    if (installed) return true;
  }
  return false;
}

/**
 * Sync authentication token to extension
 * Returns object with success status and message
 */
export async function syncTokenToExtension(): Promise<{ success: boolean; message: string }> {
  // Check if Chrome extension API is available
  if (!isChromeExtensionAvailable()) {
    console.warn('Chrome Extension API not available');
    return { success: false, message: 'Chrome Extension API not available' };
  }

  try {
    // Get current auth session (force refresh to get latest tokens)
    const session = await fetchAuthSession({ forceRefresh: true });
    
    const accessToken = session.tokens?.accessToken?.toString();
    const idToken = session.tokens?.idToken?.toString();
    const userId = session.tokens?.idToken?.payload.sub as string;
    const email = session.tokens?.idToken?.payload.email as string;

    if (!accessToken || !idToken) {
      console.warn('No authentication tokens found');
      return { success: false, message: 'No authentication tokens found' };
    }

    // Also broadcast via window.postMessage so content script auth-sync.ts 
    // can pick it up (works regardless of extension ID)
    try {
      window.postMessage({
        type: 'PROPTIMIZER_AUTH_SYNC',
        tokens: { accessToken, idToken, userId, email }
      }, window.location.origin);
    } catch (_) {}

    // Try to sync with each extension ID
    for (const extId of EXTENSION_IDS) {
      const result = await new Promise<{ success: boolean; message: string }>((resolve) => {
        try {
          window.chrome!.runtime!.sendMessage(
            extId,
            {
              type: 'SYNC_SESSION',
              accessToken,
              idToken,
              userId,
              email,
            },
            (response) => {
              if (window.chrome!.runtime!.lastError) {
                resolve({ success: false, message: window.chrome!.runtime!.lastError.message });
              } else if (response?.success) {
                resolve({ success: true, message: `Extension synced (${extId.substring(0, 8)}...)` });
              } else {
                resolve({ success: false, message: response?.error || 'Unknown error' });
              }
            }
          );
          setTimeout(() => resolve({ success: false, message: 'Sync timeout' }), 3000);
        } catch (error) {
          resolve({ success: false, message: (error as Error).message });
        }
      });

      if (result.success) {
        return result;
      }
    }

    return { success: false, message: 'No extension responded to sync' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to sync token';
    return { success: false, message: errorMsg };
  }
}

/**
 * Clear tokens from extension on logout
 */
export function clearExtensionTokens(): void {
  // Broadcast via postMessage for content-script auth-sync
  try {
    window.postMessage({ type: 'PROPTIMIZER_AUTH_LOGOUT' }, window.location.origin);
  } catch (_) {}

  // Also send via chrome.runtime.sendMessage to each extension ID
  if (!isChromeExtensionAvailable()) return;
  for (const extId of EXTENSION_IDS) {
    try {
      window.chrome!.runtime!.sendMessage(extId, { type: 'CLEAR_SESSION' }, () => {
        // Ignore errors
        if (window.chrome!.runtime!.lastError) { /* noop */ }
      });
    } catch (_) {}
  }
}

/**
 * Get extension sync status
 */
export async function getExtensionStatus(): Promise<{
  installed: boolean;
  available: boolean;
  message: string;
}> {
  const available = isChromeExtensionAvailable();
  
  if (!available) {
    return {
      installed: false,
      available: false,
      message: 'Chrome Extension API not available',
    };
  }

  const installed = await isExtensionInstalled();

  if (!installed) {
    return {
      installed: false,
      available: true,
      message: 'Extension not installed',
    };
  }

  return {
    installed: true,
    available: true,
    message: 'Extension installed and ready',
  };
}