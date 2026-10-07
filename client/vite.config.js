import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  ssr: {
    noExternal: ['react-router', 'react-router-dom'],
    resolve: { conditions: ['module', 'import', 'development|production'] },
  },
  server: { port: 5173 },
  build: { chunkSizeWarningLimit: 600 },
});
