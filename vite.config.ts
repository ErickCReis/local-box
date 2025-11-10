import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import netlify from '@netlify/vite-plugin-tanstack-start'

export default defineConfig((ctx) => {
  return {
    server: {
      port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
      allowedHosts: ['.trycloudflare.com'],
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths(),
      tanstackStart(),
      viteReact(),
      ctx.command === 'build' ? netlify() : null,
    ],
  }
})
