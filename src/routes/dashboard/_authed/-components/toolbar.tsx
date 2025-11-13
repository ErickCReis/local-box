import { useRef } from 'react'
import { Loader2Icon, UploadIcon } from 'lucide-react'
import { TagCreateDialog } from './tag-create-dialog'
import { Button } from '@/components/ui/button'

type Props = {
  onSelectFiles: (files: FileList | null) => void
  onCreateTag: (name: string, color?: string) => Promise<void> | void
  newTagOpen: boolean
  setNewTagOpen: (open: boolean) => void
  hasActiveUploads: boolean
  onOpenUploads: () => void
  onSignOut: () => void
}

export function Toolbar({
  onSelectFiles,
  onCreateTag,
  newTagOpen,
  setNewTagOpen,
  hasActiveUploads,
  onOpenUploads,
  onSignOut,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => onSelectFiles(e.target.files)}
      />
      <Button onClick={() => fileInputRef.current?.click()}>Upload</Button>
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
