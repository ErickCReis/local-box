import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { TAG_COLORS, getColorName, isValidHexColor } from '@/lib/tag-colors'

type ColorPickerProps = {
  value: string
  onChange: (color: string) => void
  className?: string
  showCustomInput?: boolean
}

export function ColorPicker({
  value,
  onChange,
  className,
  showCustomInput = true,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [customColor, setCustomColor] = useState('')

  const handleColorSelect = (hex: string) => {
    onChange(hex)
    setOpen(false)
  }

  const handleCustomColorSubmit = () => {
    const trimmed = customColor.trim()
    if (trimmed && isValidHexColor(trimmed)) {
      onChange(trimmed)
      setCustomColor('')
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('justify-start', className)}
          type="button"
        >
          <span
            className={cn(
              'mr-2 inline-block h-4 w-4 rounded border',
              !value && 'bg-muted',
            )}
            style={value ? { backgroundColor: value } : undefined}
          />
          {value ? getColorName(value) : 'Select a color'}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-3 max-h-[400px] flex flex-col"
        align="start"
        onWheel={(e) => {
          // Prevent dialog from scrolling when scrolling inside popover
          e.stopPropagation()
        }}
      >
        <div className="flex flex-col gap-4">
          {/* Color swatches organized by family */}
          <div
            className="space-y-3 overflow-y-auto overflow-x-hidden pr-1 max-h-[300px]"
            onWheel={(e) => {
              // Prevent event bubbling to dialog
              e.stopPropagation()
            }}
          >
            {Object.entries(TAG_COLORS).map(([family, colors]) => (
              <div key={family} className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground capitalize">
                  {family}
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {colors.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => handleColorSelect(hex)}
                      className={cn(
                        'h-8 w-8 rounded border-2 transition-all hover:scale-110 hover:shadow-md',
                        value === hex
                          ? 'border-foreground ring-2 ring-offset-2'
                          : 'border-border',
                      )}
                      style={{ backgroundColor: hex }}
                      title={getColorName(hex)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Custom color input */}
          {showCustomInput && (
            <div className="space-y-2 border-t pt-3 shrink-0">
              <div className="text-xs font-medium text-muted-foreground">
                Custom Color
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="#000000"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCustomColorSubmit()
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCustomColorSubmit}
                  disabled={!isValidHexColor(customColor.trim())}
                >
                  Add
                </Button>
              </div>
              {customColor && !isValidHexColor(customColor.trim()) && (
                <p className="text-xs text-destructive">
                  Please enter a valid hex color (e.g., #FF5733)
                </p>
              )}
            </div>
          )}

          {/* Clear button */}
          {value && (
            <div className="border-t pt-3 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
