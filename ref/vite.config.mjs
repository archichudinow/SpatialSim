import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Force Vite to always use the Three.js version installed in node_modules
      'three': path.resolve(__dirname, 'node_modules/three')
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  optimizeDeps: {
    include: [
      'three',
      'three/examples/jsm/controls/OrbitControls',
      'three/examples/jsm/loaders/GLTFLoader'
    ]
  },
  server: {
    port: 3000,
    open: true
  }
});