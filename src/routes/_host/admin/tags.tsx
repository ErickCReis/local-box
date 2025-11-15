import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery } from 'convex/react'
import * as z from 'zod'
import { useEffect } from 'react'
import type { Doc, Id } from '@convex/_generated/dataModel'
import { api } from '@/../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ColorPicker } from '@/components/color-picker'
import { isSystemTagName } from '@/lib/tag-colors'

export const Route = createFileRoute('/_host/admin/tags')({
  component: TagsPage,
})

function TagsPage() {
  const tags = useQuery(api.tags.list, {}) ?? []

  const createTag = useMutation(api.tags.create)
  const renameTag = useMutation(api.tags.rename)
  const removeTag = useMutation(api.tags.remove)

  const createForm = useForm({
    defaultValues: {
      name: '',
      color: '',
    },
    onSubmit: async ({ value }) => {
      await createTag({
        name: value.name.trim(),
        color: value.color.trim(),
      })
      createForm.reset()
    },
    validators: {
      onSubmit: z.object({
        name: z
          .string()
          .min(1, 'Name is required')
          .refine(
            (name) => !isSystemTagName(name.trim()),
            'System tags cannot be created manually',
          ),
        color: z.string(),
      }),
    },
  })

  return (
    <main className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Tags</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Create</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            createForm.handleSubmit()
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-2">
              <createForm.Field name="name">
                {(field) => (
                  <>
                    <Label htmlFor={field.name}>Name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Work"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors[0]?.message}
                      </p>
                    )}
                  </>
                )}
              </createForm.Field>
            </div>
            <div className="space-y-2">
              <createForm.Field name="color">
                {(field) => (
                  <>
                    <Label htmlFor={field.name}>Color (optional)</Label>
                    <ColorPicker
                      value={field.state.value}
                      onChange={(color) => field.handleChange(color)}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors[0]?.message}
                      </p>
                    )}
                  </>
                )}
              </createForm.Field>
            </div>
            <div>
              <createForm.Subscribe>
                {(state) => (
                  <Button
                    type="submit"
                    disabled={!state.canSubmit || state.isSubmitting}
                  >
                    {state.isSubmitting ? 'Adding...' : 'Add Tag'}
                  </Button>
                )}
              </createForm.Subscribe>
            </div>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Current Tags</h2>
        <div className="grid gap-2">
          {tags.length === 0 ? (
            <div className="text-sm text-muted-foreground">No tags yet</div>
          ) : (
            tags.map((t) => (
              <TagEditForm
                key={t._id}
                tag={t}
                onRename={async (args) => {
                  await renameTag(args)
                }}
                onDelete={async (args) => {
                  await removeTag(args)
                }}
              />
            ))
          )}
        </div>
      </section>
    </main>
  )
}

function TagEditForm({
  tag,
  onRename,
  onDelete,
}: {
  tag: Doc<'tags'>
  onRename: (args: {
    tagId: Id<'tags'>
    name: string
    color?: string
  }) => Promise<void>
  onDelete: (args: { tagId: Id<'tags'> }) => Promise<void>
}) {
  const editForm = useForm({
    defaultValues: {
      name: tag.name,
      color: tag.color || '',
    },
    onSubmit: async ({ value }) => {
      const nameTrimmed = value.name.trim()
      const colorTrimmed = value.color.trim() || undefined

      // Only save if values changed
      if (nameTrimmed !== tag.name || colorTrimmed !== (tag.color || '')) {
        await onRename({
          tagId: tag._id,
          name: nameTrimmed,
          color: colorTrimmed,
        })
        // Reset form to reflect the new tag values
        editForm.reset({
          name: nameTrimmed,
          color: colorTrimmed || '',
        })
      }
    },
    validators: {
      onSubmit: z.object({
        name: z
          .string()
          .min(1, 'Name is required')
          .refine((name) => {
            const trimmed = name.trim()
            // Allow renaming if it's already a system tag, but prevent non-system tags from being renamed to system tag names
            return tag.isSystem || !isSystemTagName(trimmed)
          }, 'Cannot rename tag to a system tag name'),
        color: z.string(),
      }),
    },
  })

  // Reset form when tag changes (e.g., after external update)
  useEffect(() => {
    const currentValues = editForm.state.values
    if (
      currentValues.name !== tag.name ||
      currentValues.color !== (tag.color || '')
    ) {
      editForm.reset({
        name: tag.name,
        color: tag.color || '',
      })
    }
  }, [tag.name, tag.color, tag._id, editForm])

  const handleDelete = async () => {
    await onDelete({ tagId: tag._id })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        editForm.handleSubmit()
      }}
    >
      <div className="flex flex-col md:flex-row md:items-end gap-3 border rounded p-3">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <editForm.Field name="name">
              {(field) => (
                <>
                  <Label htmlFor={field.name}>Name</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </>
              )}
            </editForm.Field>
          </div>
          <div className="space-y-2">
            <editForm.Field name="color">
              {(field) => (
                <>
                  <Label htmlFor={field.name}>Color</Label>
                  <ColorPicker
                    value={field.state.value}
                    onChange={(color) => field.handleChange(color)}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </>
              )}
            </editForm.Field>
          </div>
        </div>
        <div className="flex gap-2">
          <editForm.Subscribe>
            {(state) => (
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={!state.isDirty || state.isSubmitting}
              >
                {state.isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            )}
          </editForm.Subscribe>
          <Button
            size="sm"
            variant="destructive"
            type="button"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </form>
  )
}
