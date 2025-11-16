import { v } from 'convex/values'
import { autumn } from 'autumn-js/better-auth'
import { action, mutation, query } from './_generated/server'
import type { Product } from 'autumn-js'

// Fixed product ID for billing
export const FIXED_PRODUCT_ID = 'local-box'

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
        fixedProductId: FIXED_PRODUCT_ID,
      }
    }
    return {
      billingEnabled: config.billingEnabled,
      fixedProductId: FIXED_PRODUCT_ID,
    }
  },
})

// Update the host billing configuration
export const updateBillingConfig = mutation({
  args: {
    billingEnabled: v.boolean(),
  },
  handler: async (ctx, { billingEnabled }) => {
    // Get existing config
    const existing = await ctx.db.query('hostBilling').first()

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        billingEnabled,
      })
      return existing._id
    } else {
      // Create new record
      const id = await ctx.db.insert('hostBilling', {
        billingEnabled,
      })
      return id
    }
  },
})

// Validate billing setup: check AUTUMN_SECRET_KEY and product existence
export const validateBillingSetup = action({
  args: {},
  handler: async (ctx) => {
    const autumnSecretKey = process.env.AUTUMN_SECRET_KEY
    const hasAutumnSecretKey = !!autumnSecretKey

    if (!hasAutumnSecretKey) {
      return {
        hasAutumnSecretKey: false,
        products: [],
        hasInvalidProductId: false,
        fixedProductId: FIXED_PRODUCT_ID,
      }
    }

    const products = await autumn()
      .endpoints.listProducts()
      .then((result) => result.list as Array<Product>)
      .catch(() => [] as Array<Product>)

    return {
      hasAutumnSecretKey: true,
      products,
      hasInvalidProductId: products.some((p) => p.id !== FIXED_PRODUCT_ID),
      fixedProductId: FIXED_PRODUCT_ID,
    }
  },
})
