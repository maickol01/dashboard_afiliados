import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-is'],
          'vendor-map': ['maplibre-gl', 'react-map-gl'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['@tanstack/react-query', '@supabase/supabase-js', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
