import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  userProfiles: defineTable({
    userId: v.string(), // better-auth user ID
    role: v.union(v.literal('owner'), v.literal('admin'), v.literal('member')),
  }).index('by_user', ['userId']),
  workspaces: defineTable({
    name: v.string(),
    ownerId: v.string(),
  }),
})
