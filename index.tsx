
import * as BufferModule from 'buffer';

/**
 * Polyfill Buffer and process globals immediately.
 * We use the module namespace import and check for the .Buffer property
 * to ensure we have the actual constructor function, avoiding 'Illegal constructor' errors
 * that occur when a module object is assigned to the global instead of the constructor.
 */
const BufferConstructor = (BufferModule as any).Buffer || BufferModule;
if (typeof window !== 'undefined') {
  (window as any).Buffer = BufferConstructor;
  (window as any).global = window;
  // process is already partly polyfilled in index.html, but we ensure it here too
  (window as any).process = (window as any).process || {
    env: { NODE_ENV: 'development' },
    browser: true,
    version: '',
    versions: {},
    nextTick: (fn: Function) => setTimeout(fn, 0),
    cwd: () => '/'
  };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
