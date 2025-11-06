import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import localtunnel from 'localtunnel'
import { Button } from '@/components/ui/button'

// --- Server functions ---

export const dockerUp = createServerFn().handler(async () => {
  const result = await Bun.$`docker compose up -d`
  if (result.exitCode !== 0) {
    throw new Error('Failed to start docker compose')
  }
  return result.text()
})

export const dockerDown = createServerFn().handler(async () => {
  const result = await Bun.$`docker compose down`
  if (result.exitCode !== 0) {
    throw new Error('Failed to stop docker compose')
  }
  return result.text()
})

export const dockerStatus = createServerFn().handler(async function* () {
  let count = 0
  while (count++ < 3) {
    const result = await Bun.$`docker compose ps --format json`
    if (result.exitCode !== 0) {
      throw new Error('Failed to get docker compose status')
    }
    yield result
      .text()
      .trim()
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        const data = JSON.parse(line)
        return {
          ID: data.ID,
          Name: data.Name,
          Image: data.Image,
          Ports: data.Ports,
          Status: data.Status,
          State: data.State,
        }
      })
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
})

let __activeTunnel: any = null
let __activeTunnelUrl: string | null = null

const UUID = crypto.randomUUID()

export const startTunnel = createServerFn().handler(async () => {
  if (__activeTunnel && __activeTunnelUrl) {
    return { url: __activeTunnelUrl }
  }

  const tunnel = await localtunnel({
    port: 3210,
    subdomain: `local-box-${UUID}`,
    host: 'https://loca.lt',
  })

  __activeTunnel = tunnel
  __activeTunnelUrl = tunnel.url
  tunnel.on('close', () => {
    __activeTunnel = null
    __activeTunnelUrl = null
  })

  return { url: __activeTunnelUrl }
})

export const stopTunnel = createServerFn().handler(async () => {
  if (__activeTunnel) {
    try {
      await __activeTunnel.close()
    } catch {
      // ignore
    }
  }
  __activeTunnel = null
  __activeTunnelUrl = null
  return { stopped: true }
})

// --- Route ---

export const Route = createFileRoute('/setup')({
  component: Setup,
})

function Setup() {
  const [dockerStatusResult, setDockerStatusResult] = useState<Array<any>>([])
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null)

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
      for await (const msg of await dockerStatus({
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
  const startTunnelFn = useServerFn(startTunnel)
  const startTunnelMutation = useMutation({
    mutationFn: startTunnelFn,
    onSuccess: (data: { url: string }) => setTunnelUrl(data.url),
  })

  const stopTunnelFn = useServerFn(stopTunnel)
  const stopTunnelMutation = useMutation({
    mutationFn: stopTunnelFn,
    onSuccess: () => setTunnelUrl(null),
  })

  const canCopy = useMemo(
    () => typeof navigator !== 'undefined' && !!navigator.clipboard,
    [],
  )

  return (
    <main className="p-8 flex flex-col gap-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold">Host Setup</h1>

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
        <h2 className="text-xl font-medium">Minimal Proxy (localtunnel)</h2>
        <p className="text-sm text-muted-foreground">
          Exposes your local port publicly. Defaults to port 5173 (override with
          <code className="px-1">TUNNEL_PORT</code> env).
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => startTunnelMutation.mutate({})}
            disabled={startTunnelMutation.isPending}
          >
            Start Proxy
          </Button>
          <Button
            variant="secondary"
            onClick={() => stopTunnelMutation.mutate({})}
            disabled={stopTunnelMutation.isPending}
          >
            Stop Proxy
          </Button>
        </div>
        {tunnelUrl ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm break-all">{tunnelUrl}</span>
            {canCopy ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(tunnelUrl)}
              >
                Copy
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Proxy not running</div>
        )}
      </section>
    </main>
  )
}
