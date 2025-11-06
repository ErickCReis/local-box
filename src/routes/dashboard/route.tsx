import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getCookie } from '@convex-dev/better-auth/client/plugins'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import {
  fetchSession,
  getCookieName,
} from '@convex-dev/better-auth/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerFn } from '@tanstack/react-start'
import { createAuth } from '@convex/auth'
import { clientStore } from '@/lib/client-store'

const fetchAuth = createServerFn().handler(async () => {
  const { session } = await fetchSession(getRequest())
  const sessionCookieName = getCookieName(createAuth)
  const token = getCookie(sessionCookieName)
  return {
    user: session?.user,
    token,
  }
})

export const Route = createFileRoute('/dashboard')({
  ssr: false,
  component: DashboardLayout,
  beforeLoad: async () => {
    const state = clientStore.state
    if (!state.convexQueryClient) {
      throw redirect({ to: '/enter-host' })
    }

    const { token, user } = await fetchAuth()
    if (token) {
      state.convexQueryClient.serverHttpClient?.setAuth(token)
    }

    const context = {
      ...state,
      user,
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
