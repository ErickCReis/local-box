import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { CheckCircle2, CreditCard, Loader2 } from 'lucide-react'
import { AutumnProvider, PaywallDialog, useCustomer } from 'autumn-js/react'
import { queries } from './-queries'
import { mutations } from './-mutations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useHostUrl } from '@/providers/host-url'

export const Route = createFileRoute('/_host/setup/billing/')({
  component: BillingTab,
})

// Component that uses useCustomer - requires AutumnProvider to be available
// If AutumnProvider is not available, this will throw and should be caught by error boundary
function SubscriptionStatusSection({
  requiredProductId,
}: {
  requiredProductId: string
}) {
  // useCustomer requires AutumnProvider - must be called unconditionally (React hooks rule)
  const { customer, attach, refetch } = useCustomer()

  const hasActiveSubscription =
    customer &&
    customer.invoices?.some(
      (invoice) =>
        invoice.product_ids.includes(requiredProductId) &&
        invoice.status === 'active',
    )

  const handleUpgrade = async () => {
    try {
      await attach({
        productId: requiredProductId,
        dialog: PaywallDialog,
      })
      await refetch()
      // toast.success('Subscription activated')
    } catch (error) {
      console.error('Failed to start checkout:', error)
    }
  }

  if (hasActiveSubscription) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <div>
          <p className="font-medium text-green-900 dark:text-green-100">
            Active subscription
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            Product: {requiredProductId}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
        <p className="text-sm text-yellow-900 dark:text-yellow-100">
          No active subscription for product "{requiredProductId}". Users will
          be blocked from accessing the dashboard until a subscription is
          activated.
        </p>
      </div>
      <Button type="button" onClick={handleUpgrade} className="w-full">
        Subscribe to {requiredProductId}
      </Button>
    </div>
  )
}

function BillingTab() {
  const queryClient = useQueryClient()
  const { hostUrl } = useHostUrl()
  // Load billing config
  const { data: billingConfigData } = useQuery(queries.billingConfig.options())

  const billingConfig = billingConfigData?.config || {
    billingEnabled: false,
    requiredProductId: undefined,
  }

  // Update billing config mutation
  const updateConfigMutation = useMutation({
    ...mutations.billingUpdateConfig.options(),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Billing configuration updated')
        queries.billingConfig.invalidate(queryClient)
      } else {
        toast.error(result.error || 'Failed to update billing configuration')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update billing configuration')
    },
  })

  const form = useForm({
    defaultValues: {
      billingEnabled: billingConfig.billingEnabled,
      requiredProductId: billingConfig.requiredProductId || 'pro',
    },
    onSubmit: async ({ value }) => {
      await updateConfigMutation.mutateAsync({
        data: {
          billingEnabled: value.billingEnabled,
          requiredProductId: value.requiredProductId || undefined,
        },
      })
    },
  })

  const isUpdatePending = mutations.billingUpdateConfig.useIsPending()

  const isBillingEnabled = form.getFieldValue('billingEnabled').valueOf()
  const requiredProductId = form.getFieldValue('requiredProductId').valueOf()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Billing & Paywall</h2>
        <p className="text-muted-foreground">
          Configure optional billing requirements for dashboard access. When
          enabled, users must have an active subscription to access the
          dashboard.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-6"
      >
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="billing-enabled" className="text-base">
                Require paid plan for dashboard access
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, users must have an active subscription to access
                the dashboard.
              </p>
            </div>
            <form.Field name="billingEnabled">
              {(field) => (
                <Switch
                  id="billing-enabled"
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                />
              )}
            </form.Field>
          </div>

          {isBillingEnabled && (
            <div className="space-y-2 pt-4 border-t">
              <form.Field name="requiredProductId">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="required-product-id">
                      Required Product ID (e.g., "pro")
                    </Label>
                    <Input
                      id="required-product-id"
                      value={field.state.value || ''}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="pro"
                    />
                    <p className="text-xs text-muted-foreground">
                      The product ID from your Autumn dashboard that users must
                      subscribe to.
                    </p>
                  </div>
                )}
              </form.Field>
            </div>
          )}
        </div>

        {isBillingEnabled && !!requiredProductId && (
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Subscription Status
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Current subscription status for this host.
                </p>
              </div>
            </div>

            <AutumnProvider betterAuthUrl={hostUrl || undefined}>
              <SubscriptionStatusSection
                requiredProductId={requiredProductId}
              />
            </AutumnProvider>
          </div>
        )}

        <div className="flex justify-end">
          <form.Subscribe>
            {(state) => (
              <Button
                type="submit"
                disabled={
                  !state.canSubmit || state.isSubmitting || isUpdatePending
                }
              >
                {state.isSubmitting || isUpdatePending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  )
}
