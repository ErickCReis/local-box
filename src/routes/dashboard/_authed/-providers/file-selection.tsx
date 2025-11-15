import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '@convex/_generated/api'
import { useMutation } from 'convex/react'
import { useFiles } from './files'
import type { Id } from '@convex/_generated/dataModel'
import type { PropsWithChildren } from 'react'

type FileSelectionContextType = {
  selectedFileIds: Set<Id<'files'>>
  toggleFileSelection: (fileId: Id<'files'>) => void
  selectAllFiles: () => void
  clearSelection: () => void
  handleBulkDelete: () => Promise<void>
  handleBulkAddTags: (tagIdsToAdd: Array<Id<'tags'>>) => Promise<void>
  bulkTagDialogOpen: boolean
  setBulkTagDialogOpen: (open: boolean) => void
}

const FileSelectionContext = createContext<FileSelectionContextType | null>(
  null,
)

export function FileSelectionProvider({ children }: PropsWithChildren) {
  const [selectedFileIds, setSelectedFileIds] = useState<Set<Id<'files'>>>(
    new Set(),
  )
  const [bulkTagDialogOpen, setBulkTagDialogOpen] = useState(false)
  const { files } = useFiles()
  const deleteFile = useMutation(api.files.remove)
  const setFileTags = useMutation(api.files.setTags)

  const toggleFileSelection = (fileId: Id<'files'>) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev)
      if (next.has(fileId)) {
        next.delete(fileId)
      } else {
        next.add(fileId)
      }
      return next
    })
  }

  const selectAllFiles = () => {
    const allFileIds = new Set<Id<'files'>>(files.map((row) => row.file._id))
    setSelectedFileIds(allFileIds)
  }

  const clearSelection = () => {
    setSelectedFileIds(new Set())
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        selectAllFiles()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [files])

  const handleBulkDelete = async () => {
    if (selectedFileIds.size === 0) return
    if (
      !confirm(
        `Are you sure you want to delete ${selectedFileIds.size} file(s)? This action cannot be undone.`,
      )
    ) {
      return
    }
    for (const fileId of selectedFileIds) {
      await deleteFile({ fileId })
    }
    clearSelection()
  }

  const handleBulkAddTags = async (tagIdsToAdd: Array<Id<'tags'>>) => {
    if (selectedFileIds.size === 0 || tagIdsToAdd.length === 0) return

    for (const fileId of selectedFileIds) {
      const fileRow = files.find((row) => row.file._id === fileId)
      if (!fileRow) continue

      const currentTagIds = fileRow.tags.map((t) => t._id)
      const mergedTagIds = Array.from(
        new Set([...currentTagIds, ...tagIdsToAdd]),
      )
      await setFileTags({ fileId, tagIds: mergedTagIds })
    }
    clearSelection()
  }

  return (
    <FileSelectionContext.Provider
      value={{
        selectedFileIds,
        toggleFileSelection,
        selectAllFiles,
        clearSelection,
        handleBulkDelete,
        handleBulkAddTags,
        bulkTagDialogOpen,
        setBulkTagDialogOpen,
      }}
    >
      {children}
    </FileSelectionContext.Provider>
  )
}

export function useFileSelection() {
  const context = useContext(FileSelectionContext)
  if (!context) {
    throw new Error(
      'useFileSelection must be used within a FileSelectionProvider',
    )
  }
  return context
}
