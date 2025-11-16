import { Link, createFileRoute } from '@tanstack/react-router'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { CheckCircle2, LogIn } from 'lucide-react'
import { createOwnerSchema } from './-server'
import { queries } from './-queries'
import { mutations } from './-mutations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/_host/setup/auth/')({
  component: AuthTab,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(queries.authHealth.options())
  },
})

function AuthTab() {
  const queryClient = useQueryClient()

  // Health check queries with polling
  const { data: authHealthData } = useSuspenseQuery(
    queries.authHealth.useOptions(),
  )

  // User creation
  const createUserMutation = useMutation({
    ...mutations.authCreateOwner.options(),
    onSuccess: () => {
      toast.success('Owner user created successfully')
      queries.authHealth.invalidate(queryClient)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user')
    },
  })

  const userForm = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await createUserMutation.mutateAsync({ data: value })
    },
    validators: {
      onSubmit: createOwnerSchema,
    },
  })

  const isAuthCreateOwnerPending = mutations.authCreateOwner.useIsPending()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Create Owner User</h2>
        <p className="text-muted-foreground">
          Create the first owner user for your local box. This user will have
          full administrative access to manage members and settings.
        </p>
      </div>

      {authHealthData.hasOwner ? (
        authHealthData.isLoggedIn ? (
          <div className="border rounded-lg p-6 bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <h3 className="font-medium text-green-900 dark:text-green-100">
                  Owner user exists
                </h3>
                {authHealthData.user && (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {authHealthData.user.name} ({authHealthData.user.email})
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-6 bg-yellow-50 dark:bg-yellow-950/20">
            <div className="flex items-center gap-3">
              <LogIn className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
                  Owner user exists, but you are not logged in
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                  Please log in to access admin features.
                </p>
                <div className="mt-4">
                  <Button asChild>
                    <Link to="/dashboard/sign-in">Go to Login</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="border rounded-lg p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              userForm.handleSubmit()
            }}
            className="space-y-4"
          >
            <div>
              <userForm.Field name="name">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors.map((error) => (
                      <p key={error?.message} className="text-sm text-red-500">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </userForm.Field>
            </div>

            <div>
              <userForm.Field name="email">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Email</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors.map((error) => (
                      <p key={error?.message} className="text-sm text-red-500">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </userForm.Field>
            </div>

            <div>
              <userForm.Field name="password">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Password</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors.map((error) => (
                      <p key={error?.message} className="text-sm text-red-500">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </userForm.Field>
            </div>

            <userForm.Subscribe>
              {(state) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    !state.canSubmit ||
                    state.isSubmitting ||
                    isAuthCreateOwnerPending
                  }
                >
                  {state.isSubmitting || isAuthCreateOwnerPending
                    ? 'Creating...'
                    : 'Create Owner User'}
                </Button>
              )}
            </userForm.Subscribe>
          </form>
        </div>
      )}

      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-3">Health Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Auth System:</span>
            <span
              className={
                authHealthData.healthy
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }
            >
              {authHealthData.healthy ? 'Healthy' : 'Unhealthy'}
            </span>
          </div>
          {authHealthData.error && (
            <p className="text-xs text-muted-foreground">
              Error: {authHealthData.error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
