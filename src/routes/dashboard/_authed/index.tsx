import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { useRef } from 'react'
import { zodValidator } from '@tanstack/zod-adapter'
import * as z from 'zod'
import { FileGrid } from './-components/file-grid'
import { TagFilterBar } from './-components/tag-filter-bar'
import { Toolbar } from './-components/toolbar'
import type { Id } from '@convex/_generated/dataModel'
import { UploadArea } from '@/routes/dashboard/_authed/-components/upload/upload-area'
import { UploadQueue } from '@/routes/dashboard/_authed/-components/upload/upload-queue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FilesProvider,
  useFiles,
} from '@/routes/dashboard/_authed/-providers/files'
import { FileSelectionProvider } from '@/routes/dashboard/_authed/-providers/file-selection'
import {
  UploadProvider,
  useUpload,
} from '@/routes/dashboard/_authed/-providers/upload'

export const Route = createFileRoute('/dashboard/_authed/')({
  validateSearch: zodValidator(
    z.object({
      tags: z
        .array(z.string())
        .default([])
        .transform((val) => val.map((v) => v as Id<'tags'>)),
      files: z
        .array(z.string())
        .default([])
        .transform((val) => val.map((v) => v as Id<'files'>)),
    }),
  ),
  search: {
    middlewares: [stripSearchParams({ tags: [], files: [] })],
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { tags: selectedTagIds, files: selectedFileIds } = Route.useSearch()

  return (
    <FilesProvider selectedTagIds={selectedTagIds}>
      <FileSelectionProvider selectedFileIds={selectedFileIds}>
        <UploadProvider defaultTagIds={selectedTagIds}>
          <RouteComponentContent />
        </UploadProvider>
      </FileSelectionProvider>
    </FilesProvider>
  )
}

function RouteComponentContent() {
  const pageRef = useRef<HTMLElement | null>(null)
  const { filesStatus, loadMoreFiles } = useFiles()
  const { uploader, uploadsOpen, setUploadsOpen, addFiles } = useUpload()

  return (
    <main ref={pageRef} className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold truncate">Files</h1>
          <p className="text-muted-foreground mt-1">
            Upload, tag, and manage files. No folders — use tags.
          </p>
        </div>
        <Toolbar />
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

      <TagFilterBar />

      <FileGrid
        extraStart={
          <UploadArea
            onFiles={addFiles}
            // watchRef={pageRef}
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
