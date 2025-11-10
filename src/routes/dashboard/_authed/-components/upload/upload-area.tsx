import { useCallback, useEffect, useRef, useState } from 'react'

export type UploadAreaProps = {
  onFiles: (files: Array<File>) => void
  accept?: string
  multiple?: boolean
  className?: string
  title?: string
  description?: string
  watchRef?: React.RefObject<HTMLElement | null>
}

export function UploadArea({
  onFiles,
  accept = '*/*',
  multiple = true,
  className,
  title = 'Drag & drop files here',
  description = 'or click to browse',
  watchRef,
}: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listenersAttachedRef = useRef(false)
  const watchTarget: any =
    watchRef && watchRef.current ? watchRef.current : window

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return
      const files = Array.from(fileList)
      if (files.length > 0) onFiles(files)
    },
    [onFiles],
  )

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
      // reset so selecting the same file triggers again
      e.currentTarget.value = ''
    },
    [handleFiles],
  )

  const onClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }, [])

  // Watch global (or provided ref) drag events to toggle the overlay anywhere on page
  useEffect(() => {
    const target: any = watchTarget
    if (!target) return

    const prevent = (e: Event) => {
      e.preventDefault()
    }
    const onDragEnter = (e: DragEvent) => {
      prevent(e)
      dragCounter.current++
      setIsDragging(true)
    }
    const onDragOver = (e: DragEvent) => {
      prevent(e)
      setIsDragging(true)
    }
    const onDragLeave = (e: DragEvent) => {
      prevent(e)
      dragCounter.current = Math.max(0, dragCounter.current - 1)
      if (dragCounter.current === 0) {
        setIsDragging(false)
      }
    }
    const onDrop = (e: DragEvent) => {
      prevent(e)
      // stop bubbling so page-level React onDrop doesn't double-handle
      e.stopPropagation()
      dragCounter.current = 0
      setIsDragging(false)
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    }

    target.addEventListener('dragenter', onDragEnter as EventListener, {
      passive: false,
    })
    target.addEventListener('dragover', onDragOver as EventListener, {
      passive: false,
    })
    target.addEventListener('dragleave', onDragLeave as EventListener, {
      passive: false,
    })
    target.addEventListener('drop', onDrop as EventListener, { passive: false })
    listenersAttachedRef.current = true
    return () => {
      try {
        target.removeEventListener('dragenter', onDragEnter as EventListener)
        target.removeEventListener('dragover', onDragOver as EventListener)
        target.removeEventListener('dragleave', onDragLeave as EventListener)
        target.removeEventListener('drop', onDrop as EventListener)
      } catch {}
      listenersAttachedRef.current = false
    }
  }, [watchTarget])

  return (
    <div className={className}>
      {isDragging && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 flex h-[88%] w-[88%] items-center justify-center rounded-xl border-2 border-dashed border-white/50 bg-white/5">
            <p className="text-xl font-medium text-white">
              Drop files to upload
            </p>
          </div>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files"
        onClick={onClick}
        onKeyDown={onKeyDown}
        className="group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 transition-colors hover:border-muted-foreground/50"
      >
        <svg
          className="h-8 w-8 text-muted-foreground/70 group-hover:text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={onInputChange}
        />
      </div>
    </div>
  )
}
