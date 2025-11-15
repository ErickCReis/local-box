import { useMemo } from 'react'
import { CheckIcon, X } from 'lucide-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Tag = Doc<'tags'>

type TagCategory = NonNullable<Tag['category']>

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

// Get route reference for useSearch
const Route = createFileRoute('/dashboard/_authed/')({})

export function TagFilterBar() {
  const navigate = useNavigate()
  const tags = useQuery(api.tags.list, {}) ?? []
  const { tags: selectedIds } = Route.useSearch()
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const hasSelection = selectedIds.length > 0

  const onToggle = (tagId: Id<'tags'>) => {
    const set = new Set(selectedIds)
    if (set.has(tagId)) set.delete(tagId)
    else set.add(tagId)
    const next = Array.from(set)
    navigate({
      to: '.',
      search: (prev) => ({
        ...prev,
        tags: next.length ? next : undefined,
      }),
      replace: true,
    })
  }

  const onClear = () => {
    navigate({
      to: '.',
      search: (prev) => ({ ...prev, tags: undefined }),
      replace: true,
    })
  }

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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {CATEGORY_ORDER.map((category) => {
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
        {hasSelection && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="h-[22px] gap-1"
          >
            <X className="size-3" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
