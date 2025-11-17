import { Link, createFileRoute } from '@tanstack/react-router'
import { useCustomer } from 'autumn-js/react'
import { CheckCircle2, CreditCard, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { MinimalLoading } from '@/components/minimal-loading'

export const Route = createFileRoute('/dashboard/_authed/billing')({
  component: BillingPage,
})

function BillingPage() {
  const { customer, openBillingPortal, cancel, refetch } = useCustomer({
    expand: ['invoices'],
  })

  if (!customer) {
    return <MinimalLoading />
  }

  const activeSubscriptions = customer.products.filter(
    (product) => product.status === 'active',
  )

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
              {activeSubscriptions.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">{product.id}</p>
                        <p className="text-sm text-muted-foreground">
                          Status: {product.status}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(product.id)}
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
                  key={invoice.stripe_id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(invoice.created_at * 1000).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${(invoice.total / 100).toFixed(2)}
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
