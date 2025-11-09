import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import { api } from '@/../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/_host/admin/members')({
  component: MembersPage,
})

function MembersPage() {
  const { hostUrl } = Route.useRouteContext()

  const members = useQuery(api.members.listMembers, {}) ?? []

  const updateRole = useMutation(api.members.updateRole)
  const removeMember = useMutation(api.members.removeMember)
  const createInvite = useMutation(api.members.createInvite)

  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [inviteEmail, setInviteEmail] = useState('')

  const handleInvite = async () => {
    const res = await createInvite({
      role: inviteRole,
      email: inviteEmail || undefined,
      ttlMinutes: 60,
    })

    setInviteUrl(`${hostUrl}/dashboard?invite=${res.code}`)
  }

  return (
    <main className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Members</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Invite</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={inviteRole}
              onValueChange={(v) => setInviteRole(v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Email (optional)</Label>
            <Input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div>
            <Button onClick={handleInvite}>Create Invite</Button>
          </div>
        </div>
        {inviteUrl && (
          <div className="border rounded p-3 flex items-center justify-between">
            <div className="text-sm font-mono break-all">{inviteUrl}</div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(inviteUrl)}
            >
              Copy
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Current Members</h2>
        <div className="grid gap-2">
          {members.length === 0 ? (
            <div className="text-sm text-muted-foreground">No members yet</div>
          ) : (
            members.map((m) => (
              <div
                key={`${m.userId}`}
                className="flex items-center justify-between border rounded p-3"
              >
                <div>
                  <div className="font-medium">{m.userId}</div>
                  <div className="text-sm text-muted-foreground">
                    Role: {m.role}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Select
                    value={m.role}
                    onValueChange={(role) =>
                      updateRole({
                        userId: m.userId,
                        role: role as any,
                      })
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeMember({ userId: m.userId })}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
