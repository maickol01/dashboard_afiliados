import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GlobalFilterProvider } from './context/GlobalFilterContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalFilterProvider>
      <App />
    </GlobalFilterProvider>
  </StrictMode>
);
