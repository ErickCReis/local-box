import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'

export const Route = createFileRoute('/dashboard/_authed')({
  component: () => (
    <>
      <Authenticated>
        <Outlet />
      </Authenticated>
      <Unauthenticated>
        <Navigate to="/dashboard/sign-in" />
      </Unauthenticated>
    </>
  ),
})
