import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

// Clear localStorage once to reset all dynamic data
if (typeof window !== 'undefined' && window.localStorage) {
  if (!localStorage.getItem('ts_cleared_force_v2')) {
    localStorage.clear();
    localStorage.setItem('ts_cleared_force_v2', 'true');
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
