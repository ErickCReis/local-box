import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { QueryClient, notifyManager } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { useEffect } from 'react'
import { routeTree } from './routeTree.gen'

function ErrorComponent({ error }: { error: Error }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])
  return <p>{error.message}</p>
}

export function getRouter() {
  if (typeof document !== 'undefined') {
    notifyManager.setScheduler(window.requestAnimationFrame)
  }

  const queryClient = new QueryClient()

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
    defaultNotFoundComponent: () => <p>not found</p>,
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  // Initialize Sentry on client-side only
  if (typeof window !== 'undefined') {
    const dsn = import.meta.env.VITE_SENTRY_DSN
    if (dsn) {
      Sentry.init({
        dsn,
        // Adds request headers and IP for users
        sendDefaultPii: true,
        integrations: [
          // Performance monitoring
          Sentry.tanstackRouterBrowserTracingIntegration(router),
        ],
        // Enable logs to be sent to Sentry (optional)
        enableLogs: true,
        environment: import.meta.env.MODE || 'development',
      })
    }
  }

  return router
}
