import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAction, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

// Set to false to disable all logging
const DEBUG = false as boolean
const log = (...args: Array<unknown>) => {
  if (!DEBUG) return
  console.log('[useFileUploader]', ...args)
}

const logError = (...args: Array<unknown>) => {
  if (!DEBUG) return
  console.error('[useFileUploader]', ...args)
}

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
  const inFlight = useRef<Map<string, AbortController>>(new Map())
  const itemsRef = useRef<Array<UploadQueueItem>>([])

  const addFiles = useCallback((files: Array<File>) => {
    log('Adding files:', files.length)
    setItems((prev) => {
      const next: Array<UploadQueueItem> = files.map((file) => {
        const id = makeId()
        log('Queued file:', {
          id,
          name: file.name,
          size: file.size,
          type: file.type,
        })
        return {
          id,
          file,
          status: 'queued',
          previewUrl: file.type.startsWith('image/')
            ? URL.createObjectURL(file)
            : undefined,
        }
      })
      const updated = [...prev, ...next]
      itemsRef.current = updated
      return updated
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
    log('Canceling upload:', id)
    const controller = inFlight.current.get(id)
    if (controller) {
      controller.abort()
      inFlight.current.delete(id)
      log('Upload aborted:', id)
    }
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: 'canceled' } : it)),
    )
  }, [])

  const retry = useCallback((id: string) => {
    log('Retrying upload:', id)
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, status: 'queued', error: undefined } : it,
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

  // Process queue with concurrency
  useEffect(() => {
    const uploadingCount = items.filter(
      (i) => i.status === 'uploading' || i.status === 'saving',
    ).length
    const available = Math.max(0, concurrent - uploadingCount)
    const queuedCount = items.filter((i) => i.status === 'queued').length

    log('Queue status:', {
      total: items.length,
      queued: queuedCount,
      uploading: uploadingCount,
      available,
      concurrent,
    })

    if (available <= 0) {
      log('No available slots, skipping')
      return
    }

    const nextBatch = items
      .filter((i) => i.status === 'queued')
      .slice(0, available)
    if (nextBatch.length === 0) {
      log('No queued items to process')
      return
    }

    log('Processing batch:', nextBatch.length)

    for (const queued of nextBatch) {
      ;(async () => {
        log('Starting upload:', {
          id: queued.id,
          name: queued.file.name,
          size: queued.file.size,
          type: queued.file.type,
        })
        // mark as uploading
        setItems((prev) =>
          prev.map((it) =>
            it.id === queued.id ? { ...it, status: 'uploading' } : it,
          ),
        )
        const controller = new AbortController()
        inFlight.current.set(queued.id, controller)
        try {
          log('Generating upload URL...', queued.id)
          const url = await generateUploadUrl({})
          log('Upload URL generated:', {
            id: queued.id,
            url: url.substring(0, 50) + '...',
          })

          log('Starting fetch request...', {
            id: queued.id,
            contentType: queued.file.type || 'application/octet-stream',
            fileSize: queued.file.size,
          })
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': queued.file.type || 'application/octet-stream',
            },
            body: queued.file,
            signal: controller.signal,
          })

          log('Fetch response received:', {
            id: queued.id,
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
          })

          if (!response.ok) {
            const text = await response.text()
            logError('Upload failed:', {
              id: queued.id,
              status: response.status,
              statusText: response.statusText,
              body: text,
            })
            throw new Error(
              `Upload failed: ${response.status} ${response.statusText}`,
            )
          }

          const parsed = (await response.json()) as {
            storageId: string
          }
          log('Upload response parsed:', {
            id: queued.id,
            storageId: parsed.storageId,
            hasStorageId: !!parsed.storageId,
          })

          if (!parsed.storageId) {
            logError('Invalid upload response:', {
              id: queued.id,
              parsed,
            })
            throw new Error('Invalid upload response')
          }

          // move to saving
          log('Moving to saving state:', queued.id)
          setItems((prev) =>
            prev.map((it) =>
              it.id === queued.id ? { ...it, status: 'saving' } : it,
            ),
          )

          inFlight.current.delete(queued.id)

          log('Saving file metadata...', {
            id: queued.id,
            storageId: parsed.storageId,
            filename: queued.file.name,
            contentType: queued.file.type,
            size: queued.file.size,
            tagIds: options.defaultTagIds ?? [],
          })
          await saveUploadedFile({
            storageId: parsed.storageId as any,
            filename: queued.file.name,
            contentType: queued.file.type,
            size: queued.file.size,
            tagIds: (options.defaultTagIds ?? []) as any,
          })

          log('Upload completed successfully:', queued.id)
          setItems((prev) =>
            prev.map((it) =>
              it.id === queued.id ? { ...it, status: 'done' } : it,
            ),
          )
        } catch (err) {
          const isAborted = err instanceof Error && err.name === 'AbortError'
          const message = err instanceof Error ? err.message : 'Upload failed'
          logError('Upload error:', {
            id: queued.id,
            error: err,
            isAborted,
            message,
            errorName: err instanceof Error ? err.name : undefined,
            errorStack: err instanceof Error ? err.stack : undefined,
          })
          setItems((prev) =>
            prev.map((it) =>
              it.id === queued.id
                ? {
                    ...it,
                    status: isAborted
                      ? ('canceled' as UploadStatus)
                      : ('error' as UploadStatus),
                    error: isAborted ? undefined : message,
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

  // Keep itemsRef in sync with items state
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      log('Component unmounting, cleaning up...')
      // Clean up all preview URLs
      for (const it of itemsRef.current) {
        if (it.previewUrl) {
          URL.revokeObjectURL(it.previewUrl)
        }
      }
      // Abort any inflight requests on unmount
      for (const controller of inFlight.current.values()) {
        try {
          controller.abort()
        } catch {}
      }
      inFlight.current.clear()
    }
  }, []) // Empty deps - only run on unmount

  return {
    items,
    addFiles,
    handleInputChange,
    cancel,
    retry,
    clearCompleted,
    hasActiveUploads,
  }
}
