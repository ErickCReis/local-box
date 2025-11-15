import { createServerFn } from '@tanstack/react-start'
import { checkAuthHealth } from './setup/auth/-server'
import { checkConvexHealth } from './setup/convex/-server'
import { DOCKER } from '@/lib/docker'
import { getHostStore } from '@/lib/host-store'

// --- Setup status ---
export const setupStatus = createServerFn().handler(async () => {
  const [dockerStatus, quickTunnel, convexHealth, authHealth] =
    await Promise.all([
      DOCKER.getStatus(),
      Promise.resolve({ tunnel: getHostStore().tunnelUrl }),
      checkConvexHealth(),
      checkAuthHealth(),
    ])

  const dockerRunning =
    dockerStatus.length > 0 && dockerStatus.every((s) => s.State === 'running')
  const tunnelRunning = !!quickTunnel.tunnel
  const convexEnabled = convexHealth.healthy
  const authEnabled = authHealth.hasOwner

  const completedCount = [
    dockerRunning,
    tunnelRunning,
    convexEnabled,
    authEnabled,
  ].filter(Boolean).length

  return {
    dockerRunning,
    tunnelUrl: quickTunnel.tunnel,
    tunnelRunning,
    convexEnabled,
    authEnabled,
    completedCount,
    totalCount: 4,
  }
})
