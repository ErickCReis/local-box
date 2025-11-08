import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'

export default defineConfig({
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    allowedHosts: ['.trycloudflare.com', 'localhost'],
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        /.*\.trycloudflare\.com/,
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
        routeRules: {
          '/api/*': {
            cors: true,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Credentials': 'true',
            },
          },
        },
      },
    }),
    viteReact(),
  ],
})
