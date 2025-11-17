import { useState } from 'react'
import { ListTreeIcon, Loader2Icon, Tag, Trash2Icon, X } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { TagCreateDialog } from './tag-create-dialog'
import { BulkTagDialog } from './bulk-tag-dialog'
import { Button } from '@/components/ui/button'
import { useFileSelection } from '@/routes/dashboard/_authed/-providers/file-selection'
import { useUpload } from '@/routes/dashboard/_authed/-providers/upload'
import { UserMenu } from '@/components/user-menu'

export function Toolbar() {
  const {
    selectedFileIds,
    clearSelection,
    handleBulkDelete,
    handleBulkAddTags,
    bulkTagDialogOpen,
    setBulkTagDialogOpen,
  } = useFileSelection()
  const { hasActiveUploads, openUploads } = useUpload()
  const [newTagOpen, setNewTagOpen] = useState(false)
  const createTag = useMutation(api.tags.create)
  const user = useQuery(api.auth.getCurrentUser, {})
  const isViewer = user?.role === 'viewer'

  const handleCreateTag = async (name: string, color?: string) => {
    await createTag({ name, color })
  }

  return (
    <div className="flex items-center gap-2">
      {selectedFileIds.size > 0 && !isViewer && (
        <>
          <span className="whitespace-nowrap px-3 py-1.5 rounded-md bg-primary/10 text-sm font-medium">
            {selectedFileIds.size} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkTagDialogOpen(true)}
          >
            <Tag className="h-4 w-4 mr-1.5" />
            Add Tags
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2Icon className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSelection}
            aria-label="Clear selection"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border" />
        </>
      )}
      {!isViewer && (
        <Button
          variant="outline"
          size="icon"
          aria-label="Open uploads"
          onClick={openUploads}
          title={hasActiveUploads ? 'Uploading…' : 'Open uploads'}
        >
          <div className="relative">
            {hasActiveUploads ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <ListTreeIcon />
            )}
            {hasActiveUploads && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
            )}
          </div>
        </Button>
      )}
      {!isViewer && (
        <Button variant="secondary" onClick={() => setNewTagOpen(true)}>
          New Tag
        </Button>
      )}
      <TagCreateDialog
        open={newTagOpen}
        onOpenChange={setNewTagOpen}
        onCreate={handleCreateTag}
      />
      <BulkTagDialog
        open={bulkTagDialogOpen}
        onOpenChange={setBulkTagDialogOpen}
        onConfirm={handleBulkAddTags}
      />
      <UserMenu />
    </div>
  )
}
