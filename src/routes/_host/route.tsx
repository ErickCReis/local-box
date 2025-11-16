import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import {
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  Play,
  Square,
} from 'lucide-react'
import { mutations as dockerMutations } from './setup/docker/-mutations'
import { mutations as tunnelMutations } from './setup/tunnel/-mutations'
import { queries } from './-queries'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const Route = createFileRoute('/_host')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(queries.options())
  },
  component: HostLayout,
})

function HostLayout() {
  // Shared setup status query
  const { data: setupStatusData, refetch } = useSuspenseQuery(
    queries.useOptions(),
  )

  // Docker actions
  const dockerUpMutation = useMutation(dockerMutations.dockerUp.useOptions())
  const dockerDownMutation = useMutation(
    dockerMutations.dockerDown.useOptions(),
  )

  // Tunnel actions
  const startTunnelsMutation = useMutation({
    ...tunnelMutations.tunnelStart.useOptions(),
    onSuccess: async () => await refetch(),
  })

  const stopTunnelsMutation = useMutation({
    ...tunnelMutations.tunnelStop.useOptions(),
    onSuccess: async () => await refetch(),
  })

  const isDockerUpPending = dockerMutations.dockerUp.useIsPending()
  const isDockerDownPending = dockerMutations.dockerDown.useIsPending()
  const isTunnelStartPending = tunnelMutations.tunnelStart.useIsPending()
  const isTunnelStopPending = tunnelMutations.tunnelStop.useIsPending()

  const dockerRunning =
    setupStatusData.dockerStatus.length > 0 &&
    setupStatusData.dockerStatus.every((s) => s.State === 'running')

  const tunnelRunning = !!setupStatusData.quickTunnel.tunnel
  const convexEnabled = setupStatusData.convexHealth.healthy
  const authEnabled = setupStatusData.authHealth.hasOwner

  const completedArray = [
    dockerRunning,
    tunnelRunning,
    convexEnabled,
    authEnabled,
  ]
  const completedCount = completedArray.filter(Boolean).length
  const totalCount = completedArray.length

  // Calculate overall status
  const allRunning =
    dockerRunning && tunnelRunning && convexEnabled && authEnabled
  const statusText = allRunning
    ? 'Running'
    : completedCount > 0
      ? 'Partial'
      : 'Stopped'
  const statusColor = allRunning
    ? 'bg-green-500'
    : completedCount > 0
      ? 'bg-yellow-500'
      : 'bg-gray-400'

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
                  search={{ error: undefined }}
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${statusColor}`} />
                  <span className="text-sm font-medium">{statusText}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Setup: {completedCount}/{totalCount} complete
                </div>
                <DropdownMenuSeparator />

                {/* Docker Section */}
                <DropdownMenuLabel className="flex items-center justify-between">
                  <Link
                    to="/setup/docker"
                    search={{ error: undefined }}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Docker</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </DropdownMenuLabel>
                <div className="px-2 py-1.5 flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      dockerRunning ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className="text-sm flex-1">
                    {dockerRunning ? 'Running' : 'Stopped'}
                  </span>
                  {dockerRunning ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        dockerDownMutation.mutate({})
                      }}
                      disabled={isDockerDownPending}
                    >
                      {isDockerDownPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Square className="h-3 w-3" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        dockerUpMutation.mutate({})
                      }}
                      disabled={isDockerUpPending}
                    >
                      {isDockerUpPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>

                <DropdownMenuSeparator />

                {/* Tunnel Section */}
                <DropdownMenuLabel className="flex items-center justify-between">
                  <Link
                    to="/setup/tunnel"
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Tunnel</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </DropdownMenuLabel>
                <div className="px-2 py-1.5 flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      tunnelRunning ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className="text-sm flex-1">
                    {tunnelRunning ? 'Online' : 'Offline'}
                  </span>
                  {tunnelRunning ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        stopTunnelsMutation.mutate({})
                      }}
                      disabled={isTunnelStopPending}
                    >
                      {isTunnelStopPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Square className="h-3 w-3" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        startTunnelsMutation.mutate({})
                      }}
                      disabled={isTunnelStartPending}
                    >
                      {isTunnelStartPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
                {tunnelRunning && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        navigator.clipboard.writeText(
                          setupStatusData.quickTunnel.tunnel || '',
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                      Copy URL
                    </DropdownMenuItem>
                    <div className="px-2 py-1.5 bg-muted rounded text-xs font-mono break-all">
                      {setupStatusData.quickTunnel.tunnel}
                    </div>
                  </>
                )}

                <DropdownMenuSeparator />

                {/* Convex Section */}
                <DropdownMenuLabel className="flex items-center justify-between">
                  <Link
                    to="/setup/convex"
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Convex Backend</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </DropdownMenuLabel>
                <div className="px-2 py-1.5 flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      convexEnabled ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className="text-sm flex-1">
                    {convexEnabled ? 'Enabled' : 'Not configured'}
                  </span>
                </div>

                <DropdownMenuSeparator />

                {/* Auth Section */}
                <DropdownMenuLabel className="flex items-center justify-between">
                  <Link
                    to="/setup/auth"
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Auth</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </DropdownMenuLabel>
                <div className="px-2 py-1.5 flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      authEnabled ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className="text-sm flex-1">
                    {authEnabled ? 'Configured' : 'Not configured'}
                  </span>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
