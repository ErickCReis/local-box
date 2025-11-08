import { reactStartHandler } from "@convex-dev/better-auth/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";


const corsMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await next()

  result.response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3001')
  result.response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  result.response.headers.set('Access-Control-Allow-Credentials', 'true')
  result.response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  result.response.headers.set('Access-Control-Expose-Headers', 'Content-Type')
  result.response.headers.set('Access-Control-Max-Age', '600')

  return result
})

export const Route = createFileRoute("/api/auth/$")({
  server: {
    middleware:[corsMiddleware],
    handlers: {
      GET: ({ request }) => reactStartHandler(request),
      POST: ({ request }) => reactStartHandler(request),
      OPTIONS: () => new Response(null, { status: 200 }),
    },
  },
});
