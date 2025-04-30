import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    svgr(), // 👉 SVG as React Component
  ],
  resolve: {
    alias: {
      buffer: 'buffer', // 👈 needed for ethers v6
    },
  },
  define: {
    global: 'window', // 👈 ethers expects this
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
  },
});
