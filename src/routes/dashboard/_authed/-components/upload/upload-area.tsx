import { UploadIcon } from 'lucide-react'
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

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current++
      setIsDragging(true)
    }

    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    }

    const onDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current = Math.max(0, dragCounter.current - 1)
      if (dragCounter.current === 0) {
        setIsDragging(false)
      }
    }

    const onDrop = (e: DragEvent) => {
      e.preventDefault()

      // stop bubbling so page-level React onDrop doesn't double-handle
      e.stopPropagation()
      dragCounter.current = 0
      setIsDragging(false)
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    }

    target.addEventListener('dragenter', onDragEnter, {
      passive: false,
    })
    target.addEventListener('dragover', onDragOver, {
      passive: false,
    })
    target.addEventListener('dragleave', onDragLeave, {
      passive: false,
    })
    target.addEventListener('drop', onDrop, { passive: false })
    listenersAttachedRef.current = true
    return () => {
      target.removeEventListener('dragenter', onDragEnter)
      target.removeEventListener('dragover', onDragOver)
      target.removeEventListener('dragleave', onDragLeave)
      target.removeEventListener('drop', onDrop)

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
        className="group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 transition-colors hover:border-muted-foreground/50"
      >
        <UploadIcon className="h-8 w-8 text-muted-foreground/70 group-hover:text-muted-foreground" />
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
