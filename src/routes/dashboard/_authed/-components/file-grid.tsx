import { FileCard } from './file-card'
import type { ReactNode } from 'react'
import { useFiles } from '@/routes/dashboard/_authed/-providers/files'

type Props = {
  extraStart?: ReactNode
}

export function FileGrid({ extraStart }: Props) {
  const { files } = useFiles()

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {extraStart}
      {files.map((row) => (
        <FileCard
          key={row.file._id}
          file={row.file}
          tags={row.tags}
        />
      ))}
    </div>
  )
}
