import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAction, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

type UploadStatus =
  | 'queued'
  | 'uploading'
  | 'saving'
  | 'done'
  | 'error'
  | 'canceled'

export type UploadQueueItem = {
  id: string
  file: File
  progress: number
  status: UploadStatus
  error?: string
  previewUrl?: string
}

export type UseFileUploaderOptions = {
  defaultTagIds?: Array<Id<'tags'>>
  concurrent?: number
}

export type UseFileUploaderResult = {
  items: Array<UploadQueueItem>
  addFiles: (files: Array<File>) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  cancel: (id: string) => void
  retry: (id: string) => void
  clearCompleted: () => void
  hasActiveUploads: boolean
  overallProgress: number
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useFileUploader(
  options: UseFileUploaderOptions = {},
): UseFileUploaderResult {
  const concurrent = options.concurrent ?? 3
  const generateUploadUrl = useAction(api.files.generateUploadUrl)
  const saveUploadedFile = useMutation(api.files.saveUploadedFile)

  const [items, setItems] = useState<Array<UploadQueueItem>>([])
  const inFlight = useRef<Map<string, XMLHttpRequest>>(new Map())

  const addFiles = useCallback((files: Array<File>) => {
    setItems((prev) => {
      const next: Array<UploadQueueItem> = files.map((file) => ({
        id: makeId(),
        file,
        progress: 0,
        status: 'queued',
        previewUrl: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined,
      }))
      return [...prev, ...next]
    })
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : []
      if (files.length) addFiles(files)
      // reset input so selecting the same file again re-triggers change
      e.target.value = ''
    },
    [addFiles],
  )

  const cancel = useCallback((id: string) => {
    const xhr = inFlight.current.get(id)
    if (xhr) {
      xhr.abort()
      inFlight.current.delete(id)
    }
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: 'canceled' } : it)),
    )
  }, [])

  const retry = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, status: 'queued', progress: 0, error: undefined }
          : it,
      ),
    )
  }, [])

  const clearCompleted = useCallback(() => {
    // revoke object URLs to avoid memory leaks
    setItems((prev) => {
      for (const it of prev) {
        if (
          it.previewUrl &&
          (it.status === 'done' ||
            it.status === 'error' ||
            it.status === 'canceled')
        ) {
          URL.revokeObjectURL(it.previewUrl)
        }
      }
      return prev.filter(
        (it) => it.status !== 'done' && it.status !== 'canceled',
      )
    })
  }, [])

  const hasActiveUploads = useMemo(
    () =>
      items.some(
        (it) =>
          it.status === 'queued' ||
          it.status === 'uploading' ||
          it.status === 'saving',
      ),
    [items],
  )

  const overallProgress = useMemo(() => {
    if (items.length === 0) return 0
    const total = items.reduce((acc, it) => acc + it.progress, 0)
    return Math.round(total / items.length)
  }, [items])

  // Process queue with concurrency
  useEffect(() => {
    const uploadingCount = items.filter(
      (i) => i.status === 'uploading' || i.status === 'saving',
    ).length
    const available = Math.max(0, concurrent - uploadingCount)
    if (available <= 0) return

    const nextBatch = items
      .filter((i) => i.status === 'queued')
      .slice(0, available)
    if (nextBatch.length === 0) return

    for (const queued of nextBatch) {
      ;(async () => {
        // mark as uploading
        setItems((prev) =>
          prev.map((it) =>
            it.id === queued.id
              ? { ...it, status: 'uploading', progress: 0 }
              : it,
          ),
        )
        try {
          const url = await generateUploadUrl({})
          const storageId = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            inFlight.current.set(queued.id, xhr)
            xhr.open('POST', url)
            xhr.setRequestHeader(
              'Content-Type',
              queued.file.type || 'application/octet-stream',
            )
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100)
                setItems((prev) =>
                  prev.map((it) =>
                    it.id === queued.id ? { ...it, progress: pct } : it,
                  ),
                )
              }
            }
            xhr.onerror = () => reject(new Error('Network error'))
            xhr.onabort = () => reject(new Error('aborted'))
            xhr.onload = () => {
              try {
                const parsed = JSON.parse(xhr.responseText) as {
                  storageId: string
                }
                if (!parsed.storageId) {
                  reject(new Error('Invalid upload response'))
                  return
                }
                resolve(parsed.storageId)
              } catch (e) {
                reject(new Error('Invalid server response'))
              }
            }
            xhr.send(queued.file)
          })

          // move to saving
          setItems((prev) =>
            prev.map((it) =>
              it.id === queued.id
                ? { ...it, status: 'saving', progress: 100 }
                : it,
            ),
          )

          inFlight.current.delete(queued.id)

          await saveUploadedFile({
            storageId: storageId as any,
            filename: queued.file.name,
            contentType: queued.file.type,
            size: queued.file.size,
            tagIds: (options.defaultTagIds ?? []) as any,
          })

          setItems((prev) =>
            prev.map((it) =>
              it.id === queued.id
                ? { ...it, status: 'done', progress: 100 }
                : it,
            ),
          )
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload failed'
          setItems((prev) =>
            prev.map((it) =>
              it.id === queued.id
                ? {
                    ...it,
                    status:
                      message === 'aborted'
                        ? ('canceled' as UploadStatus)
                        : ('error' as UploadStatus),
                    error: message === 'aborted' ? undefined : message,
                  }
                : it,
            ),
          )
          inFlight.current.delete(queued.id)
        }
      })()
    }
  }, [
    items,
    concurrent,
    generateUploadUrl,
    saveUploadedFile,
    options.defaultTagIds,
  ])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      for (const it of items) {
        if (it.previewUrl) URL.revokeObjectURL(it.previewUrl)
      }
      // abort any inflight
      for (const xhr of inFlight.current.values()) {
        try {
          xhr.abort()
        } catch {}
      }
      inFlight.current.clear()
    }
  }, [items])

  return {
    items,
    addFiles,
    handleInputChange,
    cancel,
    retry,
    clearCompleted,
    hasActiveUploads,
    overallProgress,
  }
}
