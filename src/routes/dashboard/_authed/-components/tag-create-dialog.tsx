import { useForm } from '@tanstack/react-form'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ColorPicker } from '@/components/color-picker'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, color?: string) => Promise<void> | void
}

export function TagCreateDialog({ open, onOpenChange, onCreate }: Props) {
  const form = useForm({
    defaultValues: {
      name: '',
      color: '',
    },
    onSubmit: async ({ value }) => {
      await onCreate(value.name.trim(), value.color.trim() || undefined)
      form.reset()
      onOpenChange(false)
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, 'Name is required'),
        color: z.string(),
      }),
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tag</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <div className="grid gap-3 py-2">
            <form.Field name="name">
              {(field) => (
                <div className="grid gap-1">
                  <Label htmlFor={field.name} className="text-sm">
                    Name
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., invoices"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
            <form.Field name="color">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name} className="text-sm">
                    Color (optional)
                  </Label>
                  <ColorPicker
                    value={field.state.value}
                    onChange={(color) => field.handleChange(color)}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>
          <DialogFooter>
            <form.Subscribe>
              {(state) => (
                <Button type="submit" disabled={!state.canSubmit || state.isSubmitting}>
                  {state.isSubmitting ? 'Creating...' : 'Create'}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
