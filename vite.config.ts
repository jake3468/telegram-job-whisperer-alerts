
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
      "@clerk/clerk-react",
      "@clerk/types"
    ],
    // Exclude heavy libraries from pre-bundling for better lazy loading
    exclude: ["lottie-react"],
    force: mode === 'development'
  },
  build: {
    sourcemap: mode === 'development',
    // Improved chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Core dependencies
          vendor: ['react', 'react-dom'],
          
          // Authentication
          clerk: ['@clerk/clerk-react', '@clerk/types'],
          
          // UI components
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast', 'lucide-react'],
          
          // Animation and media (lazy loaded)
          animations: ['lottie-react'],
          
          // Utilities
          utils: ['clsx', 'tailwind-merge', 'date-fns']
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
