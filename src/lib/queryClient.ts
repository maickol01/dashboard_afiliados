import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';

// Configuración de caché
const STALE_TIME = 1000 * 60 * 5; // 5 minutos (datos frescos)
const GC_TIME = 1000 * 60 * 60 * 24; // 24 horas (basura recolectada)

// Cliente de React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      retry: 2,
      refetchOnWindowFocus: false, // Evitar recargas al cambiar de ventana para ahorrar datos
    },
  },
});

// Adaptador para idb-keyval (IndexedDB)
export const idbPersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => {
        try {
            return await get(key);
        } catch (e) {
            console.error('Error reading from IDB', e);
            return null;
        }
    },
    setItem: async (key, value) => {
        try {
            await set(key, value);
        } catch (e) {
            console.error('Error writing to IDB', e);
        }
    },
    removeItem: async (key) => {
        try {
            await del(key);
        } catch (e) {
            console.error('Error removing from IDB', e);
        }
    },
  },
});
