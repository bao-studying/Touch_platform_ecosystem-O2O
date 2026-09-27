import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "O2O Brand Promotion",
        short_name: "O2O Brand",
        description: "Quản lý thương hiệu O2O qua NFC/QR — Landing Page, Smart Review, CRM Loyalty",
        theme_color: "#4A2E1F",
        background_color: "#FBF6EE",
        display: "standalone",
        start_url: "/admin",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
