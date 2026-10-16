import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png", "favicon.svg"],
      manifest: {
        name: "Kimbiss",
        short_name: "Kimbiss",
        description: "Food diary with photo recognition",
        lang: "de",
        display: "standalone",
        orientation: "portrait",
        background_color: "#F5F1FB",
        theme_color: "#F5F1FB",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2,png,svg}"],
        navigateFallbackDenylist: [/^\/v1\//],
      },
    }),
  ],
  server: {
    proxy: {
      "/v1": process.env.KIMBISS_API ?? "http://localhost:18080",
    },
  },
});
