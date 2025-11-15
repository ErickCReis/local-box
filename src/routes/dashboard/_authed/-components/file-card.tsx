import {
  Check,
  DownloadIcon,
  MoreVerticalIcon,
  Tag,
  Trash2Icon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { FileIcon } from './file-icon'
import type { Doc, Id } from '@convex/_generated/dataModel'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tags,
  TagsContent,
  TagsEmpty,
  TagsGroup,
  TagsInput,
  TagsItem,
  TagsList,
  TagsTrigger,
  TagsValue,
} from '@/components/kibo-ui/tags'

type Tag = Doc<'tags'>

type FileItem = Omit<Doc<'files'>, 'storageId'>

type Props = {
  file: FileItem
  tags: Array<Tag>
  allTags: Array<Tag>
  onSetTags: (fileId: Id<'files'>, tagIds: Array<Id<'tags'>>) => void
  onDownload: (fileId: Id<'files'>) => void
  onDelete: (fileId: Id<'files'>) => void
}

export function FileCard({
  file,
  tags,
  allTags,
  onSetTags,
  onDownload,
  onDelete,
}: Props) {
  const kb = Math.max(1, Math.round(file.size / 1024))
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<Id<'tags'>>>(new Set())
  const isImage = file.contentType?.startsWith('image/')
  const thumbnailUrl = useQuery(
    api.files.getDownloadUrl,
    isImage ? { fileId: file._id } : 'skip',
  )
  useEffect(() => {
    setSelected(new Set(tags.map((t) => t._id)))
  }, [tags, file._id])
  const remove = (id: Id<'tags'>) => {
    // Prevent removal of system tags
    const tag = tags.find((t) => t._id === id)
    if (tag?.isSystem) return

    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      onSetTags(file._id, Array.from(next))
      return next
    })
  }
  const toggle = (id: Id<'tags'>) => {
    // Prevent toggling off system tags
    const tag = allTags.find((t) => t._id === id)
    if (tag?.isSystem && selected.has(id)) {
      // System tag is already selected, don't allow removing it
      return
    }

    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      onSetTags(file._id, Array.from(next))
      return next
    })
  }
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
  }
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
          {isImage && thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <FileIcon
              filename={file.filename}
              contentType={file.contentType}
              className="w-10 h-10 text-muted-foreground"
            />
          )}
        </div>
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="truncate font-medium">{file.filename}</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" aria-label="File actions">
                  <MoreVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6}>
                <DropdownMenuItem onClick={() => onDownload(file._id)}>
                  <DownloadIcon />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(file._id)}
                >
                  <Trash2Icon />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="text-xs text-muted-foreground">
            {kb} KB • {file.contentType ?? '—'}
          </div>
          <Tags open={open} onOpenChange={handleOpenChange}>
            <TagsTrigger
              className="min-h-8 h-8 p-1.5 rounded-sm border-muted-foreground/30"
              variant="outline"
              hidePlaceholder
            >
              {tags.length === 0 && (
                <div className="px-1 text-muted-foreground">
                  <Tag size={14} />
                </div>
              )}
              {tags.map((t) => (
                <TagsValue
                  key={t._id}
                  onRemove={t.isSystem ? undefined : () => remove(t._id)}
                  className="px-1.5 py-0.5 text-[10px]"
                  style={t.color ? { backgroundColor: t.color } : undefined}
                >
                  {t.name}
                </TagsValue>
              ))}
            </TagsTrigger>
            <TagsContent>
              <TagsInput className="h-7 text-xs border-0 shadow-none ring-0 focus:ring-0 focus-visible:ring-0" />
              <TagsList>
                <TagsEmpty>No tags found.</TagsEmpty>
                <TagsGroup>
                  {allTags.map((t) => {
                    const active = selected.has(t._id)
                    const isSystem = t.isSystem ?? false
                    // System tags that are active cannot be toggled off
                    const canToggle = !(isSystem && active)
                    return (
                      <TagsItem
                        key={t._id}
                        value={t.name}
                        onSelect={canToggle ? () => toggle(t._id) : undefined}
                        className={!canToggle ? 'cursor-not-allowed opacity-75' : undefined}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full border"
                            style={
                              t.color
                                ? {
                                    backgroundColor: t.color,
                                    borderColor: t.color,
                                  }
                                : undefined
                            }
                          />
                          <span>{t.name}</span>
                        </div>
                        <Check
                          className={active ? 'opacity-100' : 'opacity-0'}
                        />
                      </TagsItem>
                    )
                  })}
                </TagsGroup>
              </TagsList>
            </TagsContent>
          </Tags>
        </div>
      </div>
    </Card>
  )
}
