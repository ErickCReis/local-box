import { Spinner } from '@/components/ui/spinner'

/**
 * Minimal loading component that prevents flicker for fast-loading states.
 * Centered on the page with minimal visual footprint.
 */
export function MinimalLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-3 text-muted-foreground/50" />
    </div>
  )
}

