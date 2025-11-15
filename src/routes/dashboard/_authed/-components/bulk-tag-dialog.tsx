import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import type { Doc, Id } from '@convex/_generated/dataModel'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Tag = Doc<'tags'>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  allTags: Array<Tag>
  onConfirm: (tagIds: Array<Id<'tags'>>) => void
}

export function BulkTagDialog({
  open,
  onOpenChange,
  allTags,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState<Set<Id<'tags'>>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!open) {
      setSelected(new Set())
      setSearchQuery('')
    }
  }, [open])

  const toggle = (id: Id<'tags'>) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleConfirm = () => {
    onConfirm(Array.from(selected))
    onOpenChange(false)
  }

  const filteredTags = allTags.filter(
    (tag) =>
      !tag.isSystem &&
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tags to Selected Files</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Input
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8"
          />
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {filteredTags.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No tags found.
              </div>
            ) : (
              filteredTags.map((t) => {
                const active = selected.has(t._id)
                return (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => toggle(t._id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors',
                    )}
                  >
                    <Checkbox checked={active} onCheckedChange={() => {}} />
                    <span
                      className="h-2.5 w-2.5 rounded-full border shrink-0"
                      style={
                        t.color
                          ? {
                              backgroundColor: t.color,
                              borderColor: t.color,
                            }
                          : undefined
                      }
                    />
                    <span className="flex-1 text-left">{t.name}</span>
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        active ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </button>
                )
              })
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0}>
            Add Tags ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
