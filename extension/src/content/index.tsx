/**
 * Proptimizer Content Script Entry Point
 * Creates Shadow DOM and injects React app
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import ContentApp from './ContentApp';
import { initializeAuthSync } from './auth-sync';
// Import CSS as inline string for Shadow DOM injection
import styles from './style.css?inline';

/**
 * Mount the React app in Shadow DOM
 */
function mountExtension() {
  try {
    // Clean up any existing host element
    const existingHost = document.getElementById('proptimizer-host');
    if (existingHost) {
      existingHost.remove();
    }

    // Create host element with maximum z-index
    const hostElement = document.createElement('div');
    hostElement.id = 'proptimizer-host';
    hostElement.style.cssText = `
      all: initial;
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      z-index: 2147483647;
      pointer-events: none;
    `;
    
    document.body.appendChild(hostElement);

    // Attach shadow root
    const shadowRoot = hostElement.attachShadow({ mode: 'open' });

    // Inject styles into shadow DOM
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    shadowRoot.appendChild(styleElement);

    // Create root container for React
    const rootContainer = document.createElement('div');
    rootContainer.id = 'proptimizer-root';
    rootContainer.style.cssText = 'pointer-events: auto;';
    shadowRoot.appendChild(rootContainer);

    // Render React app
    const root = ReactDOM.createRoot(rootContainer);
    root.render(
      <React.StrictMode>
        <ContentApp />
      </React.StrictMode>
    );
    
  } catch (error) {
    console.error('PROPTIMIZER: Initialization failed!');
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

/**
 * Initialize when DOM is ready
 */
function initialize() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mountExtension();
    });
  } else {
    mountExtension();
  }
}

// Start initialization immediately
initialize();

// Initialize auth sync (for Web App only)
initializeAuthSync();

// Also listen for dynamic page changes (SPA navigation)
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver((_mutations) => {
    const hostExists = document.getElementById('proptimizer-host');
    if (!hostExists && document.body) {
      mountExtension();
    }
  });

  // Observe document.body for changes
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: false,
    });
  }
}