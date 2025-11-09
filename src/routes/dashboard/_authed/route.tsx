import { api } from '@convex/_generated/api'
import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated, useQuery } from 'convex/react'

export const Route = createFileRoute('/dashboard/_authed')({
  component: () => (
    <>
      <Authenticated>
        <AuthedRoute />
      </Authenticated>
      <Unauthenticated>
        <Navigate to="/dashboard/sign-in" />
      </Unauthenticated>
    </>
  ),
})

function AuthedRoute() {
  const user = useQuery(api.auth.getCurrentUser)

  if (user === undefined) {
    return null
  }

  if (user === null) {
    return <Navigate to="/dashboard/sign-in" />
  }

  return <Outlet />
}
