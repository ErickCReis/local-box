import { createContext, useContext } from 'react'
import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
import type { PropsWithChildren } from 'react'
import { useStablePaginatedQuery } from '@/hooks/use-stable-query'

type Tag = Doc<'tags'>

export type FileRow = {
  file: Doc<'files'>
  tags: Array<Tag>
}

type FilesContextType = {
  files: Array<FileRow>
  filesStatus: 'LoadingFirstPage' | 'LoadingMore' | 'CanLoadMore' | 'Exhausted'
  loadMoreFiles: (numItems: number) => void
}

const FilesContext = createContext<FilesContextType | null>(null)

type FilesProviderProps = PropsWithChildren<{
  selectedTagIds: Array<Id<'tags'>>
}>

export function FilesProvider({
  children,
  selectedTagIds,
}: FilesProviderProps) {
  const {
    results: files,
    status: filesStatus,
    loadMore: loadMoreFiles,
  } = useStablePaginatedQuery(
    api.files.listPage,
    selectedTagIds.length ? { tagIds: selectedTagIds } : {},
    { initialNumItems: 24 },
  )

  return (
    <FilesContext.Provider value={{ files, filesStatus, loadMoreFiles }}>
      {children}
    </FilesContext.Provider>
  )
}

export function useFiles() {
  const context = useContext(FilesContext)
  if (!context) {
    throw new Error('useFiles must be used within a FilesProvider')
  }
  return context
}
