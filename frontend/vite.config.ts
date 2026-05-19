import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { serveAssetsPlugin } from './vite-plugin-serve-assets'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Ensure React Fast Refresh works properly
      fastRefresh: true,
    }),
    serveAssetsPlugin()
  ],
  assetsInclude: ['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.webp'],
  server: {
    fs: {
      strict: false,
    },
    middlewareMode: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './assets'),
    },
    // Ensure single React instance
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Force include React and react-dom to ensure single instance
    include: ['react', 'react-dom', 'react-apexcharts', 'apexcharts'],
    // Exclude problematic packages if needed
    exclude: [],
  },
  build: {
    commonjsOptions: {
      // Ensure proper CommonJS handling
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // Code splitting optimization
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const parts = id.split('node_modules/');
            const pathAfterNodeModules = parts[parts.length - 1];
            let packageName = '';
            if (pathAfterNodeModules.startsWith('@')) {
              const segments = pathAfterNodeModules.split('/');
              packageName = segments.slice(0, 2).join('/');
            } else {
              packageName = pathAfterNodeModules.split('/')[0];
            }

            if (['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler'].includes(packageName)) {
              return 'react-vendor';
            }
            if (['apexcharts', 'recharts', 'react-apexcharts'].includes(packageName)) {
              return 'chart-vendor';
            }
            if (['leaflet', 'react-leaflet'].includes(packageName) || packageName.startsWith('@react-google-maps')) {
              return 'map-vendor';
            }
            if (['jspdf', 'html2canvas'].includes(packageName)) {
              return 'pdf-vendor';
            }
            if (['framer-motion', 'gsap', 'lucide-react'].includes(packageName)) {
              return 'ui-vendor';
            }
            return 'vendor';
          }
        }
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Minify with esbuild (built-in, faster than terser, no extra dependencies needed)
    minify: 'esbuild',
  },
})
