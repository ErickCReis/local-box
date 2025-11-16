import { createClient } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { betterAuth } from 'better-auth'
import { autumn } from 'autumn-js/better-auth'
import { v } from 'convex/values'
import {
  customAction,
  customCtx,
  customMutation,
  customQuery,
} from 'convex-helpers/server/customFunctions'
import { components, internal } from './_generated/api'
import { action, internalQuery, mutation, query } from './_generated/server'
import authSchema from './betterAuth/schema'
import type { ActionCtx, MutationCtx, QueryCtx } from './_generated/server'
import type { BetterAuthPlugin } from 'better-auth'
import type { DataModel, Doc } from './_generated/dataModel'
import type { AuthFunctions, GenericCtx } from '@convex-dev/better-auth'

const authFunctions: AuthFunctions = internal.auth

export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    verbose: true,
    authFunctions,
    local: {
      schema: authSchema,
    },
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
  },
)

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

// Internal query to get member by userId (used by actions)
export const getMemberByUserId = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const member = await ctx.db
      .query('members')
      .withIndex('by_user', (q: any) => q.eq('userId', userId))
      .first()
    return member
  },
})

// Helper function to get user and member data for queries and mutations
async function getUserAndMember(ctx: QueryCtx | MutationCtx) {
  const user = await authComponent.safeGetAuthUser(ctx)
  if (!user) {
    throw new Error('Authentication required')
  }

  const member = await ctx.db
    .query('members')
    .withIndex('by_user', (q: any) => q.eq('userId', user._id))
    .first()

  if (!member) {
    throw new Error('Member access required')
  }

  return { user, member }
}

// Helper function to get user and member data for actions
async function getUserAndMemberAction(ctx: ActionCtx): Promise<{
  user: { _id: string; name: string | null; email: string | null }
  member: Doc<'members'>
}> {
  const user = await authComponent.safeGetAuthUser(ctx)
  if (!user) {
    throw new Error('Authentication required')
  }

  const member = await ctx.runQuery(internal.auth.getMemberByUserId, {
    userId: user._id,
  })

  if (!member) {
    throw new Error('Member access required')
  }

  return { user, member }
}

// Custom functions for member access (owner, admin, or member)
export const memberQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const { user, member } = await getUserAndMember(ctx)
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      member: {
        _id: member._id,
        userId: member.userId,
        role: member.role,
      },
    }
  }),
)

export const memberMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const { user, member } = await getUserAndMember(ctx)
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      member: {
        _id: member._id,
        userId: member.userId,
        role: member.role,
      },
    }
  }),
)

export const memberAction = customAction(
  action,
  customCtx(async (ctx) => {
    const { user, member } = await getUserAndMemberAction(ctx)
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      member: {
        _id: member._id,
        userId: member.userId,
        role: member.role,
      },
    }
  }),
)

// Custom functions for admin access (admin or owner only)
export const adminQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const { user, member } = await getUserAndMember(ctx)
    if (member.role !== 'admin' && member.role !== 'owner') {
      throw new Error('Admin access required')
    }
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      member: {
        _id: member._id,
        userId: member.userId,
        role: member.role,
      },
    }
  }),
)

export const adminMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const { user, member } = await getUserAndMember(ctx)
    if (member.role !== 'admin' && member.role !== 'owner') {
      throw new Error('Admin access required')
    }
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      member: {
        _id: member._id,
        userId: member.userId,
        role: member.role,
      },
    }
  }),
)

export const adminAction = customAction(
  action,
  customCtx(async (ctx) => {
    const { user, member } = await getUserAndMemberAction(ctx)
    if (member.role !== 'admin' && member.role !== 'owner') {
      throw new Error('Admin access required')
    }
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      member: {
        _id: member._id,
        userId: member.userId,
        role: member.role,
      },
    }
  }),
)

// Custom functions for owner access (owner only)
export const ownerQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const { user, member } = await getUserAndMember(ctx)
    if (member.role !== 'owner') {
      throw new Error('Owner access required')
    }
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      member: {
        _id: member._id,
        userId: member.userId,
        role: member.role,
      },
    }
  }),
)

export const ownerMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const { user, member } = await getUserAndMember(ctx)
    if (member.role !== 'owner') {
      throw new Error('Owner access required')
    }
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      member: {
        _id: member._id,
        userId: member.userId,
        role: member.role,
      },
    }
  }),
)

export const ownerAction = customAction(
  action,
  customCtx(async (ctx) => {
    const { user, member } = await getUserAndMemberAction(ctx)
    if (member.role !== 'owner') {
      throw new Error('Owner access required')
    }
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      member: {
        _id: member._id,
        userId: member.userId,
        role: member.role,
      },
    }
  }),
)

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
        customerScope: 'user',
        identify: async ({ session }) => {
          const sessionData = await session
          if (!sessionData) return null

          return {
            customerId: sessionData.user.id,
            customerData: {
              name: sessionData.user.name,
              email: sessionData.user.email,
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
