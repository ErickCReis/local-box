import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useClientStore } from '@/lib/client-store'

export const Route = createFileRoute('/enter-host')({
  component: RouteComponent,
})

function RouteComponent() {
  const { hostUrl, setHostUrl } = useClientStore()
  const navigate = useNavigate()

  const fetchHostMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch(`${url}/api/host`)
      if (!response.ok) {
        throw new Error(`Failed to fetch host info: ${response.statusText}`)
      }
      const data = await response.json()
      if (!data.convexUrl) {
        throw new Error('Host did not return a convex URL')
      }
      return { hostUrl: url, convexUrl: data.convexUrl }
    },
    onSuccess: ({ hostUrl: url, convexUrl }) => {
      setHostUrl(url, convexUrl)
      navigate({ to: '/dashboard' })
    },
  })

  const form = useForm({
    defaultValues: { hostUrl: hostUrl ?? 'http://localhost:3000' },
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
