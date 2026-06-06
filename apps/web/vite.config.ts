import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query", "axios"],
          charts: ["recharts"],
          forms: ["react-hook-form", "@hookform/resolvers", "zod"]
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@ams/api-types": path.resolve(__dirname, "../../packages/api-types/src"),
      "@ams/constants": path.resolve(__dirname, "../../packages/constants/src"),
      "@ams/permissions": path.resolve(__dirname, "../../packages/permissions/src"),
      "@ams/schemas": path.resolve(__dirname, "../../packages/schemas/src"),
      "@ams/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@ams/utils": path.resolve(__dirname, "../../packages/utils/src")
    }
  }
});
