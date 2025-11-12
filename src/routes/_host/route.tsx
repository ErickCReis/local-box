import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Copy, Play, Square } from 'lucide-react'
import {
  dockerDown,
  dockerUp,
  getQuickTunnels,
  setupStatus,
  startQuickTunnels,
  stopQuickTunnels,
} from './-server'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_host')({
  loader: async () => setupStatus(),
  component: HostLayout,
})

function HostLayout() {
  const { dockerRunning, tunnelUrl } = Route.useLoaderData()
  const [currentTunnelUrl, setCurrentTunnelUrl] = useState(tunnelUrl)

  // Docker actions
  const dockerUpFn = useServerFn(dockerUp)
  const dockerUpMutation = useMutation({
    mutationFn: dockerUpFn,
  })

  const dockerDownFn = useServerFn(dockerDown)
  const dockerDownMutation = useMutation({
    mutationFn: dockerDownFn,
  })

  // Tunnel actions
  const startTunnelsFn = useServerFn(startQuickTunnels)
  const startTunnelsMutation = useMutation({
    mutationFn: startTunnelsFn,
    onSuccess: (res) => {
      setCurrentTunnelUrl(res.tunnel)
    },
  })

  const stopTunnelsFn = useServerFn(stopQuickTunnels)
  const stopTunnelsMutation = useMutation({
    mutationFn: stopTunnelsFn,
    onSuccess: () => {
      setCurrentTunnelUrl(null)
    },
  })

  // Sync tunnel URL from loader
  useEffect(() => {
    setCurrentTunnelUrl(tunnelUrl)
  }, [tunnelUrl])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-semibold">Host Admin</h1>
              <nav className="flex items-center gap-4">
                <Link
                  to="/setup"
                  activeProps={{
                    className: 'text-foreground underline',
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Setup
                </Link>
                <Link
                  to="/admin/members"
                  activeProps={{
                    className: 'text-foreground underline',
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Members
                </Link>
                <Link
                  to="/admin/tags"
                  activeProps={{
                    className: 'text-foreground underline',
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tags
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Docker Status */}
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    dockerRunning ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                  title={dockerRunning ? 'Docker running' : 'Docker stopped'}
                />
                <span className="text-sm text-muted-foreground">Docker</span>
                <div className="flex gap-1">
                  {dockerRunning ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => dockerDownMutation.mutate({})}
                      disabled={dockerDownMutation.isPending}
                      title="Stop Docker"
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => dockerUpMutation.mutate({})}
                      disabled={dockerUpMutation.isPending}
                      title="Start Docker"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Tunnel Status */}
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    currentTunnelUrl ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                  title={currentTunnelUrl ? 'Tunnel running' : 'Tunnel stopped'}
                />
                <span className="text-sm text-muted-foreground">Tunnel</span>

                <div className="flex gap-1">
                  {currentTunnelUrl ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigator.clipboard.writeText(currentTunnelUrl)
                      }
                      title="Copy tunnel URL"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startTunnelsMutation.mutate({})}
                      disabled={startTunnelsMutation.isPending}
                      title="Start Tunnel"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => stopTunnelsMutation.mutate({})}
                    disabled={stopTunnelsMutation.isPending}
                    title="Stop Tunnel"
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
