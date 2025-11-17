import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { api } from './_generated/api'
import { adminMutation, adminQuery, createAuth } from './auth'

export const listMembers = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('members').collect()
    return rows.map((r) => ({ userId: r.userId, role: r.role }))
  },
})

export const listAllUsers = adminQuery({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query('members').collect()
    const memberMap = new Map(
      members.map((m) => [m.userId, m.role] as [string, string]),
    )

    const auth = createAuth(ctx)
    const users = await (
      await auth.$context
    ).adapter.findMany({ model: 'user' })

    const allUsers = users.map((user: any) => {
      const memberRole = memberMap.get(user.id)
      return {
        _id: user.id as string,
        name: (user.name as string) || '',
        email: (user.email as string) || '',
        role: memberRole ? (memberRole as 'owner' | 'admin' | 'member' | 'viewer') : null,
      }
    })

    return allUsers
  },
})

export const createInvite = adminMutation({
  args: {
    role: v.union(v.literal('admin'), v.literal('member'), v.literal('viewer')),
    email: v.optional(v.string()),
    ttlMinutes: v.optional(v.number()),
  },
  handler: async (ctx, { role, email, ttlMinutes }) => {
    const code = Math.random().toString(36).slice(2, 10)
    const expiresAt = Date.now() + (ttlMinutes ?? 60) * 60_000

    await ctx.db.insert('invitations', {
      code,
      role,
      email,
      expiresAt,
      createdBy: ctx.user._id,
    })

    return { code }
  },
})

export const acceptInvite = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const user = await ctx.runQuery(api.auth.getCurrentUser)
    if (!user) throw new Error('Not signed in')

    const invite = await ctx.db
      .query('invitations')
      .withIndex('by_code', (q) => q.eq('code', code))
      .unique()
    if (!invite) throw new Error('Invalid invite')
    if (invite.expiresAt < Date.now()) throw new Error('Invite expired')

    const existing = await ctx.db
      .query('members')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first()

    if (!existing) {
      await ctx.db.insert('members', {
        userId: user._id,
        role: invite.role,
      })
    }
    await ctx.db.patch(invite._id, {
      acceptedAt: Date.now(),
      acceptedUserId: user._id,
    })
    return null
  },
})

export const updateRole = adminMutation({
  args: {
    userId: v.string(),
    role: v.union(v.literal('owner'), v.literal('admin'), v.literal('member'), v.literal('viewer')),
  },
  handler: async (ctx, { userId, role }) => {
    const membership = await ctx.db
      .query('members')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()
    if (!membership) throw new Error('Member not found')

    // Prevent changing owner role
    if (membership.role === 'owner') {
      throw new Error('Cannot change owner role')
    }

    await ctx.db.patch(membership._id, { role })
    return null
  },
})

export const removeMember = adminMutation({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, { userId }) => {
    const membership = await ctx.db
      .query('members')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()
    if (!membership) {
      throw new Error('Member not found')
    }

    // Prevent removing owner
    if (membership.role === 'owner') {
      throw new Error('Cannot remove owner')
    }

    await ctx.db.delete(membership._id)
    return null
  },
})

export const addMember = adminMutation({
  args: {
    userId: v.string(),
    role: v.union(v.literal('admin'), v.literal('member'), v.literal('viewer')),
  },
  returns: v.null(),
  handler: async (ctx, { userId, role }) => {
    // Check if user is already a member
    const existing = await ctx.db
      .query('members')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (existing) {
      throw new Error('User is already a member')
    }

    await ctx.db.insert('members', {
      userId,
      role,
    })
    return null
  },
})
