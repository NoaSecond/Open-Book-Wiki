import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import authService from './services/auth-service';

// Exposer authService globalement pour le debug (uniquement en développement)
if (import.meta.env.DEV) {
  (window as typeof window & { authService: typeof authService }).authService = authService;
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
