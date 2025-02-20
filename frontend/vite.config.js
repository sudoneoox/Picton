import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // Or your framework plugin
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@styles": path.resolve(__dirname, "src/styles"),
    },
  },
});
