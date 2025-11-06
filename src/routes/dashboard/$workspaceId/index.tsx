import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/dashboard/$workspaceId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { authClient } = Route.useRouteContext()
  const navigate = useNavigate()
  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <p className="mt-4 text-muted-foreground">
        This section has access to Convex and React Query
      </p>
      <Button
        onClick={() => {
          authClient.signOut().then(() => {
            navigate({ to: '/dashboard/sign-in' })
          })
        }}
      >
        Sign out
      </Button>
    </main>
  )
}
