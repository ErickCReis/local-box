import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('tags'),
      _creationTime: v.number(),
      name: v.string(),
      color: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const tags = await ctx.db.query('tags').collect()
    return tags
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
  },
  returns: v.id('tags'),
  handler: async (ctx, args) => {
    // Prevent duplicate names globally
    const existing = await ctx.db
      .query('tags')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .unique()
      .catch(() => null)
    if (existing) {
      throw new Error('Tag already exists')
    }
    const id = await ctx.db.insert('tags', {
      name: args.name,
      color: args.color,
    })
    return id
  },
})

export const rename = mutation({
  args: {
    tagId: v.id('tags'),
    name: v.string(),
    color: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tag = await ctx.db.get(args.tagId)
    if (!tag) return null
    // Soft global uniqueness check
    const dup = await ctx.db
      .query('tags')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .unique()
      .catch(() => null)
    if (dup && dup._id !== args.tagId) {
      throw new Error('Another tag with this name already exists')
    }
    await ctx.db.patch(args.tagId, {
      name: args.name,
      color: args.color,
    })
    return null
  },
})

export const remove = mutation({
  args: { tagId: v.id('tags') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tag = await ctx.db.get(args.tagId)
    if (!tag) return null

    // Delete mappings referring to this tag
    const mappings = await ctx.db
      .query('fileTags')
      .withIndex('by_tag', (q) => q.eq('tagId', args.tagId))
      .collect()
    for (const m of mappings) {
      await ctx.db.delete(m._id)
    }

    await ctx.db.delete(args.tagId)
    return null
  },
})
