import { createServerFn } from '@tanstack/react-start'
import { api } from '@convex/_generated/api'
import * as z from 'zod'
import { fetchMutation, fetchQuery } from '@/lib/auth-server'

export const getBillingConfig = createServerFn().handler(async () => {
  try {
    const config = await fetchQuery(api.billing.getBillingConfig, {})
    return {
      success: true,
      config,
    }
  } catch (error) {
    console.error('Error fetching billing config:', error)
    return {
      success: false,
      config: {
        billingEnabled: false,
        requiredProductId: undefined,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

export const updateBillingConfig = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      billingEnabled: z.boolean(),
      requiredProductId: z.optional(z.string()),
    }),
  )
  .handler(async ({ data }) => {
    try {
      await fetchMutation(api.billing.updateBillingConfig, {
        billingEnabled: data.billingEnabled,
        requiredProductId: data.requiredProductId,
      })
      return {
        success: true,
      }
    } catch (error) {
      console.error('Error updating billing config:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })
