import { createClient } from '@convex-dev/better-auth'
import { convex, crossDomain } from '@convex-dev/better-auth/plugins'
import { betterAuth } from 'better-auth'
import { components, internal } from './_generated/api'
import { internalQuery, query } from './_generated/server'
import type { DataModel, Doc } from './_generated/dataModel'
import type { AuthFunctions, GenericCtx } from '@convex-dev/better-auth'

const authFunctions: AuthFunctions = internal.auth

export const authComponent = createClient<DataModel>(components.betterAuth, {
  verbose: true,
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, doc) => {
        const anyMember = await ctx.db.query('members').first()
        if (!anyMember) {
          await ctx.db.insert('members', {
            userId: doc._id,
            role: 'owner',
          })
        }
      },
    },
  },
})

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi()

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) return null

    const member = await ctx.db
      .query('members')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first()
    if (!member) return null

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: member.role,
    }
  },
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
    trustedOrigins: [
      siteUrl,
      'http://localhost:3001',
      'http://localhost:8080',
      'https://local-box.netlify.app',
    ],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    secret,
    advanced: {
      defaultCookieAttributes: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        partitioned: true,
      },
    },
    plugins: [convex()],
  })
}
