import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/ui/color-picker'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, color?: string) => Promise<void> | void
}

export function TagCreateDialog({ open, onOpenChange, onCreate }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>('')
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
            <ColorPicker value={color} onChange={setColor} />
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
