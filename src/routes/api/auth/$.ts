import { reactStartHandler } from '@convex-dev/better-auth/react-start'
import { createFileRoute } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { getHostStore } from '@/lib/host-store'

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  getHostStore().tunnelUrl,
]

const corsMiddleware = createMiddleware().server(async ({ request, next }) => {
  const result = await next()

  const origin = request.headers.get('Origin') ?? ''
  if (allowedOrigins.includes(origin)) {
    result.response.headers.set('Access-Control-Allow-Origin', origin)
  }

  result.response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS',
  )
  result.response.headers.set('Access-Control-Allow-Credentials', 'true')
  result.response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  result.response.headers.set('Access-Control-Expose-Headers', 'Content-Type')
  result.response.headers.set('Access-Control-Max-Age', '600')

  return result
})

export const Route = createFileRoute('/api/auth/$')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: ({ request }) => reactStartHandler(request),
      POST: ({ request }) => reactStartHandler(request),
      OPTIONS: () => new Response(null, { status: 200 }),
    },
  },
})
