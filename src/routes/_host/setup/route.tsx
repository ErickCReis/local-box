import {
  Link,
  Outlet,
  createFileRoute,
  useLocation,
  useSearch,
} from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'
import { Suspense, useEffect } from 'react'
import { toast } from 'sonner'
import * as z from 'zod'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const Route = createFileRoute('/_host/setup')({
  validateSearch: z.object({
    error: z.string().optional(),
  }),
  component: SetupLayout,
})

function SetupLayout() {
  const location = useLocation()
  const { error } = useSearch({ from: '/_host/setup' })

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
    if (pathname === '/setup/billing') return 'billing'
    return 'overview'
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold">Setup</h1>

          <Link to="/admin">
            <button className="text-sm text-primary hover:underline">
              Go to Admin →
            </button>
          </Link>
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
          <TabsTrigger value="billing" asChild>
            <Link to="/setup/billing" className="cursor-pointer">
              Billing
            </Link>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <Suspense fallback={<div>Loading...</div>}>
            <Outlet />
          </Suspense>
        </div>
      </Tabs>
    </div>
  )
}
