import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
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
      refetchOnWindowFocus: false, 
      // Añadimos un meta para versionar la caché si fuera necesario
    },
  },
});

// Adaptador para idb-keyval (IndexedDB) con prefijo de versión
const CACHE_VERSION = 'v2';
export const idbPersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => {
        try {
            return await get(`${CACHE_VERSION}-${key}`);
        } catch (e) {
            console.error('Error reading from IDB', e);
            return null;
        }
    },
    setItem: async (key, value) => {
        try {
            await set(`${CACHE_VERSION}-${key}`, value);
        } catch (e) {
            console.error('Error writing to IDB', e);
        }
    },
    removeItem: async (key) => {
        try {
            await del(`${CACHE_VERSION}-${key}`);
        } catch (e) {
            console.error('Error removing from IDB', e);
        }
    },
  },
});
