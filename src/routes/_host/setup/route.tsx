import {
  Link,
  Outlet,
  createFileRoute,
  useLocation,
  useSearch,
} from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { AlertCircle } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import * as z from 'zod'
import { setupStatus } from '../-server'
import { getDockerStatus } from './docker/-server'
import { getQuickTunnels } from './tunnel/-server'
import { checkAuthHealth } from './auth/-server'
import { checkConvexHealth } from './convex/-server'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const Route = createFileRoute('/_host/setup')({
  validateSearch: z.object({
    error: z.string().optional(),
  }),
  loader: async () => {
    // Use unified status for consistency, but also load detailed data for setup pages
    const [unifiedStatus, dockerStatus, quickTunnel, convexHealth, authHealth] =
      await Promise.all([
        setupStatus(),
        getDockerStatus(),
        getQuickTunnels(),
        checkConvexHealth(),
        checkAuthHealth(),
      ])

    return {
      unifiedStatus,
      dockerStatus,
      quickTunnel,
      convexHealth,
      authHealth,
    }
  },
  component: SetupLayout,
})

function SetupLayout() {
  const location = useLocation()
  const { error } = useSearch({ from: '/_host/setup' })
  const loaderData = Route.useLoaderData()

  // Shared setup status query
  const setupStatusFn = useServerFn(setupStatus)
  const { data: setupStatusData } = useQuery({
    queryKey: ['setup-status'],
    queryFn: () => setupStatusFn(),
    initialData: loaderData.unifiedStatus,
  })

  const unifiedStatus = setupStatusData

  // Show error toast if redirected from admin
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  // Determine active tab based on current route
  const getActiveTab = () => {
    const pathname = location.pathname
    if (pathname === '/setup' || pathname === '/setup/') return 'overview'
    if (pathname === '/setup/docker') return 'docker'
    if (pathname === '/setup/tunnel') return 'tunnel'
    if (pathname === '/setup/convex') return 'convex'
    if (pathname === '/setup/auth') return 'auth'
    return 'overview'
  }

  const allComplete =
    unifiedStatus.dockerRunning &&
    unifiedStatus.tunnelRunning &&
    unifiedStatus.convexEnabled &&
    unifiedStatus.authEnabled

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold">Setup</h1>
          {allComplete && (
            <Link to="/admin">
              <button className="text-sm text-primary hover:underline">
                Go to Admin →
              </button>
            </Link>
          )}
        </div>
        <p className="text-muted-foreground">
          Configure your local box host environment. Complete the checklist
          below to get started.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Setup Required</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {allComplete && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Setup Complete!</AlertTitle>
          <AlertDescription>
            All setup steps are complete. You can now access the admin panel.
          </AlertDescription>
        </Alert>
      )}

      <Tabs className="w-full" value={getActiveTab()}>
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <Link to="/setup" className="cursor-pointer">
              Overview
            </Link>
          </TabsTrigger>
          <TabsTrigger value="docker" asChild>
            <Link to="/setup/docker" className="cursor-pointer">
              Docker
            </Link>
          </TabsTrigger>
          <TabsTrigger value="tunnel" asChild>
            <Link to="/setup/tunnel" className="cursor-pointer">
              Tunnel
            </Link>
          </TabsTrigger>
          <TabsTrigger value="convex" asChild>
            <Link to="/setup/convex" className="cursor-pointer">
              Convex
            </Link>
          </TabsTrigger>
          <TabsTrigger value="auth" asChild>
            <Link to="/setup/auth" className="cursor-pointer">
              Auth
            </Link>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <Outlet />
        </div>
      </Tabs>
    </div>
  )
}
