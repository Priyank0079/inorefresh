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
    host: '127.0.0.1',
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
    // Target modern browsers only — smaller output, no legacy polyfills
    target: 'esnext',

    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },

    // Split CSS per chunk so each lazy route only loads its own styles
    cssCodeSplit: true,

    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'esbuild',

    rollupOptions: {
      output: {
        // Use content-hashed filenames for long-lived caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',

        manualChunks(id) {
          // React core — smallest possible first-load chunk
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Router
          if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/react-router/') || id.includes('node_modules/@remix-run/')) {
            return 'vendor-router';
          }
          // Animation — large but only used on customer pages
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          // Charts — only used in admin dashboard
          if (id.includes('node_modules/apexcharts') || id.includes('node_modules/react-apexcharts')) {
            return 'vendor-charts';
          }
          // Socket.io — loaded when user logs in
          if (id.includes('node_modules/socket.io-client') || id.includes('node_modules/engine.io-client')) {
            return 'vendor-socket';
          }
          // PDF / canvas — only loaded on invoice download (keep separate so lazy import works)
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'vendor-pdf';
          }
          // HTTP client
          if (id.includes('node_modules/axios')) {
            return 'vendor-axios';
          }
          // Google Maps
          if (id.includes('node_modules/@googlemaps') || id.includes('node_modules/@vis.gl')) {
            return 'vendor-maps';
          }
          // Lottie — only loaded on specific pages
          if (id.includes('node_modules/lottie-react') || id.includes('node_modules/lottie-web')) {
            return 'vendor-lottie';
          }
          // Recharts — only used in reports
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-recharts';
          }
        },
      },
    },
  },
})
