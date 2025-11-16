import { createClient } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { betterAuth } from 'better-auth'
import { autumn } from 'autumn-js/better-auth'
import { v } from 'convex/values'
import { components, internal } from './_generated/api'
import { mutation, query } from './_generated/server'
import type { BetterAuthPlugin } from 'better-auth'
import type { DataModel } from './_generated/dataModel'
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

export const createOwnerUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { name, email, password }) => {
    const member = await ctx.db.query('members').first()
    if (member) {
      throw new Error('Owner user already exists')
    }

    const auth = createAuth(ctx)
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    })

    return result.user
  },
})
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

export const hasOwner = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const owner = await ctx.db
      .query('members')
      .filter((q) => q.eq(q.field('role'), 'owner'))
      .first()
    return owner !== null
  },
})

export function createAuth(
  ctx: GenericCtx<DataModel>,
  { optionsOnly }: { optionsOnly?: boolean } = { optionsOnly: false },
) {
  const siteUrl = 'http://localhost:3000'
  const secret = process.env.BETTER_AUTH_SECRET!
  const autumnSecretKey = process.env.AUTUMN_SECRET_KEY

  const plugins: Array<BetterAuthPlugin> = [convex()]

  // Add Autumn plugin if secret key is configured
  if (autumnSecretKey) {
    plugins.push(
      autumn({
        identify: async ({ session }) => {
          // Each host instance is its own customer
          // Use a fixed identifier for this host instance
          // In a multi-tenant setup, you might use the host URL or a unique host ID
          const hostId = process.env.HOST_ID || 'default-host'
          return {
            customerId: hostId,
            customerData: {
              name: `Host ${hostId}`,
              email: (await session)?.user.email || 'host@local-box.com',
            },
          }
        },
      }),
    )
  }

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
    plugins,
  })
}
