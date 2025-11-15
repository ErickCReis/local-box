import { createServerFn } from '@tanstack/react-start'
import { api } from '@convex/_generated/api'
import * as z from 'zod'
import { fetchMutation, fetchQuery } from '@/lib/auth-server'

// --- Auth server functions ---
export const checkAuthHealth = createServerFn().handler(async () => {
  try {
    // First check if an owner exists
    const hasOwner = await fetchQuery(api.auth.hasOwner, {})

    // Then check if the user is logged in
    const user = await fetchQuery(api.auth.getCurrentUser, {})
    const isLoggedIn = user !== null

    return {
      healthy: true,
      hasOwner,
      isLoggedIn,
      user,
    }
  } catch (error) {
    console.error(error)
    return {
      healthy: false,
      hasOwner: false,
      isLoggedIn: false,
      user: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

export const createOwnerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const createOwnerUser = createServerFn({ method: 'POST' })
  .inputValidator(createOwnerSchema)
  .handler(async ({ data }) => {
    return await fetchMutation(api.auth.createOwnerUser, data)
  })
