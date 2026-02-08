import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Solo separamos las librerías realmente pesadas (>500kb)
            // que son independientes del núcleo de React.
            if (id.includes('maplibre-gl') || id.includes('react-map-gl')) {
              return 'vendor-map';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('jspdf') || id.includes('xlsx') || id.includes('html2canvas')) {
              return 'vendor-export';
            }
            // Mantenemos React, Lucide y el resto juntos para evitar errores de inicialización
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
