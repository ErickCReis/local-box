import { useNavigate } from '@tanstack/react-router'
import { useCustomer } from 'autumn-js/react'
import { api } from '@convex/_generated/api'
import { CreditCard, Lock, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useStableQuery } from '@/hooks/use-stable-query'
import { MinimalLoading } from '@/components/minimal-loading'
import { useHostConnected } from '@/providers/host-connection'

interface BillingGuardProps {
  children: React.ReactNode
}

export function BillingGuard({ children }: BillingGuardProps) {
  const billingConfig = useStableQuery(api.billing.getBillingConfig)

  // If billing config is loading or not enabled, allow access
  if (billingConfig === undefined) {
    return <MinimalLoading />
  }

  if (!billingConfig.billingEnabled) {
    return <>{children}</>
  }

  return (
    <BillingGuardEnabled fixedProductId={billingConfig.fixedProductId}>
      {children}
    </BillingGuardEnabled>
  )
}

function BillingGuardEnabled({
  children,
  fixedProductId,
}: React.PropsWithChildren<{ fixedProductId: string }>) {
  const { customer, attach, isLoading } = useCustomer()
  const { authClient } = useHostConnected()
  const navigate = useNavigate()

  if (isLoading) {
    return <MinimalLoading />
  }

  // Check subscription status - user must have an active subscription to the required product
  const hasActiveSubscription =
    customer &&
    customer.products.some(
      (product) => product.id === fixedProductId && product.status === 'active',
    )

  if (hasActiveSubscription) {
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
                Subscribe to <strong>{fixedProductId}</strong> to access this
                dashboard.
              </p>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={async () => {
              try {
                await attach({
                  productId: fixedProductId,
                  successUrl: `${window.location.origin}/dashboard`,
                })
                // After successful subscription, the component will re-render
                // and the user will have access
              } catch (error) {
                console.error('Failed to start checkout:', error)
              }
            }}
          >
            Subscribe to {fixedProductId}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate({ to: '/setup/billing' })}
          >
            Manage Billing Settings
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              try {
                await authClient.signOut()
                navigate({ to: '/dashboard/sign-in' })
              } catch (error) {
                console.error('Failed to sign out:', error)
              }
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
