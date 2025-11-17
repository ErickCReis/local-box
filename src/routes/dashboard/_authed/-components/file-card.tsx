import {
  Check,
  DownloadIcon,
  MoreVerticalIcon,
  Tag,
  Trash2Icon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useConvex, useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { FileIcon } from './file-icon'
import type { Doc, Id } from '@convex/_generated/dataModel'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
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
import { useFileSelection } from '@/routes/dashboard/_authed/-providers/file-selection'
import { Badge } from '@/components/ui/badge'

type Tag = Doc<'tags'>

type FileItem = Omit<Doc<'files'>, 'storageId'>

type Props = {
  file: FileItem
  tags: Array<Tag>
}

export function FileCard({ file, tags }: Props) {
  const { selectedFileIds, toggleFileSelection } = useFileSelection()
  const isSelected = selectedFileIds.has(file._id)
  const kb = Math.max(1, Math.round(file.size / 1024))
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<Id<'tags'>>>(new Set())
  const isImage = file.contentType.startsWith('image/')
  const thumbnailUrl = useQuery(
    api.files.getDownloadUrl,
    isImage ? { fileId: file._id } : 'skip',
  )
  const allTags = useQuery(api.tags.list, {}) ?? []
  const setFileTags = useMutation(api.files.setTags)
  const deleteFile = useMutation(api.files.remove)
  const convex = useConvex()
  const user = useQuery(api.auth.getCurrentUser, {})
  const isViewer = user?.role === 'viewer'

  useEffect(() => {
    setSelected(new Set(tags.map((t) => t._id)))
  }, [tags, file._id])

  const handleDownload = async () => {
    const url = await convex.query(api.files.getDownloadUrl, {
      fileId: file._id,
    })
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleDelete = async () => {
    await deleteFile({ fileId: file._id })
  }

  const remove = async (id: Id<'tags'>) => {
    // Prevent removal of system tags
    const tag = tags.find((t) => t._id === id)
    if (tag?.isSystem) return

    const next = new Set(selected)
    next.delete(id)
    setSelected(next)
    await setFileTags({ fileId: file._id, tagIds: Array.from(next) })
  }

  const toggle = async (id: Id<'tags'>) => {
    // Prevent toggling system tags (cannot add or remove them manually)
    const tag = allTags.find((t) => t._id === id)
    if (tag?.isSystem) {
      // System tags cannot be manually added or removed
      return
    }

    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
    await setFileTags({ fileId: file._id, tagIds: Array.from(next) })
  }
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
  }
  const handleCheckboxChange = () => {
    toggleFileSelection(file._id)
  }
  return (
    <Card className="group relative p-4">
      <div
        className={cn(
          'absolute left-2 top-2 transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
      >
        {!isViewer && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${file.filename}`}
          />
        )}
      </div>
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
                <DropdownMenuItem onClick={handleDownload}>
                  <DownloadIcon />
                  Download
                </DropdownMenuItem>
                {!isViewer && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    <Trash2Icon />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="text-xs text-muted-foreground">
            {kb} KB • {file.contentType || '—'}
          </div>
          {isViewer ? (
            <div className="flex flex-wrap gap-1">
              {tags.length === 0 ? (
                <div className="px-1 text-muted-foreground text-xs">
                  <Tag size={14} className="inline mr-1" />
                  No tags
                </div>
              ) : (
                tags.map((t) => (
                  <Badge
                    key={t._id}
                    style={t.color ? { backgroundColor: t.color } : undefined}
                  >
                    {t.name}
                  </Badge>
                ))
              )}
            </div>
          ) : (
            <Tags open={open} onOpenChange={handleOpenChange}>
              <TagsTrigger
                className="h-8 p-1.5 rounded-sm border-muted-foreground/30 overflow-x-auto overflow-y-clip w-full"
                variant="ghost"
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
                    {allTags
                      .filter((t) => {
                        // Hide system tags that are not currently on the file
                        const isSystem = t.isSystem
                        const isActive = selected.has(t._id)
                        return !isSystem || isActive
                      })
                      .map((t) => {
                        const active = selected.has(t._id)
                        const isSystem = t.isSystem
                        // System tags cannot be toggled manually (cannot add or remove)
                        const canToggle = !isSystem
                        return (
                          <TagsItem
                            key={t._id}
                            value={t.name}
                            onSelect={
                              canToggle ? () => toggle(t._id) : undefined
                            }
                            className={
                              !canToggle
                                ? 'cursor-not-allowed opacity-75'
                                : undefined
                            }
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
          )}
        </div>
      </div>
    </Card>
  )
}
