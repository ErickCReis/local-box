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
    tunnelApi: hostStore.tunnelUrlApi,
    tunnelConvex: hostStore.tunnelUrlConvex,
  }
})

export const startQuickTunnels = createServerFn().handler(async () => {
  const hostStore = getHostStore()

  if (!existsSync(bin)) {
    await install(bin)
  }

  const events = ['stdout', 'stderr', 'exit', 'error']
  let tunnelApi: Tunnel | null = hostStore.tunnelApi
  let urlApi = hostStore.tunnelUrlApi
  let tunnelConvex: Tunnel | null = hostStore.tunnelConvex
  let urlConvex = hostStore.tunnelUrlConvex

  // Start API tunnel if not already running
  if (!urlApi) {
    tunnelApi = Tunnel.quick('http://localhost:3000')
    urlApi = await new Promise<string>((r) => tunnelApi!.once('url', r))
    await new Promise((resolve) => tunnelApi!.once('connected', resolve))

    for (const event of events) {
      tunnelApi.on(event as keyof TunnelEvents, (data: unknown) => {
        console.log(`tunnelApi ${event}:`, data)
      })
    }
  }

  // Start Convex tunnel if not already running
  if (!urlConvex) {
    tunnelConvex = Tunnel.quick('http://localhost:3210')
    urlConvex = await new Promise<string>((r) => tunnelConvex!.once('url', r))
    await new Promise((resolve) => tunnelConvex!.once('connected', resolve))

    for (const event of events) {
      tunnelConvex.on(event as keyof TunnelEvents, (data: unknown) => {
        console.log(`tunnelConvex ${event}:`, data)
      })
    }
  }

  setHostStore({
    ...getHostStore(),
    tunnelApi,
    tunnelUrlApi: urlApi,
    tunnelConvex,
    tunnelUrlConvex: urlConvex,
  })

  return {
    tunnelApi: urlApi,
    tunnelConvex: urlConvex,
  }
})

export const stopQuickTunnels = createServerFn().handler(async () => {
  const hostStore = getHostStore()

  // Stop API tunnel
  if (hostStore.tunnelApi) {
    await hostStore.tunnelApi.stop()
  }

  // Stop Convex tunnel
  if (hostStore.tunnelConvex) {
    await hostStore.tunnelConvex.stop()
  }

  setHostStore({
    ...getHostStore(),
    tunnelApi: null,
    tunnelUrlApi: null,
    tunnelConvex: null,
    tunnelUrlConvex: null,
  })

  return null
})

// --- Route ---

export const Route = createFileRoute('/(host)/setup')({
  component: Setup,
  loader: async () => {
    const [dockerStatus, quickTunnels] = await Promise.all([
      getDockerStatus(),
      getQuickTunnels(),
    ])

    return {
      dockerStatus,
      quickTunnels,
    }
  },
})

function Setup() {
  const { quickTunnels, dockerStatus } = Route.useLoaderData()
  const [dockerStatusResult, setDockerStatusResult] = useState(dockerStatus)
  const [publicUrlApi, setPublicUrlApi] = useState(quickTunnels.tunnelApi)
  const [publicUrlConvex, setPublicUrlConvex] = useState(
    quickTunnels.tunnelConvex,
  )

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
      setPublicUrlApi(res.tunnelApi)
      setPublicUrlConvex(res.tunnelConvex)
    },
  })

  const stopTunnelsFn = useServerFn(stopQuickTunnels)
  const stopTunnelsMutation = useMutation({
    mutationFn: stopTunnelsFn,
    onSuccess: () => {
      setPublicUrlApi(null)
      setPublicUrlConvex(null)
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
        <h2 className="text-xl font-medium">Public Tunnels</h2>

        <div className="flex gap-2">
          <Button
            onClick={() => startTunnelsMutation.mutate({})}
            disabled={startTunnelsMutation.isPending}
          >
            Start All Tunnels
          </Button>
          <Button
            variant="secondary"
            onClick={() => stopTunnelsMutation.mutate({})}
            disabled={stopTunnelsMutation.isPending}
          >
            Stop All Tunnels
          </Button>
        </div>

        <div className="space-y-4">
          <div className="border rounded p-4 space-y-3">
            <h3 className="font-medium">API</h3>
            {publicUrlApi ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm break-all">
                  {publicUrlApi}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(publicUrlApi)}
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

          <div className="border rounded p-4 space-y-3">
            <h3 className="font-medium">Convex</h3>
            {publicUrlConvex ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm break-all">
                  {publicUrlConvex}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(publicUrlConvex)}
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
