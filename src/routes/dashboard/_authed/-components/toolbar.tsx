import { Loader2Icon, Tag, Trash2Icon, UploadIcon, X } from 'lucide-react'
import { TagCreateDialog } from './tag-create-dialog'
import type { Id } from '@convex/_generated/dataModel'
import { Button } from '@/components/ui/button'

type Props = {
  onCreateTag: (name: string, color?: string) => Promise<void> | void
  newTagOpen: boolean
  setNewTagOpen: (open: boolean) => void
  hasActiveUploads: boolean
  onOpenUploads: () => void
  onSignOut: () => void
  selectedFileIds?: Set<Id<'files'>>
  onClearSelection?: () => void
  onBulkDelete?: () => void
  onBulkAddTags?: () => void
}

export function Toolbar({
  onCreateTag,
  newTagOpen,
  setNewTagOpen,
  hasActiveUploads,
  onOpenUploads,
  onSignOut,
  selectedFileIds,
  onClearSelection,
  onBulkDelete,
  onBulkAddTags,
}: Props) {
  const hasSelection = selectedFileIds && selectedFileIds.size > 0
  const selectionCount = selectedFileIds?.size ?? 0

  return (
    <div className="flex items-center gap-2">
      {hasSelection && (
        <>
          <span className="whitespace-nowrap px-3 py-1.5 rounded-md bg-primary/10 text-sm font-medium">
            {selectionCount} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkAddTags}
            disabled={!onBulkAddTags}
          >
            <Tag className="h-4 w-4 mr-1.5" />
            Add Tags
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkDelete}
            disabled={!onBulkDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2Icon className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            disabled={!onClearSelection}
            aria-label="Clear selection"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border" />
        </>
      )}
      <Button
        variant="outline"
        size="icon"
        aria-label="Open uploads"
        onClick={onOpenUploads}
        title={hasActiveUploads ? 'Uploading…' : 'Open uploads'}
      >
        <div className="relative">
          {hasActiveUploads ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <UploadIcon />
          )}
          {hasActiveUploads && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </div>
      </Button>
      <Button variant="secondary" onClick={() => setNewTagOpen(true)}>
        New Tag
      </Button>
      <TagCreateDialog
        open={newTagOpen}
        onOpenChange={setNewTagOpen}
        onCreate={onCreateTag}
      />
      <Button variant="outline" onClick={onSignOut}>
        Sign out
      </Button>
    </div>
  )
}
