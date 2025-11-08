import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/$workspaceId')({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: '/dashboard/sign-in' })
    }
    return {
      ...context,
      user: context.user,
    }
  },
})
