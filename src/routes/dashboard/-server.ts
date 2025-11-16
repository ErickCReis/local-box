import { createServerFn } from '@tanstack/react-start'
import { api } from '@convex/_generated/api'
import { fetchQuery } from '@/lib/auth-server'
import { headers } from '@tanstack/react-start/server'

export const checkBillingAccess = createServerFn().handler(async () => {
  try {
    // Get billing configuration
    const billingConfig = await fetchQuery(api.billing.getBillingConfig, {})

    // If billing is not enabled, allow access
    if (!billingConfig.billingEnabled) {
      return {
        allowed: true,
        reason: 'billing_not_enabled',
      }
    }

    // If no required product ID, allow access (shouldn't happen, but safety check)
    if (!billingConfig.requiredProductId) {
      return {
        allowed: true,
        reason: 'no_product_required',
      }
    }

    // Check subscription status via Better Auth Autumn API
    // Note: This requires the auth context to be available
    // We'll do a client-side check as fallback, but try server-side first
    try {
      const requestHeaders = await headers()
      // The auth object should be available through the context
      // For now, we'll return that a check is needed client-side
      return {
        allowed: 'check_required',
        reason: 'client_check_needed',
        requiredProductId: billingConfig.requiredProductId,
      }
    } catch (error) {
      // Fallback to client-side check
      return {
        allowed: 'check_required',
        reason: 'client_check_needed',
        requiredProductId: billingConfig.requiredProductId,
      }
    }
  } catch (error) {
    console.error('Error checking billing access:', error)
    // On error, allow access (fail open)
    return {
      allowed: true,
      reason: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

