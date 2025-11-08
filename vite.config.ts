import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'

export default defineConfig({
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    allowedHosts: ['.trycloudflare.com'],
    proxy: {},
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        /.*\.trycloudflare\.com.*/,
      ],
      credentials: true,
    },
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths(),
    tanstackStart(),
    nitro({
      config: {
        preset: 'bun',
        // routeRules: { '/convex/*': { proxy: 'http://localhost:3211' } },
      },
    }),
    viteReact(),
  ],
})
