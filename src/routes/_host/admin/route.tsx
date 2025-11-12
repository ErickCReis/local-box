import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useHostUrl } from '@/providers/host-url'
import { HostConnectionProvider } from '@/providers/host-connection'
import { setupStatus } from '../-server'

export const Route = createFileRoute('/_host/admin')({
  component: AdminLayout,
  loader: async () => {
    const { dockerRunning, tunnelUrl } = await setupStatus()
    if (!dockerRunning) {
      toast.error('Docker is not running')
      throw redirect({ to: '/_host/setup' })
    }

    // if (!tunnelUrl) {
    //   toast.error('Tunnel is not running')
    //   throw redirect({ to: '/_host/setup' })
    // }

    return {
      tunnelUrl,
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
