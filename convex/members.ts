import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { api } from './_generated/api'

export const listMembers = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('members').collect()
    return rows.map((r) => ({ userId: r.userId, role: r.role }))
  },
})

export const createInvite = mutation({
  args: {
    role: v.union(v.literal('admin'), v.literal('member')),
    email: v.optional(v.string()),
    ttlMinutes: v.optional(v.number()),
  },
  handler: async (ctx, { role, email, ttlMinutes }) => {
    const currentUser = await ctx.runQuery(api.auth.getCurrentUser)
    if (!currentUser) throw new Error('Not signed in')

    const code = Math.random().toString(36).slice(2, 10)
    const expiresAt = Date.now() + (ttlMinutes ?? 60) * 60_000

    await ctx.db.insert('invitations', {
      code,
      role,
      email,
      expiresAt,
      createdBy: currentUser._id,
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

export const updateRole = mutation({
  args: {
    userId: v.string(),
    role: v.union(v.literal('owner'), v.literal('admin'), v.literal('member')),
  },
  handler: async (ctx, { userId, role }) => {
    const membership = await ctx.db
      .query('members')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()
    if (!membership) throw new Error('Member not found')
    await ctx.db.patch(membership._id, { role })
    return null
  },
})

export const removeMember = mutation({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, { userId }) => {
    const membership = await ctx.db
      .query('members')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()
    if (membership) {
      await ctx.db.delete(membership._id)
    }
    return null
  },
})
