import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  CreditCard,
  Loader2,
  XCircle,
} from 'lucide-react'
import {
  AutumnProvider,
  PaywallDialog,
  PricingTable,
  useCustomer,
} from 'autumn-js/react'
import { queries } from './-queries'
import { mutations } from './-mutations'
import { getBillingConfig } from './-server'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useHostUrl } from '@/providers/host-url'

const FIXED_PRODUCT_ID = 'local-box'

export const Route = createFileRoute('/_host/setup/billing/')({
  component: BillingTab,
  loader: async () => await getBillingConfig(),
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

// Component that uses useCustomer - requires AutumnProvider to be available
// If AutumnProvider is not available, this will throw and should be caught by error boundary
function SubscriptionStatusSection() {
  // useCustomer requires AutumnProvider - must be called unconditionally (React hooks rule)
  const { customer, attach, refetch } = useCustomer()

  const hasActiveSubscription = customer?.products.some(
    (product) => product.id === FIXED_PRODUCT_ID && product.status === 'active',
  )

  const handleUpgrade = async () => {
    try {
      await attach({
        productId: FIXED_PRODUCT_ID,
        dialog: PaywallDialog,
        successUrl: 'http://localhost:3000/setup/billing',
      })
      await refetch()
      toast.success('Subscription activated')
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
            Product: {FIXED_PRODUCT_ID}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
        <p className="text-sm text-yellow-900 dark:text-yellow-100">
          No active subscription for product "{FIXED_PRODUCT_ID}". Users will be
          blocked from accessing the dashboard until a subscription is
          activated.
        </p>
      </div>
      <Button type="button" onClick={handleUpgrade} className="w-full">
        Subscribe to {FIXED_PRODUCT_ID}
      </Button>
    </div>
  )
}

function BillingTab() {
  const queryClient = useQueryClient()
  const context = Route.useLoaderData()
  const { hostUrl } = useHostUrl()
  // Load billing config
  const { data: billingConfigData } = useQuery({
    ...queries.billingConfig.options(),
    initialData: context,
  })

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
      billingEnabled: billingConfigData.config.billingEnabled,
    },
    onSubmit: async ({ value }) => {
      await updateConfigMutation.mutateAsync({
        data: {
          billingEnabled: value.billingEnabled,
        },
      })
    },
  })

  const isUpdatePending = mutations.billingUpdateConfig.useIsPending()

  const isBillingEnabled = form.getFieldValue('billingEnabled').valueOf()

  // Validation status
  const validation = billingConfigData.validation
  const hasInvalidProductId =
    billingConfigData.validation.hasInvalidProductId ?? false

  const autumnSecretKeyStatus: StepStatus = validation.hasAutumnSecretKey
    ? 'success'
    : 'error'

  const productExistsStatus: StepStatus =
    validation.hasAutumnSecretKey && validation.hasInvalidProductId
      ? 'error'
      : 'success'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Billing & Paywall</h2>
        <p className="text-muted-foreground">
          Configure optional billing requirements for dashboard access. When
          enabled, users must have an active subscription to the "
          {FIXED_PRODUCT_ID}" product to access the dashboard.
        </p>
      </div>

      {/* Product ID Mismatch Warning */}
      {hasInvalidProductId && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Product ID Mismatch</AlertTitle>
          <AlertDescription>
            The stored product ID (
            {billingConfigData.config.fixedProductId ?? 'none'}) differs from
            the required product ID ({FIXED_PRODUCT_ID}). The system will
            automatically use "{FIXED_PRODUCT_ID}" when billing is enabled.
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Steps */}
      {isBillingEnabled && (
        <div className="border rounded-lg p-6 space-y-4">
          <h3 className="font-medium mb-4">Setup Validation</h3>
          <div className="space-y-3">
            <StatusStep
              step={1}
              status={autumnSecretKeyStatus}
              message="AUTUMN_SECRET_KEY Configuration"
              error={
                autumnSecretKeyStatus === 'error'
                  ? 'AUTUMN_SECRET_KEY environment variable is not configured'
                  : undefined
              }
            >
              {autumnSecretKeyStatus === 'error' && (
                <Alert className="mt-3">
                  <AlertTitle>Configure AUTUMN_SECRET_KEY</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">
                      Set the AUTUMN_SECRET_KEY environment variable in your
                      Convex deployment to enable billing functionality.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </StatusStep>
            <StatusStep
              step={2}
              status={productExistsStatus}
              message={`Product "${FIXED_PRODUCT_ID}" Exists in Autumn`}
              error={
                productExistsStatus === 'error'
                  ? validation.hasInvalidProductId
                    ? `Product "${FIXED_PRODUCT_ID}" not found in Autumn. Please create it first.`
                    : undefined
                  : undefined
              }
            >
              {productExistsStatus === 'error' &&
                validation.hasInvalidProductId && (
                  <Alert className="mt-3">
                    <AlertTitle>Create Product in Autumn</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">
                        The product "{FIXED_PRODUCT_ID}" must exist in your
                        Autumn dashboard. Please create it before enabling
                        billing.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
            </StatusStep>
          </div>
        </div>
      )}

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
                When enabled, users must have an active subscription to the "
                {FIXED_PRODUCT_ID}" product to access the dashboard.
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
        </div>

        {isBillingEnabled &&
          validation?.hasAutumnSecretKey &&
          !validation?.hasInvalidProductId && (
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

              <AutumnProvider
                betterAuthUrl={hostUrl || undefined}
                includeCredentials
              >
                <SubscriptionStatusSection />
                <PricingTable />
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
