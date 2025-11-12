import { api } from '@convex/_generated/api'
import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router'

import { useStableQuery } from '@/hooks/use-stable-query'

export const Route = createFileRoute('/dashboard/_authed')({
  component: AuthedLayout,
})

function AuthedLayout() {
  const user = useStableQuery(api.auth.getCurrentUser)

  if (user === undefined) {
    return <div>Loading...</div>
  }

  if (user === null) {
    return <Navigate to="/dashboard/sign-in" />
  }

  return <Outlet />
}
