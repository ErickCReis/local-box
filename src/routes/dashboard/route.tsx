import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { clientStore } from '@/lib/client-store'

export const Route = createFileRoute('/dashboard')({
  ssr: false,
  component: DashboardLayout,
  beforeLoad: () => {
    const state = clientStore.state
    if (!state.convexQueryClient) {
      throw redirect({ to: '/enter-host' })
    }

    return state
  },
  loader: ({ context }) => context,
})

function DashboardLayout() {
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
