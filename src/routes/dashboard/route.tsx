import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router'
import { useHostUrl } from '@/providers/host-url'
import { HostConnectionProvider } from '@/providers/host-connection'
import { BillingGuard } from '@/components/billing-guard'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const { hostUrl } = useHostUrl()

  if (!hostUrl) {
    return <Navigate to="/enter-host" />
  }

  return (
    <HostConnectionProvider hostUrl={hostUrl}>
      <BillingGuard>
        <Outlet />
      </BillingGuard>
    </HostConnectionProvider>
  )
}
