import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import App from './App.tsx';
import './index.css';
import { GlobalFilterProvider } from './context/GlobalFilterContext';
import { queryClient, idbPersister } from './lib/queryClient';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister: idbPersister }}
    >
      <GlobalFilterProvider>
        <App />
      </GlobalFilterProvider>
    </PersistQueryClientProvider>
  </StrictMode>
);
