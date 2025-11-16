import { createServerFn } from '@tanstack/react-start'

// --- Convex server functions ---
export const checkConvexHealth = createServerFn().handler(async () => {
  try {
    const response = await fetch('http://localhost:8080/convex-host/version', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    return {
      healthy: response.ok,
      status: response.status,
    }
  } catch (error) {
    return {
      healthy: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

export const checkConvexAdminKey = createServerFn().handler(() => {
  const adminKey = process.env.CONVEX_SELF_HOSTED_ADMIN_KEY
  return {
    configured: !!adminKey,
    hasValue: adminKey ? adminKey.length > 0 : false,
  }
})
