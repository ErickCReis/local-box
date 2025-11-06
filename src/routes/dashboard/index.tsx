import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: '/dashboard/sign-in' })
    } else {
      throw redirect({
        to: '/dashboard/$workspaceId',
        params: { workspaceId: context.user.id },
      })
    }
  },
})
