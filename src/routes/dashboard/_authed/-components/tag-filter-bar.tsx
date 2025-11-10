import { useMemo } from 'react'
import type { Doc, Id } from '@convex/_generated/dataModel'
import { Badge } from '@/components/ui/badge'

type Tag = Doc<'tags'>

type Props = {
  tags: Array<Tag>
  selectedIds: Array<Id<'tags'>>
  onToggle: (tagId: Id<'tags'>) => void
  onClear: () => void
}

export function TagFilterBar({ tags, selectedIds, onToggle, onClear }: Props) {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const hasSelection = selectedIds.length > 0
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant={hasSelection ? 'outline' : 'default'}
        onClick={onClear}
        className="cursor-pointer"
      >
        All
      </Badge>
      {tags.map((t) => {
        const active = selectedSet.has(t._id)
        return (
          <Badge
            key={t._id}
            onClick={() => onToggle(t._id)}
            variant={active ? 'default' : 'outline'}
            className="cursor-pointer"
            style={t.color ? { backgroundColor: t.color } : undefined}
          >
            {t.name}
          </Badge>
        )
      })}
    </div>
  )
}
