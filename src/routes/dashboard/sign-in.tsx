import { useForm } from '@tanstack/react-form'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import * as z from 'zod'
import { api } from '@convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useHostUrl } from '@/providers/host-url'
import { useHostConnected } from '@/providers/host-connection'
import { SimpleHeader } from '@/components/simple-header'

export const Route = createFileRoute('/dashboard/sign-in')({
  validateSearch: zodValidator(
    z.object({
      invite: z.string().optional(),
    }),
  ),
  component: RouteComponent,
})

function RouteComponent() {
  const { hostUrl } = useHostUrl()
  const { authClient } = useHostConnected()
  const navigate = useNavigate()
  const { invite } = Route.useSearch()
  const acceptInvite = useMutation(api.members.acceptInvite)

  const form = useForm({
    defaultValues: {
      email: 'owner@test.com',
      password: '12345678',
    },
    onSubmit: async ({ value }) => {
      console.log('signing in with email', value.email)
      await authClient.signIn.email({
        email: value.email,
        password: value.password,
        fetchOptions: {
          onSuccess: async () => {
            // Accept invite if present
            if (invite) {
              try {
                await acceptInvite({ code: invite })
                toast.success('Invite accepted successfully')
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : 'Failed to accept invite',
                )
              }
            }
            toast.success('Sign in successful')
            navigate({ to: '/dashboard', search: {} })
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText)
          },
        },
      })
    },
    validators: {
      onSubmit: z.object({
        email: z.email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
      }),
    },
  })

  return (
    <div className="min-h-screen flex flex-col">
      <SimpleHeader />
      <div className="flex-1 flex items-center justify-center">
        <div className="mx-auto w-full max-w-md p-6">
          <h1 className="mb-2 text-center text-3xl font-bold">Welcome Back</h1>

          <p className="mb-6 text-center text-sm text-muted-foreground">
            Host: <span className="font-medium">{hostUrl}</span>
            <Button variant="link" className="px-1" asChild>
              <Link to="/enter-host">Change</Link>
            </Button>
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-4"
          >
            <div>
              <form.Field name="email">
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
                      <p key={error?.message} className="text-red-500">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>
            </div>

            <div>
              <form.Field name="password">
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
                      <p key={error?.message} className="text-red-500">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>
            </div>

            <form.Subscribe>
              {(state) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!state.canSubmit || state.isSubmitting}
                >
                  {state.isSubmitting ? 'Submitting...' : 'Sign In'}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="text-indigo-600 hover:text-indigo-800"
            >
              <Link to="/dashboard/sign-up">Need an account? Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
