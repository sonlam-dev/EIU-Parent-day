import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { demoRelay } from './dev/demoRelay';
export default defineConfig({
  plugins: [react(),demoRelay()],
  server: { host:'0.0.0.0',port:3000,strictPort:true },
  // The published JS bundle embeds every texture as base64. Let Vite emit/cache images separately.
  resolve: { alias: { '@dgreenheck/ez-tree': fileURLToPath(new URL('./node_modules/@dgreenheck/ez-tree/src/lib/index.js',import.meta.url)) } },
  optimizeDeps: { exclude: ['@dgreenheck/ez-tree'] },
  build: { chunkSizeWarningLimit: 900 },
});
