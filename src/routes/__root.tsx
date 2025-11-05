import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { getCookie, getRequest } from '@tanstack/react-start/server'
import { createServerFn } from '@tanstack/react-start'
import {
  fetchSession,
  getCookieName,
} from '@convex-dev/better-auth/react-start'
import { createAuth } from '@convex/auth'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { ThemeProvider, setTheme, toggleMode } from '@tanstack-themes/react'
import type { QueryClient } from '@tanstack/react-query'
import type { ConvexReactClient } from 'convex/react'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import appCss from '@/styles/app.css?url'
import { authClient } from '@/lib/auth-client'

const fetchAuth = createServerFn().handler(async () => {
  const { session } = await fetchSession(getRequest())
  const sessionCookieName = getCookieName(createAuth)
  const token = getCookie(sessionCookieName)
  return {
    userId: session?.user.id,
    token,
  }
})

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexClient: ConvexReactClient
  convexQueryClient: ConvexQueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  notFoundComponent: () => <div>Route not found</div>,
  component: RootComponent,
  beforeLoad: async (ctx) => {
    const { token } = await fetchAuth()
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
    }
    return { isAuthenticated: !!token }
  },
})

function RootComponent() {
  const context = Route.useRouteContext()

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ConvexBetterAuthProvider
          client={context.convexClient}
          authClient={authClient}
        >
          <ThemeProvider />
          <Outlet />
          <Scripts />
        </ConvexBetterAuthProvider>
      </body>
    </html>
  )
}
