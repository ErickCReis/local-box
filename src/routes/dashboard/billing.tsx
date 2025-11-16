import { createFileRoute, Link } from '@tanstack/react-router'
import { useCustomer } from 'autumn-js/react'
import { CreditCard, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const Route = createFileRoute('/dashboard/billing')({
  component: BillingPage,
})

function BillingPage() {
  const { customer, openBillingPortal, cancel, refetch } = useCustomer({
    expand: ['invoices'],
  })

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const activeSubscriptions = customer.subscriptions?.filter(
    (sub) => sub.status === 'active',
  ) || []

  const handleManageBilling = async () => {
    try {
      await openBillingPortal({
        returnUrl: '/dashboard/billing',
      })
    } catch (error) {
      console.error('Failed to open billing portal:', error)
    }
  }

  const handleCancel = async (productId: string) => {
    if (
      !confirm(
        `Are you sure you want to cancel your subscription to ${productId}?`,
      )
    ) {
      return
    }

    try {
      await cancel({ productId })
      await refetch()
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and billing information.
        </p>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your billing account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="font-medium">{customer.name || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="font-medium">{customer.email || 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Active Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Active Subscriptions
          </CardTitle>
          <CardDescription>
            Your current subscription plans and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSubscriptions.length === 0 ? (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertTitle>No Active Subscriptions</AlertTitle>
              <AlertDescription>
                You don't have any active subscriptions. Subscribe to a plan to
                access premium features.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {activeSubscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">{subscription.productId}</p>
                        <p className="text-sm text-muted-foreground">
                          Status: {subscription.status}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(subscription.productId)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features/Balances */}
      {customer.features && Object.keys(customer.features).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
            <CardDescription>Your current feature balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(customer.features).map(([featureId, feature]) => (
                <div
                  key={featureId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{featureId}</p>
                    {feature.balance !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        Balance: {feature.balance}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      {customer.invoices && customer.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>Your recent invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customer.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(invoice.createdAt * 1000).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${(invoice.amount / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={handleManageBilling} className="flex-1">
          Manage Billing Portal
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}

