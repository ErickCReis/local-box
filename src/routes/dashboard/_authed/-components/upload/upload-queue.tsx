import { useMemo } from 'react'
import type { UploadQueueItem } from '@/hooks/use-file-uploader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export type UploadQueueProps = {
  items: Array<UploadQueueItem>
  onCancel: (id: string) => void
  onRetry: (id: string) => void
  onClearCompleted?: () => void
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function UploadQueue({
  items,
  onCancel,
  onRetry,
  onClearCompleted,
}: UploadQueueProps) {
  const hasCompleted = useMemo(
    () => items.some((i) => i.status === 'done' || i.status === 'canceled'),
    [items],
  )

  if (items.length === 0) return null

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Uploads</CardTitle>
        {hasCompleted && onClearCompleted ? (
          <Button variant="ghost" size="sm" onClick={onClearCompleted}>
            Clear completed
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[48px_1fr_auto] items-center gap-4"
          >
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-xs text-muted-foreground">FILE</div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center justify-between">
                <div className="truncate text-sm font-medium">
                  {item.file.name}
                </div>
                <div className="ml-3 shrink-0 text-xs text-muted-foreground">
                  {formatBytes(item.file.size)}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Progress
                  value={item.progress}
                  aria-valuenow={item.progress}
                  className="h-2"
                />
                <div className="text-xs tabular-nums text-muted-foreground w-10 text-right">
                  {item.progress}%
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {item.status === 'queued' && 'Queued'}
                {item.status === 'uploading' && 'Uploading...'}
                {item.status === 'saving' && 'Saving...'}
                {item.status === 'done' && 'Complete'}
                {item.status === 'error' && (item.error || 'Error')}
                {item.status === 'canceled' && 'Canceled'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(item.status === 'queued' ||
                item.status === 'uploading' ||
                item.status === 'saving') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancel(item.id)}
                >
                  Cancel
                </Button>
              )}
              {item.status === 'error' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRetry(item.id)}
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
