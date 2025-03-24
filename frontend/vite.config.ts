import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@styles": path.resolve(__dirname, "src/styles"),
    },
  },
  server: {
    proxy: {
      // Proxy API requests to Django backend
      "/api": {
        target: "http://localhost:8000", // Django dev server
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      // Proxy WebSocket requests if needed
      "/ws": {
        target: "ws://localhost:8000",
        ws: true,
      }
    }
  }
});
