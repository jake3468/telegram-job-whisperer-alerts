
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
  // Simplified optimizeDeps to reduce startup overhead
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@clerk/clerk-react",
      "lottie-react"
    ]
  },
  build: {
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast']
        }
      }
    }
  }
}));
