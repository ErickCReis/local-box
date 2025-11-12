import { existsSync } from 'node:fs'
import { createServerFn } from '@tanstack/react-start'
import { Tunnel, bin, install } from 'cloudflared'
import type { TunnelEvents } from 'cloudflared'
import { DOCKER } from '@/lib/docker'
import { getHostStore, setHostStore } from '@/lib/host-store'

// --- Docker server functions ---
export const dockerUp = createServerFn().handler(async () => {
  return await Bun.$`docker compose up -d`.text()
})

export const dockerDown = createServerFn().handler(async () => {
  return await Bun.$`docker compose down`.text()
})

export const getDockerStatus = createServerFn().handler(async () => {
  return await DOCKER.getDockerStatus()
})

export const watchDockerStatus = createServerFn().handler(async function* () {
  let count = 0
  while (count++ < 3) {
    yield await DOCKER.getDockerStatus()
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
})

// --- Quick Tunnel server functions ---
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

// --- Setup status ---
export const setupStatus = createServerFn().handler(async () => {
  const dockerStatus = await DOCKER.getDockerStatus()
  const tunnelUrl = getHostStore().tunnelUrl
  return {
    dockerRunning:
      dockerStatus.length > 0 &&
      dockerStatus.every((s) => s.State === 'running'),
    tunnelUrl,
  }
})
