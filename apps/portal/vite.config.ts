import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    proxy: {
      // Proxy API requests to backend during development
      // "/api-internal": {
      //   target: "https://download.yipai360.com",
      //   changeOrigin: true,
      // },
      // Proxy API requests to backend during development
      "/api-internal/": {
        target: "http://localhost:3333",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-internal/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "antd-vendor": ["antd"],
          "query-vendor": ["@tanstack/react-query"],
        },
      },
    },
  },
});
