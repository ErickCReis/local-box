import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { setupStatus } from '../-server'
import { useHostUrl } from '@/providers/host-url'
import { HostConnectionProvider } from '@/providers/host-connection'
import { AdminGuard } from '@/components/admin-guard'

export const Route = createFileRoute('/_host/admin')({
  component: AdminLayout,
  loader: async () => {
    const { dockerStatus, convexHealth, quickTunnel } = await setupStatus()

    if (!dockerStatus.every((s) => s.State === 'running')) {
      throw redirect({
        to: '/setup',
        search: {
          error:
            'Docker is not running. Please start Docker to access admin features.',
        },
      })
    }

    if (!convexHealth.healthy) {
      throw redirect({
        to: '/setup/convex',
        search: {
          error:
            'Convex is not healthy. Please check the Convex container logs.',
        },
      })
    }

    return {
      quickTunnel,
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
      <AdminGuard>
        <Outlet />
      </AdminGuard>
    </HostConnectionProvider>
  )
}
