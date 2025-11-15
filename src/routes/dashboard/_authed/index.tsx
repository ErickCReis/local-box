import {
  createFileRoute,
  stripSearchParams,
  useNavigate,
} from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { api } from '@convex/_generated/api'
import { useConvex, useMutation, useQuery } from 'convex/react'
import { zodValidator } from '@tanstack/zod-adapter'
import * as z from 'zod'
import { FileGrid } from './-components/file-grid'
import { TagFilterBar } from './-components/tag-filter-bar'
import { Toolbar } from './-components/toolbar'
import { BulkTagDialog } from './-components/bulk-tag-dialog'
import type { Id } from '@convex/_generated/dataModel'
import { useFileUploader } from '@/hooks/use-file-uploader'
import { UploadArea } from '@/routes/dashboard/_authed/-components/upload/upload-area'
import { UploadQueue } from '@/routes/dashboard/_authed/-components/upload/upload-queue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useHostConnected } from '@/providers/host-connection'
import { useStablePaginatedQuery } from '@/hooks/use-stable-query'

export const Route = createFileRoute('/dashboard/_authed/')({
  validateSearch: zodValidator(
    z.object({
      tags: z
        .array(z.string())
        .default([])
        .transform((val) => val.map((v) => v as Id<'tags'>)),
    }),
  ),
  search: {
    middlewares: [stripSearchParams({ tags: [] })],
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { authClient } = useHostConnected()
  const { tags: selectedTagIds } = Route.useSearch()
  const navigate = useNavigate()
  const convex = useConvex()
  const pageRef = useRef<HTMLElement | null>(null)

  const tags = useQuery(api.tags.list, {}) ?? []

  const {
    results: files,
    status: filesStatus,
    loadMore: loadMoreFiles,
  } = useStablePaginatedQuery(
    api.files.listPage,
    selectedTagIds.length ? { tagIds: selectedTagIds } : {},
    { initialNumItems: 24 },
  )

  const deleteFile = useMutation(api.files.remove)
  const setFileTags = useMutation(api.files.setTags)
  const createTag = useMutation(api.tags.create)

  const [selectedFileIds, setSelectedFileIds] = useState<Set<Id<'files'>>>(
    new Set(),
  )

  const toggleFileSelection = (fileId: Id<'files'>) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev)
      if (next.has(fileId)) {
        next.delete(fileId)
      } else {
        next.add(fileId)
      }
      return next
    })
  }

  const selectAllFiles = () => {
    const allFileIds = new Set<Id<'files'>>(files.map((row) => row.file._id))
    setSelectedFileIds(allFileIds)
  }

  const clearSelection = () => {
    setSelectedFileIds(new Set())
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        selectAllFiles()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [files])

  const uploader = useFileUploader({
    defaultTagIds: selectedTagIds,
  })
  const [uploadsOpen, setUploadsOpen] = useState(false)

  const handleDownload = async (fileId: Id<'files'>) => {
    const url = await convex.query(api.files.getDownloadUrl, {
      fileId: fileId,
    })
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const onSetTags = async (fileId: string, nextTagIds: Array<string>) => {
    await setFileTags({ fileId: fileId as any, tagIds: nextTagIds as any })
  }

  const [newTagOpen, setNewTagOpen] = useState(false)
  const handleCreateTag = async (name: string, color?: string) => {
    await createTag({ name, color })
  }

  const [bulkTagDialogOpen, setBulkTagDialogOpen] = useState(false)

  const handleBulkDelete = async () => {
    if (selectedFileIds.size === 0) return
    if (
      !confirm(
        `Are you sure you want to delete ${selectedFileIds.size} file(s)? This action cannot be undone.`,
      )
    ) {
      return
    }
    for (const fileId of selectedFileIds) {
      await deleteFile({ fileId })
    }
    clearSelection()
  }

  const handleBulkAddTags = async (tagIdsToAdd: Array<Id<'tags'>>) => {
    if (selectedFileIds.size === 0 || tagIdsToAdd.length === 0) return

    for (const fileId of selectedFileIds) {
      const fileRow = files.find((row) => row.file._id === fileId)
      if (!fileRow) continue

      const currentTagIds = fileRow.tags.map((t) => t._id)
      const mergedTagIds = Array.from(
        new Set([...currentTagIds, ...tagIdsToAdd]),
      )
      await setFileTags({ fileId, tagIds: mergedTagIds })
    }
    clearSelection()
  }

  const onToggleFilter = (tagId: Id<'tags'>) => {
    const set = new Set(selectedTagIds)
    if (set.has(tagId)) set.delete(tagId)
    else set.add(tagId)
    const next = Array.from(set)
    navigate({
      to: '.',
      search: (prev) => ({
        ...prev,
        tags: next.length ? next : undefined,
      }),
      replace: true,
    })
  }
  const onClearFilters = () => {
    navigate({
      to: '.',
      search: (prev) => ({ ...prev, tags: undefined }),
      replace: true,
    })
  }

  return (
    <main ref={pageRef} className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold truncate">Files</h1>
          <p className="text-muted-foreground mt-1">
            Upload, tag, and manage files. No folders — use tags.
          </p>
        </div>
        <Toolbar
          onCreateTag={handleCreateTag}
          newTagOpen={newTagOpen}
          setNewTagOpen={setNewTagOpen}
          hasActiveUploads={uploader.hasActiveUploads}
          onOpenUploads={() => setUploadsOpen(true)}
          onSignOut={() => {
            authClient.signOut().then(() => {
              navigate({ to: '/dashboard/sign-in' })
            })
          }}
          selectedFileIds={selectedFileIds}
          onClearSelection={clearSelection}
          onBulkDelete={handleBulkDelete}
          onBulkAddTags={() => setBulkTagDialogOpen(true)}
        />
      </div>

      <Dialog open={uploadsOpen} onOpenChange={setUploadsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Uploads</DialogTitle>
          </DialogHeader>
          <UploadQueue
            items={uploader.items}
            onCancel={uploader.cancel}
            onRetry={uploader.retry}
            onClearCompleted={uploader.clearCompleted}
          />
        </DialogContent>
      </Dialog>

      <BulkTagDialog
        open={bulkTagDialogOpen}
        onOpenChange={setBulkTagDialogOpen}
        allTags={tags}
        onConfirm={handleBulkAddTags}
      />

      <TagFilterBar
        tags={tags}
        selectedIds={selectedTagIds}
        onToggle={onToggleFilter}
        onClear={onClearFilters}
      />

      <FileGrid
        rows={files}
        allTags={tags}
        onSetTags={onSetTags}
        onDownload={handleDownload}
        onDelete={(fileId) => deleteFile({ fileId: fileId })}
        selectedFileIds={selectedFileIds}
        onToggleFileSelection={toggleFileSelection}
        extraStart={
          <UploadArea
            onFiles={(selectedFiles) => {
              uploader.addFiles(selectedFiles)
            }}
            watchRef={pageRef}
            accept="*/*"
            multiple
            title="Drag & drop files to upload"
            description="or click to browse"
          />
        }
      />

      {filesStatus === 'CanLoadMore' && (
        <div className="flex justify-center">
          <Button onClick={() => loadMoreFiles(24)}>Load more</Button>
        </div>
      )}
    </main>
  )
}
