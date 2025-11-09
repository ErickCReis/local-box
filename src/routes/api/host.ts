import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getHostStore } from '@/lib/host-store'

export const Route = createFileRoute('/api/host')({
  server: {
    handlers: {
      GET: async () => {
        const hostStore = await getHostStore()
        return json({
          convexUrl: hostStore.tunnelUrlConvex ?? 'http://localhost:3210',
        })
      },
    },
  },
})
