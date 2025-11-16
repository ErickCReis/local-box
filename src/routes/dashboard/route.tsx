import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import * as z from 'zod'
import { useHostUrl } from '@/providers/host-url'
import { HostConnectionProvider } from '@/providers/host-connection'

export const Route = createFileRoute('/dashboard')({
  validateSearch: zodValidator(
    z.object({
      invite: z.string().optional(),
    }),
  ),
  component: DashboardLayout,
})

function DashboardLayout() {
  const { hostUrl } = useHostUrl()

  if (!hostUrl) {
    return <Navigate to="/enter-host" />
  }

  return (
    <HostConnectionProvider hostUrl={hostUrl}>
      <Outlet />
    </HostConnectionProvider>
  )
}
