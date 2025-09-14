
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    watch: {
      // Only ignore the most problematic directories
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**"
      ],
      // Remove polling as it can cause issues in development
      usePolling: false
    },
    // Remove strict file system restrictions for development
    fs: {
      strict: false
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Optimized for performance and code splitting
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime"
    ],
    // Exclude heavy libraries from pre-bundling for better lazy loading
    exclude: [
      "lottie-react", 
      "@clerk/clerk-react",
      "@clerk/types"
    ],
    force: mode === 'development'
  },
  build: {
    sourcemap: mode === 'development',
    // Improved chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React - smallest possible initial bundle
          if (id.includes('react') && !id.includes('node_modules')) {
            return 'vendor';
          }
          
          // Separate Clerk into its own chunk (lazy loaded)
          if (id.includes('@clerk')) {
            return 'auth';
          }
          
          // UI components - separate chunk
          if (id.includes('@radix-ui') || id.includes('lucide-react')) {
            return 'ui';
          }
          
          // Animations - lazy loaded
          if (id.includes('lottie')) {
            return 'animations';
          }
          
          // Utilities
          if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('date-fns')) {
            return 'utils';
          }
          
          // Large libraries get their own chunks
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    
    // Performance optimizations
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production'
      }
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  }
}));
