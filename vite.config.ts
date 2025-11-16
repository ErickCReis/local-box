import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { devtools } from '@tanstack/devtools-vite'

import { nitro } from 'nitro/vite'

export default defineConfig((ctx) => {
  return {
    server: {
      port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
      allowedHosts: ['.trycloudflare.com'],
    },
    optimizeDeps: {
      exclude: ['ssh2', 'cpu-features'],
    },
    plugins: [
      devtools({ enhancedLogs: { enabled: false } }),
      tailwindcss(),
      tsConfigPaths(),
      tanstackStart({}),
      viteReact({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
      ctx.command === 'build' ? nitro({ preset: 'bun' }) : null,
    ],
  }
})
