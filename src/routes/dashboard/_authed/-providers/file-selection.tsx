import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { api } from '@convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
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

type FileSelectionProviderProps = PropsWithChildren<{
  selectedFileIds: Array<Id<'files'>>
}>

export function FileSelectionProvider({
  children,
  selectedFileIds: selectedFileIdsArray,
}: FileSelectionProviderProps) {
  const navigate = useNavigate()
  const selectedFileIds = useMemo(
    () => new Set(selectedFileIdsArray),
    [selectedFileIdsArray],
  )
  const { files } = useFiles()
  const deleteFile = useMutation(api.files.remove)
  const setFileTags = useMutation(api.files.setTags)
  const [bulkTagDialogOpen, setBulkTagDialogOpen] = useState(false)
  const user = useQuery(api.auth.getCurrentUser, {})
  const isViewer = user?.role === 'viewer'

  const toggleFileSelection = (fileId: Id<'files'>) => {
    const set = new Set(selectedFileIdsArray)
    if (set.has(fileId)) set.delete(fileId)
    else set.add(fileId)
    const next = Array.from(set)
    navigate({
      to: '.',
      search: (prev) => ({
        ...prev,
        files: next.length ? next : undefined,
      }),
      replace: true,
    })
  }

  const selectAllFiles = () => {
    const allFileIds = files.map((row) => row.file._id)
    navigate({
      to: '.',
      search: (prev) => ({
        ...prev,
        files: allFileIds.length ? allFileIds : undefined,
      }),
      replace: true,
    })
  }

  const clearSelection = () => {
    navigate({
      to: '.',
      search: (prev) => ({ ...prev, files: undefined }),
      replace: true,
    })
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
    if (isViewer) return
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
    if (isViewer) return
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
