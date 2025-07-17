
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    watch: {
      // Ignore node_modules and other large directories
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/coverage/**",
        "**/.next/**",
        "**/.nuxt/**",
        "**/.cache/**",
        "**/tmp/**",
        "**/temp/**"
      ],
      // Use polling for file watching to reduce file handles
      usePolling: true,
      interval: 1000
    },
    fs: {
      // Restrict file access to project directory
      strict: true
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
  // Optimize dependencies to reduce file watching overhead
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-query",
      "@clerk/clerk-react",
      "lucide-react",
      "lottie-react"
    ],
    exclude: [
      // Exclude large packages that don't need optimization
      "@supabase/supabase-js"
    ]
  },
  build: {
    // Reduce build overhead
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast', '@radix-ui/react-select']
        }
      }
    }
  }
}));
