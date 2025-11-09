import { v } from 'convex/values'
import { action, mutation, query } from './_generated/server'
import type { Id } from './_generated/dataModel'

export const generateUploadUrl = action({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const url = await ctx.storage.generateUploadUrl()
    return url
  },
})

export const saveUploadedFile = mutation({
  args: {
    storageId: v.id('_storage'),
    filename: v.string(),
    contentType: v.optional(v.string()),
    size: v.number(),
    tagIds: v.optional(v.array(v.id('tags'))),
    uploaderUserId: v.optional(v.string()),
  },
  returns: v.id('files'),
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert('files', {
      storageId: args.storageId,
      filename: args.filename,
      contentType: args.contentType,
      size: args.size,
      uploaderUserId: args.uploaderUserId,
    })

    if (args.tagIds && args.tagIds.length > 0) {
      for (const tagId of args.tagIds) {
        await ctx.db.insert('fileTags', {
          fileId,
          tagId,
        })
      }
    }

    return fileId
  },
})

export const list = query({
  args: {
    tagId: v.optional(v.id('tags')),
  },
  returns: v.array(
    v.object({
      file: v.object({
        _id: v.id('files'),
        _creationTime: v.number(),
        filename: v.string(),
        contentType: v.optional(v.string()),
        size: v.number(),
        uploaderUserId: v.optional(v.string()),
      }),
      tags: v.array(
        v.object({
          _id: v.id('tags'),
          _creationTime: v.number(),
          name: v.string(),
          color: v.optional(v.string()),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    // Helper to load tags for a file
    const loadTagsForFile = async (fileId: Id<'files'>) => {
      const mappings = await ctx.db
        .query('fileTags')
        .withIndex('by_file', (q) => q.eq('fileId', fileId))
        .collect()
      const tags = []
      for (const mapping of mappings) {
        const tag = await ctx.db.get(mapping.tagId)
        if (tag) {
          tags.push(tag)
        }
      }
      return tags
    }

    // Load files (optionally filtered by a tag)
    const files =
      args.tagId != null
        ? await (async () => {
            const byTag = await ctx.db
              .query('fileTags')
              .withIndex('by_tag', (q) => q.eq('tagId', args.tagId!))
              .collect()
            const results = []
            for (const ft of byTag) {
              const file = await ctx.db.get(ft.fileId)
              if (file) {
                results.push(file)
              }
            }
            return results
          })()
        : await ctx.db.query('files').collect()

    const result = []
    for (const file of files) {
      const tags = await loadTagsForFile(file._id)
      result.push({
        file: {
          _id: file._id,
          _creationTime: file._creationTime,
          filename: file.filename,
          contentType: file.contentType,
          size: file.size,
          uploaderUserId: file.uploaderUserId ?? undefined,
        },
        tags: tags.map((t) => ({
          _id: t._id,
          _creationTime: t._creationTime,
          name: t.name,
          color: t.color ?? undefined,
        })),
      })
    }
    return result
  },
})

export const getDownloadUrl = query({
  args: { fileId: v.id('files') },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId)
    if (!file) return null
    const url = await ctx.storage.getUrl(file.storageId)
    return url
  },
})

export const remove = mutation({
  args: { fileId: v.id('files') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId)
    if (!file) return null

    // Delete tag mappings
    const mappings = await ctx.db
      .query('fileTags')
      .withIndex('by_file', (q) => q.eq('fileId', args.fileId))
      .collect()
    for (const mapping of mappings) {
      await ctx.db.delete(mapping._id)
    }

    // Delete storage blob
    await ctx.storage.delete(file.storageId)
    // Delete file record
    await ctx.db.delete(args.fileId)
    return null
  },
})

export const setTags = mutation({
  args: {
    fileId: v.id('files'),
    tagIds: v.array(v.id('tags')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId)
    if (!file) return null

    const existing = await ctx.db
      .query('fileTags')
      .withIndex('by_file', (q) => q.eq('fileId', args.fileId))
      .collect()

    const existingSet = new Set(existing.map((m) => m.tagId))
    const nextSet = new Set(args.tagIds)

    // Remove mappings not in nextSet
    for (const m of existing) {
      if (!nextSet.has(m.tagId)) {
        await ctx.db.delete(m._id)
      }
    }
    // Add mappings missing from existingSet
    for (const tagId of nextSet) {
      if (!existingSet.has(tagId)) {
        await ctx.db.insert('fileTags', {
          fileId: args.fileId,
          tagId,
        })
      }
    }
    return null
  },
})
