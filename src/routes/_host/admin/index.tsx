import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_host/admin/')({
  component: AdminHome,
})

function AdminHome() {
  return (
    <main className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold">Host Admin</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Members</h2>
        <p className="text-sm text-muted-foreground">
          Manage members and invitations for this host.
        </p>
        <Link to="/admin/members">
          <Button>Open Members</Button>
        </Link>
      </section>
    </main>
  )
}
