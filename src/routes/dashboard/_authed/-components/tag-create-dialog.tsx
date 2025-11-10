import { useMemo, useState } from 'react'
import type { FC } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

const SWATCHES = [
  '#A3E635',
  '#22C55E',
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#EF4444',
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, color?: string) => Promise<void> | void
}

export function TagCreateDialog({ open, onOpenChange, onCreate }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>('')
  const [colorOpen, setColorOpen] = useState(false)
  const canCreate = useMemo(() => name.trim().length > 0, [name])
  const handleCreate = async () => {
    if (!canCreate) return
    await onCreate(name.trim(), color.trim() || undefined)
    setName('')
    setColor('')
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tag</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <label className="grid gap-1">
            <span className="text-sm">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., invoices"
              className="border rounded-md px-2 py-1"
            />
          </label>
          <div className="grid gap-2">
            <span className="text-sm">Color (optional)</span>
            <Popover open={colorOpen} onOpenChange={setColorOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <span
                    className={cn(
                      'mr-2 inline-block h-4 w-4 rounded border',
                      !color && 'bg-muted',
                    )}
                    style={color ? { backgroundColor: color } : undefined}
                  />
                  {color || 'Select a color'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput placeholder="Search colors..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No colors.</CommandEmpty>
                    <CommandGroup>
                      {SWATCHES.map((hex) => (
                        <CommandItem
                          key={hex}
                          value={hex}
                          onSelect={(v) => {
                            setColor(v)
                            setColorOpen(false)
                          }}
                        >
                          <span
                            className="mr-2 inline-block h-4 w-4 rounded border"
                            style={{ backgroundColor: hex }}
                          />
                          {hex}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={!canCreate}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


