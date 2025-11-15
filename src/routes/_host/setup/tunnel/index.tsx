import { useState } from 'react'
import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Info, X } from 'lucide-react'
import { mutations } from './-mutations'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_host/setup/tunnel/')({
  component: TunnelTab,
})

function TunnelTab() {
  const context = useLoaderData({ from: '/_host/setup' })
  const [publicUrl, setPublicUrl] = useState(context.quickTunnel.tunnel)
  const [dismissBanner, setDismissBanner] = useState(false)

  // Tunnel actions
  const startTunnelsMutation = useMutation({
    ...mutations.tunnelStart.options(),
    onSuccess: (res) => {
      setPublicUrl(res.tunnel)
    },
  })

  const stopTunnelsMutation = useMutation({
    ...mutations.tunnelStop.options(),
    onSuccess: () => {
      setPublicUrl(null)
    },
  })

  const localUrl = 'http://localhost:8080'

  const isTunnelStartPending = mutations.tunnelStart.useIsPending()
  const isTunnelStopPending = mutations.tunnelStop.useIsPending()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-semibold">Public Tunnel</h2>
          <Badge variant="secondary">Optional</Badge>
        </div>
        <p className="text-muted-foreground">
          Create a public URL to access your local box from anywhere. The tunnel
          uses Cloudflare to securely expose your local services. You can also
          use the local URL if you're on the same network.
        </p>
      </div>

      {!dismissBanner && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Coming Soon: Fixed Tunnel URLs</AlertTitle>
          <AlertDescription className="flex items-start justify-between gap-4">
            <span>
              We're working on persistent tunnel URLs that won't change. For
              now, tunnel URLs are temporary and must be recreated each time
              using the free Cloudflare tunnel service.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissBanner(true)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg p-4 space-y-4">
        <div>
          <h3 className="font-medium mb-2">Local URL</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Use this URL if you're accessing from the same machine or network:
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm break-all bg-muted p-2 rounded flex-1">
              {localUrl}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(localUrl)}
            >
              Copy
            </Button>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <div>
          <h3 className="font-medium mb-2">Public Tunnel URL</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Temporary public URL (must be recreated each time):
          </p>
          {publicUrl ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm break-all bg-muted p-2 rounded flex-1">
                  {publicUrl}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(publicUrl)}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                ⚠️ This URL is temporary and will change when you restart the
                tunnel.
              </p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-4">
              Tunnel is not running. Click "Start Tunnel" to create a public
              URL.
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => startTunnelsMutation.mutate({})}
          disabled={isTunnelStartPending || !!publicUrl}
        >
          Start Tunnel
        </Button>
        <Button
          variant="secondary"
          onClick={() => stopTunnelsMutation.mutate({})}
          disabled={isTunnelStopPending || !publicUrl}
        >
          Stop Tunnel
        </Button>
      </div>
    </div>
  )
}
