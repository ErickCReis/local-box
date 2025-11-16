import { api } from '@convex/_generated/api'
import { Navigate } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'
import { useStableQuery } from '@/hooks/use-stable-query'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const convexAuth = useConvexAuth()

  const user = useStableQuery(
    api.auth.getCurrentUser,
    convexAuth.isAuthenticated ? undefined : 'skip',
  )

  if (convexAuth.isLoading || user === undefined) {
    return <div>[AuthGuard] Loading...</div>
  }

  if (user === null) {
    return <Navigate to="/dashboard/sign-in" />
  }

  return <>{children}</>
}
