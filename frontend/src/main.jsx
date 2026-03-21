/**
 * Application Entry Point - CommunityPulse
 * Mounts React app to DOM and sets up providers
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Ensure DOM is ready before mounting
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}

function mountApp() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('❌ Root element #root not found in index.html');
    return;
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}