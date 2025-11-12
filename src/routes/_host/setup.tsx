import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Button } from '@/components/ui/button'
import {
  dockerDown,
  dockerUp,
  getDockerStatus,
  getQuickTunnels,
  startQuickTunnels,
  stopQuickTunnels,
  watchDockerStatus,
} from './-server'

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
      for await (const msg of await watchDockerStatus({
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
    <div className="flex flex-col gap-6">
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
    </div>
  )
}
