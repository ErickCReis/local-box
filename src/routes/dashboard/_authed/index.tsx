import {
  createFileRoute,
  stripSearchParams,
  useNavigate,
} from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { api } from '@convex/_generated/api'
import { useConvex, useMutation, useQuery } from 'convex/react'
import { zodValidator } from '@tanstack/zod-adapter'
import * as z from 'zod'
import { FileGrid } from './-components/file-grid'
import { TagFilterBar } from './-components/tag-filter-bar'
import { Toolbar } from './-components/toolbar'
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

  const uploader = useFileUploader({
    defaultTagIds: selectedTagIds,
  })
  const [uploadsOpen, setUploadsOpen] = useState(false)
  const handleToolbarSelectFiles = (filesList: FileList | null) => {
    if (!filesList) return
    uploader.addFiles(Array.from(filesList))
    setUploadsOpen(true)
  }

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
          onSelectFiles={handleToolbarSelectFiles}
          onCreateTag={handleCreateTag}
          newTagOpen={newTagOpen}
          setNewTagOpen={setNewTagOpen}
          hasActiveUploads={uploader.hasActiveUploads}
          overallProgress={uploader.overallProgress}
          onOpenUploads={() => setUploadsOpen(true)}
          onSignOut={() => {
            authClient.signOut().then(() => {
              navigate({ to: '/dashboard/sign-in' })
            })
          }}
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

      <TagFilterBar
        tags={tags}
        selectedIds={selectedTagIds}
        onToggle={onToggleFilter}
        onClear={onClearFilters}
      />

      <FileGrid
        rows={files as any}
        allTags={tags}
        onSetTags={onSetTags}
        onDownload={handleDownload}
        onDelete={(fileId) => deleteFile({ fileId: fileId })}
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
            className="rounded-md border-2 border-dashed border-muted-foreground/30 bg-background/40 p-4"
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
