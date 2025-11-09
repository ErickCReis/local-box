import { existsSync } from 'node:fs'
import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { Tunnel, bin, install } from 'cloudflared'
import { ArrowLeft } from 'lucide-react'
import type { TunnelEvents } from 'cloudflared'
import { Button } from '@/components/ui/button'
import { getHostStore, setHostStore } from '@/lib/host-store'
import { DOCKER } from '@/lib/docker'

// --- Server functions ---
export const dockerUp = createServerFn().handler(async () => {
  return await Bun.$`docker compose up -d`.text()
})

export const dockerDown = createServerFn().handler(async () => {
  return await Bun.$`docker compose down`.text()
})

export const getDockerStatus = createServerFn().handler(async () => {
  return await DOCKER.getDockerStatus()
})

export const whatchDockerStatus = createServerFn().handler(async function* () {
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

// --- Route ---

export const Route = createFileRoute('/_host/setup')({
  component: Setup,
  loader: async () => {
    const [dockerStatus, quickTunnel] = await Promise.all([
      getDockerStatus(),
      getQuickTunnels(),
    ])

    return {
      dockerStatus,
      quickTunnel,
    }
  },
})

function Setup() {
  const { quickTunnel, dockerStatus } = Route.useLoaderData()
  const [dockerStatusResult, setDockerStatusResult] = useState(dockerStatus)
  const [publicUrl, setPublicUrl] = useState(quickTunnel.tunnel)

  // Docker actions
  const dockerUpFn = useServerFn(dockerUp)
  const dockerUpMutation = useMutation({
    mutationFn: dockerUpFn,
  })

  const dockerDownFn = useServerFn(dockerDown)
  const dockerDownMutation = useMutation({
    mutationFn: dockerDownFn,
  })

  useEffect(() => {
    const controller = new AbortController()
    async function stream() {
      for await (const msg of await whatchDockerStatus({
        signal: controller.signal,
      })) {
        setDockerStatusResult(msg)
      }
      if (!controller.signal.aborted) {
        await new Promise((r) => setTimeout(r, 2000))
        void stream()
      }
    }
    stream()
    return () => controller.abort()
  }, [])

  // Tunnel actions
  const startTunnelsFn = useServerFn(startQuickTunnels)
  const startTunnelsMutation = useMutation({
    mutationFn: startTunnelsFn,
    onSuccess: (res) => {
      setPublicUrl(res.tunnel)
    },
  })

  const stopTunnelsFn = useServerFn(stopQuickTunnels)
  const stopTunnelsMutation = useMutation({
    mutationFn: stopTunnelsFn,
    onSuccess: () => {
      setPublicUrl(null)
    },
  })

  return (
    <main className="p-8 flex flex-col gap-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold flex items-center gap-2">
        <Link to="/">
          <ArrowLeft />
        </Link>
        Host Setup
      </h1>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Docker Compose</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => dockerUpMutation.mutate({})}
            disabled={dockerUpMutation.isPending}
          >
            Start Docker
          </Button>
          <Button
            variant="secondary"
            onClick={() => dockerDownMutation.mutate({})}
            disabled={dockerDownMutation.isPending}
          >
            Stop Docker
          </Button>
        </div>
        <div className="border rounded p-3">
          {dockerStatusResult.length > 0 ? (
            <div className="grid gap-2">
              {dockerStatusResult.map((item) => (
                <div key={item.ID} className="rounded border p-2">
                  <div className="font-medium">{item.Name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.Image}
                  </div>
                  <div className="text-sm">{item.Ports}</div>
                  <div className="text-sm">{item.Status}</div>
                  <div className="text-sm">{item.State}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No status yet</div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Public Tunnel</h2>

        <div className="flex gap-2">
          <Button
            onClick={() => startTunnelsMutation.mutate({})}
            disabled={startTunnelsMutation.isPending}
          >
            Start Tunnel
          </Button>
          <Button
            variant="secondary"
            onClick={() => stopTunnelsMutation.mutate({})}
            disabled={stopTunnelsMutation.isPending}
          >
            Stop Tunnel
          </Button>
        </div>

        <div className="space-y-4">
          <div className="border rounded p-4 space-y-3">
            <h3 className="font-medium">Proxy URL</h3>
            {publicUrl ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm break-all">{publicUrl}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(publicUrl)}
                >
                  Copy
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Tunnel not running
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
