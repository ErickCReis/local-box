import { Outlet, createFileRoute } from '@tanstack/react-router'

import { AuthGuard } from '@/components/auth-guard'
import { BillingGuard } from '@/components/billing-guard'

export const Route = createFileRoute('/dashboard/_authed')({
  component: () => (
    <AuthGuard>
      <BillingGuard>
        <Outlet />
      </BillingGuard>
    </AuthGuard>
  ),
})
