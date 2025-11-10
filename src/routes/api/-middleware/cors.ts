import { createMiddleware } from '@tanstack/react-start'
import { getHostStore } from '@/lib/host-store'

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  getHostStore().tunnelUrl,
  'https://local-box.netlify.app',
]

export const corsMiddleware = createMiddleware().server(
  async ({ request, next }) => {
    console.log('request method', request.method)
    console.log('request url', request.url)
    const result = await next()

    const origin = request.headers.get('Origin') ?? ''
    if (allowedOrigins.includes(origin)) {
      // result.response.headers.set('Access-Control-Allow-Origin', origin)
    }

    console.log('origin', origin)

    result.response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, OPTIONS',
    )
    result.response.headers.set('Access-Control-Allow-Credentials', 'true')
    result.response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    result.response.headers.set('Access-Control-Expose-Headers', 'Content-Type')
    result.response.headers.set('Access-Control-Max-Age', '600')

    return result
  },
)
