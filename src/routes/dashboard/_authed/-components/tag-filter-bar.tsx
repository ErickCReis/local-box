import { useMemo } from 'react'
import { CheckIcon, X } from 'lucide-react'
import type { Doc, Id } from '@convex/_generated/dataModel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type Tag = Doc<'tags'>

type TagCategory = 'file_type' | 'size' | 'owner' | 'custom'

const CATEGORY_ORDER: Array<TagCategory> = [
  'file_type',
  'size',
  'owner',
  'custom',
]
const CATEGORY_LABELS: Record<TagCategory, string> = {
  file_type: 'File Type',
  size: 'Size',
  owner: 'Owner',
  custom: 'Custom',
}

type Props = {
  tags: Array<Tag>
  selectedIds: Array<Id<'tags'>>
  onToggle: (tagId: Id<'tags'>) => void
  onClear: () => void
}

export function TagFilterBar({ tags, selectedIds, onToggle, onClear }: Props) {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const hasSelection = selectedIds.length > 0

  // Group tags by category
  const groupedTags = useMemo(() => {
    const groups: Record<TagCategory, Array<Tag>> = {
      file_type: [],
      size: [],
      owner: [],
      custom: [],
    }

    for (const tag of tags) {
      const category = tag.category || 'custom'
      if (category in groups) {
        groups[category as TagCategory].push(tag)
      } else {
        groups.custom.push(tag)
      }
    }

    return groups
  }, [tags])

  const renderTagBadge = (tag: Tag) => {
    const active = selectedSet.has(tag._id)
    return (
      <Badge
        key={tag._id}
        onClick={() => onToggle(tag._id)}
        variant="outline"
        className={cn(
          'cursor-pointer transition-all font-semibold duration-200 flex items-center justify-center relative px-3 border-px border-transparent',
          active && 'pr-1.5 pl-4.5',
        )}
        style={
          active
            ? {
                backgroundColor: tag.color || 'hsl(var(--primary))',
                color: '#ffffff',
                borderColor: tag.color || 'hsl(var(--primary))',
              }
            : tag.color
              ? {
                  borderColor: tag.color,
                  color: tag.color,
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
        {tag.name}
      </Badge>
    )
  }

  return (
    <div className="space-y-3">
      {hasSelection && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="h-7 gap-1.5"
          >
            <X className="size-3" />
            Clear filters
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {CATEGORY_ORDER.map((category, categoryIndex) => {
          const categoryTags = groupedTags[category]
          if (categoryTags.length === 0) return null

          return (
            <div key={category} className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {CATEGORY_LABELS[category]}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {categoryTags.map(renderTagBadge)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
