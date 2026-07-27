import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Library build: outputs dist/unilens.js — a single IIFE script embeddable in any HTML.
// Dev mode (`npm run dev`) serves index.html as a demo page.
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    // stamped so a page can say which build it is actually running — embedded copies
    // are cached hard, and "is my tab stale?" costs more to guess than to print
    __UNILENS_BUILD__: JSON.stringify(new Date().toISOString().slice(11, 19)),
  },
  build: {
    lib: {
      entry: 'src/main.tsx',
      name: 'UniLens',
      formats: ['iife'],
      fileName: () => 'unilens.js',
    },
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:5000',
    },
  },
})
