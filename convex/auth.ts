import { createClient } from '@convex-dev/better-auth'
import { convex, crossDomain } from '@convex-dev/better-auth/plugins'
import { betterAuth } from 'better-auth'
import { components } from './_generated/api'
import { query } from './_generated/server'
import type { DataModel } from './_generated/dataModel'
import type { GenericCtx } from '@convex-dev/better-auth'

export const authComponent = createClient<DataModel>(components.betterAuth, {
  verbose: true,
})

export function createAuth(
  ctx: GenericCtx<DataModel>,
  { optionsOnly }: { optionsOnly?: boolean } = { optionsOnly: false },
) {
  const siteUrl = 'http://localhost:3000'
  const secret = process.env.BETTER_AUTH_SECRET!

  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    baseURL: siteUrl,
    trustedOrigins: [siteUrl, 'http://localhost:3001'],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    secret,
    plugins: [convex()],
  })
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    // Get user profile with role
    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .first()

    return {
      _id: identity.subject,
      name: identity.nickname ?? identity.name ?? 'Anonymous',
      email: identity.email,
      role: profile?.role ?? 'member',
    }
  },
})

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return false

    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .first()

    return profile?.role === 'owner' || profile?.role === 'admin'
  },
})
