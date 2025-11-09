import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { toast } from 'sonner'
import { clientStore } from '@/lib/client-store'
import { DOCKER } from '@/lib/docker'
import { getHostStore } from '@/lib/host-store'

export const setupStatus = createServerFn().handler(async () => {
  const dockerStatus = await DOCKER.getDockerStatus()
  const tunnelUrl = getHostStore().tunnelUrl
  return {
    dockerStatus:
      dockerStatus.length > 0 &&
      dockerStatus.every((s) => s.State === 'running'),
    tunnelUrl,
  }
})

export const Route = createFileRoute('/_host/admin')({
  ssr: false,
  component: AdminLayout,
  beforeLoad: async () => {
    const state = clientStore.state
    if (!state.convexQueryClient) {
      throw redirect({ to: '/setup' })
    }

    // Attach auth token to convex client if available
    const response = await state.authClient.getSession().catch(() => null)

    const context = {
      ...state,
      user: response?.data?.user,
    }
    return context
  },
  loader: async ({ context }) => {
    const { dockerStatus, tunnelUrl } = await setupStatus()
    if (!dockerStatus) {
      toast.error('Docker is not running')
      throw redirect({ to: '/setup' })
    }

    if (!tunnelUrl) {
      toast.error('Tunnel is not running')
      throw redirect({ to: '/setup' })
    }

    return {
      ...context,
      tunnelUrl,
    }
  },
})

function AdminLayout() {
  const { convexQueryClient, authClient } = Route.useRouteContext()

  return (
    <ConvexBetterAuthProvider
      client={convexQueryClient.convexClient}
      authClient={authClient}
    >
      <Outlet />
    </ConvexBetterAuthProvider>
  )
}
