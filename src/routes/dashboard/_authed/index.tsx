import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useRef, useState } from 'react'
import { api } from '@convex/_generated/api'
import { useAction, useConvex, useMutation, useQuery } from 'convex/react'
import type { Id } from '@convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

export const Route = createFileRoute('/dashboard/_authed/')({
  component: RouteComponent,
  loader: ({ context }) => context,
})

function RouteComponent() {
  const { authClient } = Route.useRouteContext()
  const navigate = useNavigate()
  const convex = useConvex()

  const tags = useQuery(api.tags.list, {}) ?? []

  const [selectedTagId, setSelectedTagId] = useState<Id<'tags'> | null>(null)
  const files = useQuery(api.files.list, {
    tagId: selectedTagId ?? undefined,
  })

  const generateUploadUrl = useAction(api.files.generateUploadUrl)
  const saveUploadedFile = useMutation(api.files.saveUploadedFile)
  const deleteFile = useMutation(api.files.remove)
  const setFileTags = useMutation(api.files.setTags)
  const createTag = useMutation(api.tags.create)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelectFiles = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async (filesList: FileList | null) => {
    if (!filesList) return
    for (const file of Array.from(filesList)) {
      const url = await generateUploadUrl({})
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
      const { storageId } = (await res.json()) as { storageId: string }
      await saveUploadedFile({
        storageId: storageId as any,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        tagIds: selectedTagId ? [selectedTagId as any] : [],
      })
    }
  }

  const handleDownload = async (fileId: string) => {
    const url = await convex.query(api.files.getDownloadUrl, {
      fileId: fileId as any,
    })
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [tagDialogFileId, setTagDialogFileId] = useState<string | null>(null)
  const [tagDialogSelection, setTagDialogSelection] = useState<Set<string>>(
    new Set(),
  )

  const openTagDialog = (fileId: string, currentTagIds: Array<string>) => {
    setTagDialogFileId(fileId)
    setTagDialogSelection(new Set(currentTagIds))
    setTagDialogOpen(true)
  }
  const toggleTagSelection = (tagId: string) => {
    setTagDialogSelection((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) next.delete(tagId)
      else next.add(tagId)
      return next
    })
  }
  const saveTagDialog = async () => {
    if (!tagDialogFileId) return
    await setFileTags({
      fileId: tagDialogFileId as any,
      tagIds: Array.from(tagDialogSelection) as any,
    })
    setTagDialogOpen(false)
  }

  const [newTagOpen, setNewTagOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('')
  const canCreateTag = useMemo(() => newTagName.trim().length > 0, [newTagName])
  const submitNewTag = async () => {
    if (!canCreateTag) return
    await createTag({
      name: newTagName.trim(),
      color: newTagColor.trim() || undefined,
    })
    setNewTagName('')
    setNewTagColor('')
    setNewTagOpen(false)
  }

  return (
    <main className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold truncate">Files</h1>
          <p className="text-muted-foreground mt-1">
            Upload, tag, and manage files. No folders — use tags.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button onClick={handleSelectFiles}>Upload</Button>
          <Dialog open={newTagOpen} onOpenChange={setNewTagOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">New Tag</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Tag</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <label className="grid gap-1">
                  <span className="text-sm">Name</span>
                  <input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="e.g., invoices"
                    className="border rounded-md px-2 py-1"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm">Color (optional)</span>
                  <input
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    placeholder="#A3E635"
                    className="border rounded-md px-2 py-1"
                  />
                </label>
              </div>
              <DialogFooter>
                <Button onClick={submitNewTag} disabled={!canCreateTag}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={() => {
              authClient.signOut().then(() => {
                navigate({
                  to: '/dashboard/sign-in',
                })
              })
            }}
          >
            Sign out
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={selectedTagId ? 'outline' : 'default'}
          onClick={() => setSelectedTagId(null)}
          className="cursor-pointer"
        >
          All
        </Badge>
        {tags.map((t) => (
          <Badge
            key={t._id}
            onClick={() =>
              setSelectedTagId((prev) => (prev === t._id ? null : t._id))
            }
            variant={
              selectedTagId === (t._id as string) ? 'default' : 'outline'
            }
            className="cursor-pointer"
            style={t.color ? { backgroundColor: t.color } : undefined}
          >
            {t.name}
          </Badge>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(files ?? []).map((row) => (
              <TableRow key={row.file._id}>
                <TableCell className="max-w-[320px] truncate">
                  {row.file.filename}
                </TableCell>
                <TableCell>{Math.round(row.file.size / 1024)} KB</TableCell>
                <TableCell>{row.file.contentType ?? '—'}</TableCell>
                <TableCell>
                  {new Date(row.file._creationTime).toLocaleString()}
                </TableCell>
                <TableCell className="space-x-1">
                  {row.tags.length === 0 ? (
                    <span className="text-muted-foreground">No tags</span>
                  ) : (
                    row.tags.map((t) => (
                      <Badge
                        key={t._id}
                        variant="secondary"
                        style={
                          t.color ? { backgroundColor: t.color } : undefined
                        }
                      >
                        {t.name}
                      </Badge>
                    ))
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openTagDialog(
                        row.file._id as unknown as string,
                        row.tags.map((t) => t._id as unknown as string),
                      )
                    }
                  >
                    Edit tags
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleDownload(row.file._id as unknown as string)
                    }
                  >
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteFile({ fileId: row.file._id })}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set tags</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            {tags.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No tags yet. Create one from the header.
              </p>
            ) : (
              tags.map((t) => (
                <label key={t._id} className="flex items-center gap-2">
                  <Checkbox
                    checked={tagDialogSelection.has(t._id)}
                    onCheckedChange={() =>
                      toggleTagSelection(t._id as unknown as string)
                    }
                  />
                  <span>{t.name}</span>
                </label>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={saveTagDialog}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
