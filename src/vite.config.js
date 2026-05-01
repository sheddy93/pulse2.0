import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-popover'],
          'charts': ['recharts'],
          'forms': ['react-hook-form'],
        }
      }
    }
  },
  define: {
    'import.meta.env.VITE_BASE44_APP_ID': JSON.stringify(import.meta.env.VITE_BASE44_APP_ID),
    'import.meta.env.VITE_BASE44_FUNCTIONS_VERSION': JSON.stringify(import.meta.env.VITE_BASE44_FUNCTIONS_VERSION),
    'import.meta.env.VITE_BASE44_APP_BASE_URL': JSON.stringify(import.meta.env.VITE_BASE44_APP_BASE_URL),
  }
})