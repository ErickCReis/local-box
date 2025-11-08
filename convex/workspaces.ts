import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { Id } from './_generated/dataModel'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('workspaces').collect()
  },
})

export const testQuery = query({
  args: {},
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(
      'j977bfnxsvme6cdnthddc363097v08te' as Id<'workspaces'>,
    )
    return workspace
  },
})

export const testMutation = mutation({
  args: {},
  handler: async (ctx, args) => {
    const workspace = await ctx.db.query('workspaces').first()

    if (!workspace) {
      return ctx.db.insert('workspaces', {
        name: 'Default Workspace',
        ownerId: Math.random().toString(),
      })
    }

    await ctx.db.patch(workspace._id, {
      ownerId: Math.random().toString(),
    })

    return workspace
  },
})
