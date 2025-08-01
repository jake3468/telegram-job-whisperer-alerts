
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
  // Optimized dependencies for faster startup
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@clerk/clerk-react"
    ],
    exclude: [
      "lottie-react" // Lazy load for better performance
    ]
  },
  build: {
    sourcemap: mode === 'development',
    // Optimized chunking strategy for better caching and loading
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // Separate chunk for React and core libraries
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            
            // UI library chunk
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            
            // Authentication chunk
            if (id.includes('@clerk')) {
              return 'auth-vendor';
            }
            
            // Lottie animation chunk (lazy loaded)
            if (id.includes('lottie-react')) {
              return 'animations';
            }
            
            // Supabase and API chunk
            if (id.includes('@supabase') || id.includes('@tanstack')) {
              return 'api-vendor';
            }
            
            // Other vendor libraries
            return 'vendor';
          }
          
          // App chunks
          if (id.includes('src/pages/')) {
            return 'pages';
          }
          
          if (id.includes('src/components/ui/')) {
            return 'ui-components';
          }
          
          if (id.includes('src/hooks/') || id.includes('src/services/')) {
            return 'app-logic';
          }
        },
        // Optimize chunk names for better caching
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          return `${name}-[hash].js`;
        }
      }
    },
    // Additional build optimizations
    target: 'esnext',
    minify: 'esbuild'
  }
}));
