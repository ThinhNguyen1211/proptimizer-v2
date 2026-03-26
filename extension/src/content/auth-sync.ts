/**
 * Auth Sync Module - Automatically sync tokens from Web App to Extension
 * This script runs ONLY on the Proptimizer Web App domain
 */

const WEB_APP_DOMAINS = [
  'd3jqm7so635aqb.cloudfront.net',
  'localhost:5173',
  'localhost:3000'
];

/**
 * Check if current page is the Proptimizer Web App
 */
function isWebApp(): boolean {
  const currentUrl = window.location.href;
  return WEB_APP_DOMAINS.some(domain => currentUrl.includes(domain));
}

/**
 * Listen for auth sync messages from the web app's own script
 */
function listenForAuthSync() {
  window.addEventListener('message', async (event) => {
    const isValidOrigin = WEB_APP_DOMAINS.some(domain => 
      event.origin.includes(domain) || event.origin === window.location.origin
    );
    if (!isValidOrigin) return;

    // Handle logout
    if (event.data?.type === 'PROPTIMIZER_AUTH_LOGOUT') {
      try {
        await chrome.storage.local.remove(['accessToken', 'idToken', 'userId', 'email', 'syncedAt']);
      } catch (_) {}
      return;
    }

    // Handle auth sync
    if (event.data?.type === 'PROPTIMIZER_AUTH_SYNC' && event.data?.tokens) {
      const { accessToken, idToken, userId, email } = event.data.tokens;

      if (accessToken && idToken) {
        try {
          await chrome.storage.local.set({
            accessToken,
            idToken,
            userId,
            email
          });
        } catch (error) {
          // Failed to save tokens
        }
      }
    }
  });
}

/**
 * Initialize auth sync
 */
export function initializeAuthSync() {
  if (!isWebApp()) {
    return; // Only run on Web App
  }

  // Listen for auth sync messages from the web app
  listenForAuthSync();

  // Check if extension is installed (already done by web app's extensionSync.ts)
  // So we just listen and wait for the sync message
}

// Auto-initialize when script loads
if (typeof chrome !== 'undefined' && chrome.storage) {
  initializeAuthSync();
}
