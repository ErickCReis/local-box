import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { devtools } from '@tanstack/devtools-vite'

import { nitro } from 'nitro/vite'

export default defineConfig((ctx) => {
  const buildMode = process.env.BUILD_MODE || 'host'
  const isClientMode = buildMode === 'client'

  return {
    server: {
      port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
      allowedHosts: ['.trycloudflare.com'],
    },
    optimizeDeps: {
      exclude: ['ssh2', 'cpu-features'],
    },
    define: {
      'import.meta.env.BUILD_MODE': JSON.stringify(buildMode),
    },
    plugins: [
      devtools({ enhancedLogs: { enabled: false } }),
      tailwindcss(),
      tsConfigPaths(),
      tanstackStart({
        pages: [
          {
            path: '/',
            prerender: { enabled: true, crawlLinks: false },
          },
        ],
        sitemap: {
          enabled: true,
          host: 'https://local-box.com',
        },
      }),
      viteReact({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
      ctx.command === 'build'
        ? nitro({
            preset: isClientMode ? 'netlify' : 'bun',
          })
        : null,
    ],
  }
})
