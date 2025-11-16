import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
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
import { useHostUrl } from '@/providers/host-url'

export const Route = createFileRoute('/_host/admin/members')({
  component: MembersPage,
})

function MembersPage() {
  const { quickTunnel } = useLoaderData({ from: '/_host/admin' })
  const { hostUrl } = useHostUrl()

  const inviteHost = quickTunnel.tunnel ?? hostUrl

  const allUsers = useQuery(api.members.listAllUsers, {}) ?? []
  const members = allUsers.filter((u) => u.role !== null)
  const nonMembers = allUsers.filter((u) => u.role === null)

  const updateRole = useMutation(api.members.updateRole)
  const removeMember = useMutation(api.members.removeMember)
  const addMember = useMutation(api.members.addMember)
  const createInvite = useMutation(api.members.createInvite)

  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  const inviteForm = useForm({
    defaultValues: {
      role: 'member' as 'admin' | 'member',
      email: '',
    },
    onSubmit: async ({ value }) => {
      const res = await createInvite({
        role: value.role,
        email: value.email || undefined,
        ttlMinutes: 60,
      })

      setInviteUrl(`${inviteHost}/dashboard?invite=${res.code}`)
      inviteForm.reset()
    },
  })

  return (
    <main className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Invite</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            inviteForm.handleSubmit()
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-2">
              <inviteForm.Field name="role">
                {(field) => (
                  <>
                    <Label htmlFor={field.name}>Role</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v as any)}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {field.state.meta.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-500">
                        {String(error)}
                      </p>
                    ))}
                  </>
                )}
              </inviteForm.Field>
            </div>
            <div className="space-y-2">
              <inviteForm.Field name="email">
                {(field) => (
                  <>
                    <Label htmlFor={field.name}>Email (optional)</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="name@example.com"
                    />
                    {field.state.meta.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-500">
                        {String(error)}
                      </p>
                    ))}
                  </>
                )}
              </inviteForm.Field>
            </div>
            <div>
              <inviteForm.Subscribe>
                {(state) => (
                  <Button
                    type="submit"
                    disabled={!state.canSubmit || state.isSubmitting}
                  >
                    {state.isSubmitting ? 'Creating...' : 'Create Invite'}
                  </Button>
                )}
              </inviteForm.Subscribe>
            </div>
          </div>
        </form>
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
        <h2 className="text-xl font-medium">Members</h2>
        <div className="grid gap-2">
          {members.length === 0 ? (
            <div className="text-sm text-muted-foreground">No members yet</div>
          ) : (
            members.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between border rounded p-3"
              >
                <div>
                  <div className="font-medium">
                    {user.name || user.email || user._id}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.email && user.email !== user._id && (
                      <span>{user.email}</span>
                    )}
                    {user.role && <span> • Role: {user.role}</span>}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {user.role === 'owner' ? (
                    <div className="text-sm text-muted-foreground px-3 py-2">
                      Owner (cannot be changed)
                    </div>
                  ) : (
                    <Select
                      value={user.role || ''}
                      onValueChange={(role) =>
                        updateRole({
                          userId: user._id,
                          role: role as any,
                        })
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={user.role === 'owner'}
                    onClick={() => removeMember({ userId: user._id })}
                    title={
                      user.role === 'owner'
                        ? 'Cannot remove owner'
                        : 'Remove member'
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Non-Members</h2>
        <div className="grid gap-2">
          {nonMembers.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              All users are members
            </div>
          ) : (
            nonMembers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between border rounded p-3"
              >
                <div>
                  <div className="font-medium">
                    {user.name || user.email || user._id}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.email && user.email !== user._id && (
                      <span>{user.email}</span>
                    )}
                    {!user.email && <span>User ID: {user._id}</span>}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    size="sm"
                    onClick={() =>
                      addMember({
                        userId: user._id,
                        role: 'member',
                      })
                    }
                  >
                    Add as Member
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
