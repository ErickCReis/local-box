import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// Get the current host billing configuration
export const getBillingConfig = query({
  args: {},
  handler: async (ctx) => {
    // Get the first (and only) billing config record
    const config = await ctx.db.query('hostBilling').first()
    if (!config) {
      // Return default config if none exists
      return {
        billingEnabled: false,
        requiredProductId: undefined,
      }
    }
    return {
      billingEnabled: config.billingEnabled,
      requiredProductId: config.requiredProductId,
    }
  },
})

// Update the host billing configuration
export const updateBillingConfig = mutation({
  args: {
    billingEnabled: v.boolean(),
    requiredProductId: v.optional(v.string()),
  },
  handler: async (ctx, { billingEnabled, requiredProductId }) => {
    // Get existing config
    const existing = await ctx.db.query('hostBilling').first()
    
    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        billingEnabled,
        requiredProductId,
      })
      return existing._id
    } else {
      // Create new record
      const id = await ctx.db.insert('hostBilling', {
        billingEnabled,
        requiredProductId,
      })
      return id
    }
  },
})

