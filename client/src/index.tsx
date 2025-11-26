import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client/react';
import './index.css';
import App from './App';
import { apolloClient } from './api/apolloClient';

// Suppress known deck.gl race condition error with MapLibre WebGL context initialization
// This error is cosmetic only - the WebGL context initializes successfully after this error
// See: https://github.com/visgl/deck.gl/issues (deck.gl v9.2.2 timing issue)
if (import.meta.env.DEV) {
  // Suppress console.error
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const errorMessage = args[0]?.toString() || '';
    if (
      errorMessage.includes('maxTextureDimension2D') ||
      errorMessage.includes('getMaxDrawingBufferSize') ||
      errorMessage.includes('WebGLCanvasContext')
    ) {
      return; // Silently ignore - this is a known race condition that doesn't affect functionality
    }
    originalError.apply(console, args);
  };

  // Suppress window.onerror for this specific error
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const errorMsg = message?.toString() || error?.message || '';
    if (
      errorMsg.includes('maxTextureDimension2D') ||
      errorMsg.includes('getMaxDrawingBufferSize')
    ) {
      return true; // Prevent default error handling
    }
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Suppress unhandledrejection for this specific error
  window.addEventListener('unhandledrejection', (event) => {
    const errorMsg = event.reason?.message || event.reason?.toString() || '';
    if (
      errorMsg.includes('maxTextureDimension2D') ||
      errorMsg.includes('getMaxDrawingBufferSize')
    ) {
      event.preventDefault(); // Prevent default handling
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
