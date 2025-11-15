import { existsSync } from 'node:fs'
import { createServerFn } from '@tanstack/react-start'
import { Tunnel, bin, install } from 'cloudflared'
import type { TunnelEvents } from 'cloudflared'
import { getHostStore, setHostStore } from '@/lib/host-store'

// --- Tunnel server functions ---
export const getQuickTunnels = createServerFn().handler(() => {
  const hostStore = getHostStore()
  return {
    tunnel: hostStore.tunnelUrl,
  }
})

export const startQuickTunnels = createServerFn().handler(async () => {
  const hostStore = getHostStore()

  if (!existsSync(bin)) {
    await install(bin)
  }

  const events = ['stdout', 'stderr', 'exit', 'error']
  let tunnel: Tunnel | null = hostStore.tunnel
  let url = hostStore.tunnelUrl

  // Start single proxy tunnel (handles both services) if not already running
  if (!url) {
    tunnel = Tunnel.quick('http://localhost:8080')
    url = await new Promise<string>((r) => tunnel!.once('url', r))
    await new Promise((resolve) => tunnel!.once('connected', resolve))

    for (const event of events) {
      tunnel.on(event as keyof TunnelEvents, (data: unknown) => {
        console.log(`tunnel ${event}:`, data)
      })
    }
  }

  setHostStore({
    ...getHostStore(),
    tunnel,
    tunnelUrl: url,
  })

  return {
    tunnel: url,
  }
})

export const stopQuickTunnels = createServerFn().handler(async () => {
  const hostStore = getHostStore()

  // Stop tunnel
  if (hostStore.tunnel) {
    await hostStore.tunnel.stop()
  }

  setHostStore({
    ...getHostStore(),
    tunnel: null,
    tunnelUrl: null,
  })

  return null
})

