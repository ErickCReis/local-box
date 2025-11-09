import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { clientStore } from '@/lib/client-store'
import { DOCKER } from '@/lib/docker'

export const ensureDockerRunning = createServerFn().handler(async () => {
  const status = await DOCKER.getDockerStatus()
  // Consider Docker "running" if any service is in running state
  const running = status.some((s) => s.State === 'running')
  return running
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
    if (response?.data?.session.token) {
      state.convexQueryClient.serverHttpClient?.setAuth(
        response.data.session.token,
      )
    }

    const context = {
      ...state,
      user: response?.data?.user,
    }
    return context
  },
  loader: async ({ context }) => {
    const ok = await ensureDockerRunning()
    if (!ok) {
      throw redirect({ to: '/setup' })
    }
    return context
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
