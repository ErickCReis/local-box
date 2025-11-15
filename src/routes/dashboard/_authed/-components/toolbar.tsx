import { useState } from 'react'
import { Loader2Icon, Tag, Trash2Icon, UploadIcon, X } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { TagCreateDialog } from './tag-create-dialog'
import { BulkTagDialog } from './bulk-tag-dialog'
import { Button } from '@/components/ui/button'
import { useHostConnected } from '@/providers/host-connection'
import { useFileSelection } from '@/routes/dashboard/_authed/-providers/file-selection'
import { useUpload } from '@/routes/dashboard/_authed/-providers/upload'

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
  const { authClient } = useHostConnected()
  const navigate = useNavigate()

  const handleCreateTag = async (name: string, color?: string) => {
    await createTag({ name, color })
  }

  const handleSignOut = () => {
    authClient.signOut().then(() => {
      navigate({ to: '/dashboard/sign-in' })
    })
  }

  return (
    <div className="flex items-center gap-2">
      {selectedFileIds.size > 0 && (
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
        onCreate={handleCreateTag}
      />
      <BulkTagDialog
        open={bulkTagDialogOpen}
        onOpenChange={setBulkTagDialogOpen}
        onConfirm={handleBulkAddTags}
      />
      <Button variant="outline" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  )
}
