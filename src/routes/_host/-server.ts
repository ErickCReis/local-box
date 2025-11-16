import { createServerFn } from '@tanstack/react-start'
import { checkAuthHealth } from './setup/auth/-server'
import { checkConvexHealth } from './setup/convex/-server'
import { getQuickTunnels } from './setup/tunnel/-server'
import { getDockerStatus } from './setup/docker/-server'

// --- Setup status ---
export const setupStatus = createServerFn().handler(async () => {
  const [dockerStatus, quickTunnel, convexHealth, authHealth] =
    await Promise.all([
      getDockerStatus(),
      getQuickTunnels(),
      checkConvexHealth(),
      checkAuthHealth(),
    ])

  return {
    dockerStatus,
    quickTunnel,
    convexHealth,
    authHealth,
  }
})
