import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/ping')({
  server: {
    // middleware: [corsMiddleware],
    handlers: {
      GET: () => json({ message: 'pong' }),
    },
  },
})
