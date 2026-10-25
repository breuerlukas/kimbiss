import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { API_CACHE } from "./src/api/cache.ts";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Offline, yet a deploy shows on the next load: the page itself
      // (index.html) comes from the network first and from the cache only
      // offline, so it always names the newest hashed assets. Those are
      // precached; a new worker takes over at once (autoUpdate), no reload.
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
        globPatterns: ["**/*.{js,css,woff2,png,svg}"],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: { cacheName: "pages" },
          },
          // The last answers of the api, so the day, the weights and the
          // profile still show offline. Online they are always fresh. The
          // estimate progress is only worth anything live.
          {
            urlPattern: ({ url, request }) => request.method === "GET"
              && url.pathname.startsWith("/v1/") && url.pathname !== "/v1/meals/estimate/progress",
            handler: "NetworkFirst",
            options: { cacheName: API_CACHE },
          },
        ],
      },
    }),
  ],
  server: {
    // KIMBISS_API=https://kimbiss.lukasbreuer.de runs against production;
    // changeOrigin sends its host, which Caddy needs to pick the site.
    proxy: {
      "/v1": { target: process.env.KIMBISS_API ?? "http://localhost:18080", changeOrigin: true },
    },
  },
});
