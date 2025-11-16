import { useNavigate } from '@tanstack/react-router'
import { PaywallDialog, useCustomer } from 'autumn-js/react'
import { api } from '@convex/_generated/api'
import { CreditCard, Lock } from 'lucide-react'
import { useStableQuery } from '@/hooks/use-stable-query'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface BillingGuardProps {
  children: React.ReactNode
}

export function BillingGuard({ children }: BillingGuardProps) {
  const billingConfig = useStableQuery(api.billing.getBillingConfig)
  const { customer, attach, check } = useCustomer()
  const navigate = useNavigate()

  // If billing config is loading or not enabled, allow access
  if (billingConfig === undefined) {
    return <div>Loading...</div>
  }

  if (!billingConfig.billingEnabled) {
    return <>{children}</>
  }

  // If no required product ID, allow access
  if (!billingConfig.requiredProductId) {
    return <>{children}</>
  }

  // Check subscription status - user must have an active subscription to the required product
  const hasActiveSubscription =
    customer &&
    customer.invoices &&
    customer.invoices.some(
      (invoice) =>
        billingConfig.requiredProductId &&
        invoice.product_ids.includes(billingConfig.requiredProductId) &&
        invoice.status === 'active',
    )

  // Also check if allowed via feature check (if the product is set up as a feature)
  const hasAccessViaFeature = check({
    featureId: billingConfig.requiredProductId,
  }).data.allowed

  if (hasActiveSubscription || hasAccessViaFeature) {
    return <>{children}</>
  }

  // User doesn't have access - show paywall
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Subscription Required</AlertTitle>
          <AlertDescription>
            This host requires an active subscription to access the dashboard.
            Please subscribe to continue.
          </AlertDescription>
        </Alert>

        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5" />
            <div>
              <h3 className="font-medium">Upgrade Required</h3>
              <p className="text-sm text-muted-foreground">
                Subscribe to <strong>{billingConfig.requiredProductId}</strong>{' '}
                to access this dashboard.
              </p>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={async () => {
              try {
                await attach({
                  productId: billingConfig.requiredProductId!,
                  dialog: PaywallDialog,
                })
                // After successful subscription, the component will re-render
                // and the user will have access
              } catch (error) {
                console.error('Failed to start checkout:', error)
              }
            }}
          >
            Subscribe to {billingConfig.requiredProductId}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate({ to: '/setup/billing' })}
          >
            Manage Billing Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
