import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
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

  const form = useForm({
    defaultValues: { hostUrl },
    validators: {
      onSubmit: z.object({ hostUrl: z.url() }),
    },
    onSubmit: ({ value }) => {
      setHostUrl(value.hostUrl)
      navigate({ to: '/dashboard/sign-up' })
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
                  value={field.state.value ?? ''}
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
              {state.isSubmitting ? 'Saving…' : 'Continue'}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}
