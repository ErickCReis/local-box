import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router'
import { useHostUrl } from '@/providers/host-url'
import { HostConnectionProvider } from '@/providers/host-connection'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const { hostUrl } = useHostUrl()

  console.log('hostUrl', hostUrl)

  if (!hostUrl) {
    return <Navigate to="/enter-host" />
  }

  return (
    <HostConnectionProvider hostUrl={hostUrl}>
      <Outlet />
    </HostConnectionProvider>
  )
}
