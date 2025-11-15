import { useMemo } from 'react'
import {
  Archive,
  FileCode,
  File as FileIconGeneric,
  FileText,
  Image as ImageIcon,
  Music,
  Sheet as Spreadsheet,
  Video,
} from 'lucide-react'

type Props = {
  filename: string
  contentType?: string | null
  className?: string
}

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : ''
}

export function FileIcon({ filename, contentType, className }: Props) {
  const ext = useMemo(() => getExtension(filename), [filename])
  const Icon = useMemo(() => {
    const type = contentType ?? ''
    if (
      type.startsWith('image/') ||
      ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)
    ) {
      return ImageIcon
    }
    if (
      type.startsWith('audio/') ||
      ['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)
    ) {
      return Music
    }
    if (
      type.startsWith('video/') ||
      ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)
    ) {
      return Video
    }
    if (
      type === 'application/pdf' ||
      ['pdf', 'txt', 'md', 'rtf', 'doc', 'docx'].includes(ext)
    ) {
      return FileText
    }
    if (
      ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) ||
      type === 'application/zip' ||
      type === 'application/x-7z-compressed' ||
      type === 'application/x-tar' ||
      type === 'application/gzip'
    ) {
      return Archive
    }
    if (
      [
        'js',
        'ts',
        'tsx',
        'jsx',
        'json',
        'py',
        'rb',
        'go',
        'rs',
        'java',
        'c',
        'cpp',
        'cs',
        'sh',
        'yml',
        'yaml',
        'toml',
      ].includes(ext)
    ) {
      return FileCode
    }
    if (['csv', 'xls', 'xlsx', 'ods'].includes(ext)) {
      return Spreadsheet
    }
    return FileIconGeneric
  }, [contentType, ext])

  return <Icon className={className} />
}
