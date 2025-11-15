import { reactStartHandler } from '@convex-dev/better-auth/react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    // middleware: [corsMiddleware],
    handlers: {
      GET: ({ request }) => reactStartHandler(request),
      POST: ({ request }) => reactStartHandler(request),
      // OPTIONS: () => new Response(null, { status: 200 }),
    },
  },
})
