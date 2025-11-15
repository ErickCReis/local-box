import { createContext, useContext, useState } from 'react'
import type { Id } from '@convex/_generated/dataModel'
import type { PropsWithChildren } from 'react'
import { useFileUploader } from '@/hooks/use-file-uploader'

type UploadContextType = {
  uploader: ReturnType<typeof useFileUploader>
  uploadsOpen: boolean
  setUploadsOpen: (open: boolean) => void
  openUploads: () => void
  closeUploads: () => void
  addFiles: (files: Array<File>) => void
  hasActiveUploads: boolean
}

const UploadContext = createContext<UploadContextType | null>(null)

type UploadProviderProps = PropsWithChildren<{
  defaultTagIds: Array<Id<'tags'>>
}>

export function UploadProvider({
  children,
  defaultTagIds,
}: UploadProviderProps) {
  const uploader = useFileUploader({
    defaultTagIds,
  })
  const [uploadsOpen, setUploadsOpen] = useState(false)

  const openUploads = () => setUploadsOpen(true)
  const closeUploads = () => setUploadsOpen(false)
  const addFiles = (files: Array<File>) => uploader.addFiles(files)

  return (
    <UploadContext.Provider
      value={{
        uploader,
        uploadsOpen,
        setUploadsOpen,
        openUploads,
        closeUploads,
        addFiles,
        hasActiveUploads: uploader.hasActiveUploads,
      }}
    >
      {children}
    </UploadContext.Provider>
  )
}

export function useUpload() {
  const context = useContext(UploadContext)
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider')
  }
  return context
}
