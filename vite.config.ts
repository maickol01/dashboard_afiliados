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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Agrupar React
            if (id.includes('react')) return 'vendor-react';
            // Agrupar el Mapa (MapLibre es inmenso)
            if (id.includes('maplibre-gl') || id.includes('react-map-gl')) return 'vendor-map';
            // Agrupar Gráficas
            if (id.includes('recharts')) return 'vendor-charts';
            // Agrupar Supabase y utilidades de datos
            if (id.includes('@supabase') || id.includes('@tanstack')) return 'vendor-data';
            
            // El resto de librerías pequeñas
            return 'vendor-others';
          }
        },
      },
    },
    // Aumentamos el límite de advertencia ya que algunas librerías son pesadas por naturaleza
    chunkSizeWarningLimit: 1500,
  },
});