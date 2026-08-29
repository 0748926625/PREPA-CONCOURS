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
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Prépa Fonction Publique Côte d\'Ivoire',
        short_name: 'Prépa Concours',
        description: 'Révision intelligente par QCM générés à partir de vos ressources',
        theme_color: '#0a5c36',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/PREPA-CONCOURS/',
        scope: '/PREPA-CONCOURS/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
})
