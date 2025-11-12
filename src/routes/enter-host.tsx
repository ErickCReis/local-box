import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useHostUrl } from '@/providers/host-url'

export const Route = createFileRoute('/enter-host')({
  component: RouteComponent,
})

const pingSchema = z.object({ message: z.literal('pong') })

function RouteComponent() {
  const { hostUrl, setHostUrl } = useHostUrl()
  const navigate = useNavigate()

  const fetchHostMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch(`${url}/api/ping`)
      if (!response.ok) {
        throw new Error(`Failed to ping host: ${response.statusText}`)
      }
      const data = await response.json()
      const safeData = pingSchema.safeParse(data)
      if (!safeData.success) {
        throw new Error('Host did not respond with pong')
      }

      return url
    },
    onSuccess: (url) => {
      setHostUrl(url)
      navigate({ to: '/dashboard/sign-in' })
    },
  })

  const form = useForm({
    defaultValues: { hostUrl: hostUrl ?? 'http://localhost:8080' },
    validators: {
      onSubmit: z.object({ hostUrl: z.url() }),
    },
    onSubmit: ({ value }) => {
      fetchHostMutation.mutate(value.hostUrl)
    },
  })

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <h1 className="mb-2 text-center text-3xl font-bold">Enter Host</h1>
      <p className="mb-6 text-center text-muted-foreground">
        Provide the Host URL shared by your team to join the workspace.
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
          <form.Field name="hostUrl">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Host URL</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="https://my-host.example.com"
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

        {fetchHostMutation.error && (
          <p className="text-red-500">
            {fetchHostMutation.error instanceof Error
              ? fetchHostMutation.error.message
              : 'Failed to connect to host'}
          </p>
        )}

        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!state.canSubmit || fetchHostMutation.isPending}
            >
              {fetchHostMutation.isPending ? 'Connecting…' : 'Continue'}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}
