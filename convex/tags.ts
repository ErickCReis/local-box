import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { colorForTagName } from '../src/lib/tag-colors'
import { internalMutation, mutation, query } from './_generated/server'
import { memberMutation, memberQuery } from './auth'
import { determineTagCategory, isSystemTagName } from './utils/tag_categories'

export const list = memberQuery({
  args: {},
  handler: async (ctx) => {
    const tags = await ctx.db
      .query('tags')
      .withIndex('by_name')
      .order('asc')
      .collect()
    return tags
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Prevent creating system tags manually
    if (isSystemTagName(args.name)) {
      throw new Error('System tags cannot be created manually')
    }
    // Prevent duplicate names globally
    const existing = await ctx.db
      .query('tags')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .unique()
      .catch(() => null)
    if (existing) {
      throw new Error('Tag already exists')
    }
    // User-created tags are always custom
    const id = await ctx.db.insert('tags', {
      name: args.name,
      color: args.color ?? colorForTagName(args.name),
      isSystem: false,
      category: 'custom',
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
  handler: async (ctx, args) => {
    const tag = await ctx.db.get(args.tagId)
    if (!tag) return null

    // Prevent renaming to system tag names (unless it's already a system tag)
    const isSystem = tag.isSystem
    if (!isSystem && isSystemTagName(args.name)) {
      throw new Error('Cannot rename tag to a system tag name')
    }

    // Soft global uniqueness check
    const dup = await ctx.db
      .query('tags')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .unique()
      .catch(() => null)
    if (dup && dup._id !== args.tagId) {
      throw new Error('Another tag with this name already exists')
    }
    // Recalculate category if tag is a system tag (category might change based on new name)
    const category = determineTagCategory(args.name, isSystem)
    await ctx.db.patch(args.tagId, {
      name: args.name,
      color: args.color,
      category,
    })
    return null
  },
})

export const remove = memberMutation({
  args: { tagId: v.id('tags') },
  handler: async (ctx, args) => {
    const tag = await ctx.db.get(args.tagId)
    if (!tag) return null

    // Delete mappings referring to this tag
    const mappings = await ctx.db
      .query('fileTags')
      .withIndex('by_tag', (q) => q.eq('tagId', args.tagId))
      .collect()
    await Promise.all(mappings.map((m) => ctx.db.delete(m._id)))

    await ctx.db.delete(args.tagId)
    return null
  },
})

export const listPage = memberQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query('tags')
      .withIndex('by_name')
      .order('asc')
      .paginate(args.paginationOpts)
    return {
      page: result.page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    }
  },
})

/**
 * Internal mutation to categorize all existing tags that don't have a category.
 * This is a one-time migration function that can be called to update existing tags.
 */
export const categorizeAllTags = internalMutation({
  args: {},
  returns: v.object({
    updated: v.number(),
  }),
  handler: async (ctx) => {
    const allTags = await ctx.db.query('tags').collect()
    let updated = 0

    for (const tag of allTags) {
      const isSystem = tag.isSystem
      const category = determineTagCategory(tag.name, isSystem)
      await ctx.db.patch(tag._id, { category })
      updated++
    }

    return { updated }
  },
})
