
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    'process.env': {
      API_KEY: (process as any).env?.API_KEY
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
});
