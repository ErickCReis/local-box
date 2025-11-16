import { createServerFn } from '@tanstack/react-start'
import { api } from '@convex/_generated/api'
import * as z from 'zod'
import { fetchAction, fetchMutation, fetchQuery } from '@/lib/auth-server'

export const getBillingConfig = createServerFn().handler(async () => {
  const [config, validation] = await Promise.all([
    fetchQuery(api.billing.getBillingConfig, {}),
    fetchAction(api.billing.validateBillingSetup, {}),
  ])

  return {
    config,
    validation,
  }
})

export const updateBillingConfig = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      billingEnabled: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      await fetchMutation(api.billing.updateBillingConfig, {
        billingEnabled: data.billingEnabled,
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
