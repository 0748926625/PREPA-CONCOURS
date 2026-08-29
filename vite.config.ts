import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// Base path matches the GitHub Pages repo name: https://<user>.github.io/PREPA-CONCOURS/
export default defineConfig({
  base: '/PREPA-CONCOURS/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Prepa Concours - Révision QCM',
        short_name: 'Prepa Concours',
        description: 'Révision intelligente par QCM générés à partir de vos ressources',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/PREPA-CONCOURS/',
        scope: '/PREPA-CONCOURS/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
})
