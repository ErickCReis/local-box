import { FileCard } from './file-card'
import type { ReactNode } from 'react'
import type { Doc, Id } from '@convex/_generated/dataModel'

type Tag = Doc<'tags'>

type FileRow = {
  file: Doc<'files'>
  tags: Array<Tag>
}

type Props = {
  rows: Array<FileRow>
  allTags: Array<Tag>
  onSetTags: (fileId: Id<'files'>, tagIds: Array<Id<'tags'>>) => void
  onDownload: (fileId: Id<'files'>) => void
  onDelete: (fileId: Id<'files'>) => void
  extraStart?: ReactNode
}

export function FileGrid({
  rows,
  allTags,
  onSetTags,
  onDownload,
  onDelete,
  extraStart,
}: Props) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {extraStart}
      {rows.map((row) => (
        <FileCard
          key={row.file._id}
          file={row.file}
          tags={row.tags}
          allTags={allTags}
          onSetTags={onSetTags}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
