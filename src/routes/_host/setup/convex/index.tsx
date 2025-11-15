import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'
import { queries } from './-queries'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const Route = createFileRoute('/_host/setup/convex/')({
  component: ConvexTab,
})

type StepStatus = 'pending' | 'checking' | 'success' | 'error'

function StatusStep({
  step,
  status,
  message,
  error,
  children,
}: {
  step: number
  status: StepStatus
  message: string
  error?: string
  children?: React.ReactNode
}) {
  const getIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg">
      <div className="shrink-0">{getIcon()}</div>
      <div className="flex-1">
        <div className="font-medium">
          Step {step}: {message}
        </div>
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 mt-1">
            {error}
          </div>
        )}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  )
}

function ConvexTab() {
  // Check Convex health
  const { data: healthStatus, isLoading: healthLoading } = useQuery(
    queries.convexHealth.options(),
  )

  // Check admin key
  const { data: adminKeyStatus, isLoading: adminKeyLoading } = useQuery(
    queries.convexAdminKey.options(),
  )

  const healthStepStatus: StepStatus = healthLoading
    ? 'checking'
    : healthStatus?.healthy
      ? 'success'
      : 'error'

  const adminKeyStepStatus: StepStatus = adminKeyLoading
    ? 'checking'
    : adminKeyStatus?.configured
      ? 'success'
      : 'error'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Convex Configuration</h2>
        <p className="text-muted-foreground">
          Configure your Convex self-hosted backend. Complete each step below to
          ensure everything is set up correctly.
        </p>
      </div>

      <div className="space-y-3">
        <StatusStep
          step={1}
          status={healthStepStatus}
          message="Container Health"
          error={
            healthStepStatus === 'error'
              ? healthStatus?.error ||
                `Container is not healthy (status: ${healthStatus?.status || 'unknown'})`
              : undefined
          }
        />
        <StatusStep
          step={2}
          status={adminKeyStepStatus}
          message="Admin Key Configuration"
          error={
            adminKeyStepStatus === 'error'
              ? 'CONVEX_SELF_HOSTED_ADMIN_KEY environment variable is not configured'
              : undefined
          }
        >
          {adminKeyStepStatus === 'error' && (
            <Alert className="mt-3">
              <AlertTitle>Generate Admin Key</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  To configure the admin key, run this command in your Docker
                  container:
                </p>
                <code className="block bg-muted p-2 rounded text-sm font-mono mb-2">
                  docker exec local-box_backend ./generate_admin_key.sh
                </code>
                <p className="mb-2">Then set the environment variable:</p>
                <code className="block bg-muted p-2 rounded text-sm font-mono">
                  CONVEX_SELF_HOSTED_ADMIN_KEY='&lt;your admin key&gt;'
                </code>
              </AlertDescription>
            </Alert>
          )}
        </StatusStep>
      </div>
    </div>
  )
}
