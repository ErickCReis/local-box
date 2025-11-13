import { useMemo } from 'react'
import { CheckIcon } from 'lucide-react'
import type { Doc, Id } from '@convex/_generated/dataModel'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
            variant="outline"
            className={cn(
              'cursor-pointer transition-all font-semibold duration-200 flex items-center justify-center relative px-3 border-px border-transparent',
              active && 'pr-1.5 pl-4.5',
            )}
            style={
              active
                ? {
                    backgroundColor: t.color || 'hsl(var(--primary))',
                    color: '#ffffff',
                    borderColor: t.color || 'hsl(var(--primary))',
                  }
                : t.color
                  ? {
                      borderColor: t.color,
                      color: t.color,
                    }
                  : undefined
            }
          >
            <CheckIcon
              className={cn(
                'size-3 shrink-0 absolute left-1 transition-opacity duration-200',
                active ? 'opacity-100' : 'opacity-0',
              )}
              strokeWidth={2.5}
            />
            {t.name}
          </Badge>
        )
      })}
    </div>
  )
}
