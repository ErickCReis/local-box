import { useEffect, useState } from 'react'
import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'
import { watchDockerStatus } from './-server'
import { queries } from './-queries'
import { mutations } from './-mutations'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_host/setup/docker/')({
  component: DockerTab,
})

type StepStatus = 'pending' | 'checking' | 'success' | 'error'

function StatusStep({
  step,
  status,
  message,
  error,
}: {
  step: number
  status: StepStatus
  message: string
  error?: string
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
      </div>
    </div>
  )
}

function DockerTab() {
  const context = useLoaderData({ from: '/_host/setup' })
  const [dockerStatusResult, setDockerStatusResult] = useState(
    context.dockerStatus,
  )

  // Check Docker daemon
  const { data: daemonStatus, isLoading: daemonLoading } = useQuery(
    queries.dockerDaemon.options(),
  )

  // Check Docker images
  const { data: imagesStatus, isLoading: imagesLoading } = useQuery(
    queries.dockerImages.options(daemonStatus?.available === true),
  )

  // Docker actions
  const dockerUpMutation = useMutation(mutations.dockerUp.options())

  const dockerDownMutation = useMutation(mutations.dockerDown.options())

  useEffect(() => {
    const controller = new AbortController()
    async function stream() {
      for await (const msg of await watchDockerStatus({
        signal: controller.signal,
      })) {
        setDockerStatusResult(msg)
      }
      if (!controller.signal.aborted) {
        await new Promise((r) => setTimeout(r, 2000))
        void stream()
      }
    }
    stream()
    return () => controller.abort()
  }, [])

  const daemonStepStatus: StepStatus = daemonLoading
    ? 'checking'
    : daemonStatus?.available
      ? 'success'
      : 'error'

  const imagesStepStatus: StepStatus = imagesLoading
    ? 'checking'
    : imagesStatus?.allPresent
      ? 'success'
      : daemonStatus?.available
        ? 'error'
        : 'pending'

  const containersStepStatus: StepStatus =
    dockerStatusResult.length > 0 &&
    dockerStatusResult.every((s) => s.State === 'running')
      ? 'success'
      : dockerStatusResult.length > 0
        ? 'error'
        : 'pending'

  const isDockerUpPending = mutations.dockerUp.useIsPending()
  const isDockerDownPending = mutations.dockerDown.useIsPending()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Docker Configuration</h2>
        <p className="text-muted-foreground">
          Configure Docker to run the local box services. Complete each step
          below to ensure everything is set up correctly.
        </p>
      </div>

      <div className="space-y-3">
        <StatusStep
          step={1}
          status={daemonStepStatus}
          message="Docker Daemon"
          error={
            daemonStepStatus === 'error'
              ? daemonStatus?.error || 'Docker daemon is not accessible'
              : undefined
          }
        />
        <StatusStep
          step={2}
          status={imagesStepStatus}
          message="Docker Images"
          error={
            imagesStepStatus === 'error'
              ? imagesStatus?.missingImages.length
                ? `Missing images: ${imagesStatus.missingImages.join(', ')}`
                : imagesStatus?.error || 'Failed to check images'
              : undefined
          }
        />
        <StatusStep
          step={3}
          status={containersStepStatus}
          message="Containers Running"
          error={
            containersStepStatus === 'error'
              ? 'Some containers are not running'
              : undefined
          }
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => dockerUpMutation.mutate({})}
          disabled={isDockerUpPending || !daemonStatus?.available}
        >
          Start Docker
        </Button>
        <Button
          variant="secondary"
          onClick={() => dockerDownMutation.mutate({})}
          disabled={isDockerDownPending}
        >
          Stop Docker
        </Button>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-3">Container Status</h3>
        {dockerStatusResult.length > 0 ? (
          <div className="grid gap-2">
            {dockerStatusResult.map((item) => (
              <div key={item.ID} className="rounded border p-3">
                <div className="font-medium">{item.Name}</div>
                <div className="text-sm text-muted-foreground">
                  {item.Image}
                </div>
                <div className="text-sm">{item.Ports}</div>
                <div className="text-sm">{item.Status}</div>
                <div className="text-sm">{item.State}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-4">
            No containers running. Click "Start Docker" to begin.
          </div>
        )}
      </div>
    </div>
  )
}
