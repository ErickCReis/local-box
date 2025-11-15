import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { setupStatus } from '../-server'
import { useHostUrl } from '@/providers/host-url'
import { HostConnectionProvider } from '@/providers/host-connection'

export const Route = createFileRoute('/_host/admin')({
  component: AdminLayout,
  loader: async () => {
    const {
      dockerRunning,
      tunnelUrl,
      tunnelRunning,
      convexEnabled,
      authEnabled,
      completedCount,
      totalCount,
    } = await setupStatus()

    // Require Docker and Tunnel at minimum for admin access
    // Convex and Auth are recommended but not strictly required
    if (!dockerRunning) {
      throw redirect({
        to: '/setup',
        search: {
          error:
            'Docker is not running. Please start Docker to access admin features.',
        },
      })
    }

    // if (!tunnelRunning) {
    //   throw redirect({
    //     to: '/setup',
    //     search: {
    //       error:
    //         'Tunnel is not running. Please start the tunnel to access admin features.',
    //     },
    //   })
    // }

    return {
      tunnelUrl,
      dockerRunning,
      tunnelRunning,
      convexEnabled,
      authEnabled,
      completedCount,
      totalCount,
    }
  },
})

function AdminLayout() {
  const { hostUrl, setHostUrl } = useHostUrl()

  if (!hostUrl) {
    setHostUrl('http://localhost:8080')
    return null
  }

  return (
    <HostConnectionProvider hostUrl={hostUrl}>
      <Outlet />
    </HostConnectionProvider>
  )
}
