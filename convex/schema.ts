import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Global membership (no workspaces)
  members: defineTable({
    userId: v.string(), // better-auth user id
    role: v.union(v.literal('owner'), v.literal('admin'), v.literal('member')),
  }).index('by_user', ['userId']),
  // Global invitations (no workspaces)
  invitations: defineTable({
    code: v.string(), // unique short token
    role: v.union(v.literal('admin'), v.literal('member')),
    email: v.optional(v.string()),
    expiresAt: v.number(),
    createdBy: v.string(), // user id
    acceptedAt: v.optional(v.number()),
    acceptedUserId: v.optional(v.string()),
  })
    .index('by_code', ['code'])
    .index('by_created_by', ['createdBy'])
    .index('by_accepted_user', ['acceptedUserId']),
  // Tags are the only organization primitive (no folders), global
  tags: defineTable({
    name: v.string(),
    color: v.optional(v.string()),
    isSystem: v.optional(v.boolean()),
    category: v.optional(
      v.union(
        v.literal('file_type'),
        v.literal('size'),
        v.literal('owner'),
        v.literal('custom'),
      ),
    ),
  }).index('by_name', ['name']),
  // Files stored in Convex storage, global
  files: defineTable({
    storageId: v.id('_storage'),
    filename: v.string(),
    contentType: v.optional(v.string()),
    size: v.number(),
    uploaderUserId: v.optional(v.string()),
  }).index('by_uploader', ['uploaderUserId']),
  // Join table mapping files to tags (many-to-many), global
  fileTags: defineTable({
    fileId: v.id('files'),
    tagId: v.id('tags'),
  })
    .index('by_file', ['fileId'])
    .index('by_tag', ['tagId'])
    .index('by_file_and_tag', ['fileId', 'tagId'])
    .index('by_tag_and_file', ['tagId', 'fileId']),
})
