import { api } from '@convex/_generated/api'
import { Navigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useConvexAuth } from 'convex/react'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const convexAuth = useConvexAuth()

  const { data: user } = useQuery({
    ...convexQuery(api.auth.getCurrentUser, {}),
    enabled: convexAuth.isAuthenticated,
  })

  if (convexAuth.isLoading || user === undefined) {
    return <div>[AdminGuard] Loading...</div>
  }

  if (user === null) {
    return <Navigate to="/dashboard/sign-in" />
  }

  // Check if user has admin or owner role
  if (user.role !== 'admin' && user.role !== 'owner') {
    return <Navigate to="/dashboard" />
  }

  return <>{children}</>
}

