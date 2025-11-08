import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { api } from '@convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/dashboard/$workspaceId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { authClient, user } = Route.useRouteContext()
  const navigate = useNavigate()
  const workspaces = useQuery(api.workspaces.list)
  const testMutation = useMutation(api.workspaces.testMutation)
  console.log({ workspaces })
  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <p className="mt-4 text-muted-foreground">
        This section has access to Convex and React Query
      </p>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <pre>{JSON.stringify(workspaces, null, 2)}</pre>
      <Button onClick={() => testMutation()}>Test Mutation</Button>
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
