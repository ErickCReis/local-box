import { useMemo } from 'react'
import type { UploadQueueItem } from '@/hooks/use-file-uploader'
import { Button } from '@/components/ui/button'

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
    <div className="space-y-4">
      {hasCompleted && onClearCompleted ? (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClearCompleted}>
            Clear completed
          </Button>
        </div>
      ) : null}
      <div className="max-h-[400px] overflow-y-auto">
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id}>
              <div className="grid grid-cols-[48px_1fr_auto] items-center gap-3 py-2">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
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

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium">
                      {item.file.name}
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {formatBytes(item.file.size)}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {item.status === 'queued' && 'Queued'}
                    {item.status === 'uploading' && 'Uploading...'}
                    {item.status === 'saving' && 'Saving...'}
                    {item.status === 'done' && 'Complete'}
                    {item.status === 'error' && (
                      <span className="text-destructive">
                        {item.error || 'Error'}
                      </span>
                    )}
                    {item.status === 'canceled' && 'Canceled'}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {(item.status === 'queued' ||
                    item.status === 'uploading' ||
                    item.status === 'saving') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancel(item.id)}
                      className="h-8 px-3"
                    >
                      Cancel
                    </Button>
                  )}
                  {item.status === 'error' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRetry(item.id)}
                      className="h-8 px-3"
                    >
                      Retry
                    </Button>
                  )}
                </div>
              </div>
              {index < items.length - 1 && (
                <div className="border-t border-border/50" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
