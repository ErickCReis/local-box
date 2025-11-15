import { Link, createFileRoute, useLoaderData } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Circle } from 'lucide-react'
import { queries as authQueries } from '../auth/-queries'
import { queries as convexQueries } from '../convex/-queries'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_host/setup/_overview/')({
  component: OverviewTab,
})

function OverviewTab() {
  const context = useLoaderData({ from: '/_host/setup' })

  // Health check queries with polling for real-time updates
  const { data: convexHealthData } = useQuery({
    ...convexQueries.convexHealth.options(context.convexHealth),
  })

  const { data: authHealthData } = useQuery({
    ...authQueries.authHealth.options(),
    initialData: context.authHealth,
  })

  // Use unified status as base, but allow real-time updates from polling
  const dockerRunning = context.unifiedStatus.dockerRunning
  const tunnelRunning = context.unifiedStatus.tunnelRunning
  const convexEnabled = convexHealthData?.healthy ?? false
  const authEnabled = authHealthData.hasOwner

  const checklistItems = [
    { id: 'docker', label: 'Docker', enabled: dockerRunning },
    { id: 'tunnel', label: 'Tunnel', enabled: tunnelRunning },
    { id: 'convex', label: 'Convex Backend', enabled: convexEnabled },
    { id: 'auth', label: 'Auth', enabled: authEnabled },
  ]

  const completedCount = checklistItems.filter((item) => item.enabled).length
  const totalCount = checklistItems.length

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Configuration Status</h3>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalCount} steps complete
          </span>
        </div>

        <div className="space-y-3">
          {checklistItems.map((item) => {
            const getRoute = () => {
              if (item.id === 'docker') return '/setup/docker'
              if (item.id === 'tunnel') return '/setup/tunnel'
              if (item.id === 'convex') return '/setup/convex'
              if (item.id === 'auth') return '/setup/auth'
              return null
            }

            const route = getRoute()

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {item.enabled ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.enabled ? (
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Enabled
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Not configured
                    </span>
                  )}
                  {route && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={route}>Configure</Link>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
