import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development the Vite dev server proxies /api to the Django backend, so the
// browser sees a single origin (no CORS setup needed). Override the target with
// VITE_DEV_API_TARGET if Django runs somewhere else.
const apiTarget = process.env.VITE_DEV_API_TARGET || "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
    },
  },
});
