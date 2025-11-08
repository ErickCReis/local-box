import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { clientStore } from '@/lib/client-store'

export const Route = createFileRoute('/dashboard')({
  ssr: false,
  component: DashboardLayout,
  beforeLoad: async () => {
    const state = clientStore.state
    if (!state.convexQueryClient) {
      throw redirect({ to: '/enter-host' })
    }

    const { data } = await state.authClient.getSession()

    if (data?.session.token) {
      state.convexQueryClient.serverHttpClient?.setAuth(data.session.token)
    }

    const context = {
      ...state,
      user: data?.user,
    }

    return context
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
