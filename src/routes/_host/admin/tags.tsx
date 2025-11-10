import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useMemo, useState } from 'react'
import type { Doc } from '@convex/_generated/dataModel'
import { api } from '@/../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/_host/admin/tags')({
  component: TagsPage,
})

function TagsPage() {
  const tags = useQuery(api.tags.list, {}) ?? []

  const createTag = useMutation(api.tags.create)
  const renameTag = useMutation(api.tags.rename)
  const removeTag = useMutation(api.tags.remove)

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('')

  const [edited, setEdited] = useState<
    Record<string, { name: string; color?: string }>
  >({})

  const canCreate = useMemo(() => newName.trim().length > 0, [newName])

  const handleCreate = async () => {
    if (!canCreate) return
    await createTag({
      name: newName.trim(),
      color: newColor.trim() || undefined,
    })
    setNewName('')
    setNewColor('')
  }

  const getEdited = (t: Doc<'tags'>) => edited[t._id]

  const setEditedField = (id: string, key: 'name' | 'color', value: string) => {
    setEdited((prev) => {
      const current = prev[id] ?? {}
      return { ...prev, [id]: { ...current, [key]: value } }
    })
  }

  const handleSave = async (t: Doc<'tags'>) => {
    const { name, color } = getEdited(t)
    if (name.trim() === t.name && (color?.trim() || '') === (t.color || ''))
      return
    await renameTag({
      tagId: t._id,
      name: name.trim(),
      color: color?.trim() || undefined,
    })
  }

  const handleDelete = async (t: Doc<'tags'>) => {
    await removeTag({ tagId: t._id })
    setEdited((prev) => {
      const next = { ...prev }
      delete next[t._id]
      return next
    })
  }

  return (
    <main className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Tags</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Create</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Work"
            />
          </div>
          <div className="space-y-2">
            <Label>Color (optional)</Label>
            <Input
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              placeholder="#A3E635"
            />
          </div>
          <div>
            <Button onClick={handleCreate} disabled={!canCreate}>
              Add Tag
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Current Tags</h2>
        <div className="grid gap-2">
          {tags.length === 0 ? (
            <div className="text-sm text-muted-foreground">No tags yet</div>
          ) : (
            tags.map((t) => {
              const current = getEdited(t)
              const dirty =
                current.name.trim() !== t.name ||
                (current.color?.trim() || '') !== (t.color || '')
              return (
                <div
                  key={t._id}
                  className="flex flex-col md:flex-row md:items-end gap-3 border rounded p-3"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={current.name}
                        onChange={(e) =>
                          setEditedField(t._id, 'name', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input
                        value={current.color ?? ''}
                        onChange={(e) =>
                          setEditedField(t._id, 'color', e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!dirty}
                      onClick={() => handleSave(t)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(t)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>
    </main>
  )
}
