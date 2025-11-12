import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { DOCKER } from '@/lib/docker'
import { getHostStore } from '@/lib/host-store'
import { useHostUrl } from '@/providers/host-url'
import { HostConnectionProvider } from '@/providers/host-connection'

export const setupStatus = createServerFn().handler(async () => {
  const dockerStatus = await DOCKER.getDockerStatus()
  const tunnelUrl = getHostStore().tunnelUrl
  return {
    dockerStatus:
      dockerStatus.length > 0 &&
      dockerStatus.every((s) => s.State === 'running'),
    tunnelUrl,
  }
})

export const Route = createFileRoute('/_host/admin')({
  component: AdminLayout,
  loader: async () => {
    const { dockerStatus, tunnelUrl } = await setupStatus()
    if (!dockerStatus) {
      toast.error('Docker is not running')
      throw redirect({ to: '/setup' })
    }

    // if (!tunnelUrl) {
    //   toast.error('Tunnel is not running')
    //   throw redirect({ to: '/setup' })
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
