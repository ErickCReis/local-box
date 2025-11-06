import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-8">
      <div className="max-w-3xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">Local Box</h1>
        <p className="text-lg text-muted-foreground">
          Fast, local-first tooling—minimal setup, maximum productivity.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/setup">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
