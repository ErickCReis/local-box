import { v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'
import { getManyViaOrThrow } from 'convex-helpers/server/relationships'
import { action, mutation, query } from './_generated/server'
import type { Id } from './_generated/dataModel'

export const generateUploadUrl = action({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
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
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert('files', {
      storageId: args.storageId,
      filename: args.filename,
      contentType: args.contentType,
      size: args.size,
      uploaderUserId: args.uploaderUserId,
    })

    if (args.tagIds && args.tagIds.length > 0) {
      await Promise.all(
        args.tagIds.map((tagId) =>
          ctx.db.insert('fileTags', {
            fileId,
            tagId,
          }),
        ),
      )
    }

    return fileId
  },
})

export const list = query({
  args: {
    tagId: v.optional(v.id('tags')),
    tagIds: v.optional(v.array(v.id('tags'))),
  },
  handler: async (ctx, args) => {
    // Helper to load tags for a file
    const loadTagsForFile = async (fileId: Id<'files'>) => {
      // many-to-many via join table -> fetch tags for a given file
      const tags = await getManyViaOrThrow(
        ctx.db,
        'fileTags',
        'tagId',
        'by_file',
        fileId,
        'fileId',
      )
      return tags
    }

    // Load files (optionally filtered by one or more tags)
    let files
    if (args.tagIds && args.tagIds.length > 0) {
      // AND filter: intersect files across all provided tags
      const perTagFiles = await Promise.all(
        args.tagIds.map((tagId) =>
          getManyViaOrThrow(
            ctx.db,
            'fileTags',
            'fileId',
            'by_tag',
            tagId,
            'tagId',
          ),
        ),
      )
      const intersection = (() => {
        if (perTagFiles.length === 0) return []
        // Build intersection using sets of _id
        let set = new Set(perTagFiles[0].map((f) => f._id))
        for (let i = 1; i < perTagFiles.length; i++) {
          const next = new Set(perTagFiles[i].map((f) => f._id))
          set = new Set([...set].filter((id) => next.has(id)))
        }
        // Rehydrate in original doc form from the first array
        const firstById = new Map(perTagFiles[0].map((f) => [f._id, f]))
        return [...set].map((id) => firstById.get(id)!).filter(Boolean)
      })()
      files = intersection
    } else if (args.tagId != null) {
      // Files for a single tag using relationship helper
      files = await getManyViaOrThrow(
        ctx.db,
        'fileTags',
        'fileId',
        'by_tag',
        args.tagId,
        'tagId',
      )
    } else {
      files = await ctx.db.query('files').order('desc').collect()
    }

    const result = await Promise.all(
      files.map(async (file) => {
        const tags = await loadTagsForFile(file._id)
        return {
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
        }
      }),
    )
    return result
  },
})

export const listPage = query({
  args: {
    paginationOpts: paginationOptsValidator,
    tagId: v.optional(v.id('tags')),
    tagIds: v.optional(v.array(v.id('tags'))),
  },
  handler: async (ctx, args) => {
    const loadTagsForFile = async (fileId: Id<'files'>) => {
      const mappings = await ctx.db
        .query('fileTags')
        .withIndex('by_file', (q) => q.eq('fileId', fileId))
        .collect()
      const tags = await Promise.all(mappings.map((m) => ctx.db.get(m.tagId)))
      return tags.filter(Boolean)
    }

    // No filters: paginate files directly
    if (!args.tagId && !(args.tagIds && args.tagIds.length > 0)) {
      const pageResult = await ctx.db
        .query('files')
        .order('desc')
        .paginate(args.paginationOpts)
      const page = await Promise.all(
        pageResult.page.map(async (file) => {
          const tags = await loadTagsForFile(file._id)
          return { file, tags }
        }),
      )
      return {
        page,
        isDone: pageResult.isDone,
        continueCursor: pageResult.continueCursor,
      }
    }

    // Single tag filter: paginate fileTags by tag
    if (args.tagId && !(args.tagIds && args.tagIds.length > 0)) {
      const ftPage = await ctx.db
        .query('fileTags')
        .withIndex('by_tag', (q) => q.eq('tagId', args.tagId!))
        .paginate(args.paginationOpts)
      const files = (
        await Promise.all(ftPage.page.map((ft) => ctx.db.get(ft.fileId)))
      ).filter(Boolean)
      const page = await Promise.all(
        files.map(async (file) => {
          const tags = await loadTagsForFile(file._id)
          return { file, tags }
        }),
      )
      return {
        page,
        isDone: ftPage.isDone,
        continueCursor: ftPage.continueCursor,
      }
    }

    // AND across multiple tags: paginate over the first tag's fileTags and filter
    const tagIds = args.tagIds!
    const primaryTagId = tagIds[0]
    const ftPage = await ctx.db
      .query('fileTags')
      .withIndex('by_tag', (q) => q.eq('tagId', primaryTagId))
      .paginate(args.paginationOpts)

    // For each candidate file, verify it has all tagIds
    const candidateFiles = (
      await Promise.all(ftPage.page.map((ft) => ctx.db.get(ft.fileId)))
    ).filter(Boolean)

    const filtered = await Promise.all(
      candidateFiles.map(async (file) => {
        const mappings = await ctx.db
          .query('fileTags')
          .withIndex('by_file', (q) => q.eq('fileId', file._id))
          .collect()
        const fileTagIdSet = new Set(mappings.map((m) => m.tagId))
        const hasAll = tagIds.every((id) => fileTagIdSet.has(id))
        if (!hasAll) return null
        const tags = (
          await Promise.all(mappings.map((m) => ctx.db.get(m.tagId)))
        ).filter(Boolean)
        return { file, tags }
      }),
    )
    const page = filtered.filter(Boolean)
    return {
      page,
      isDone: ftPage.isDone,
      continueCursor: ftPage.continueCursor,
    }
  },
})

export const getDownloadUrl = query({
  args: { fileId: v.id('files') },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId)
    if (!file) return null
    const url = await ctx.storage.getUrl(file.storageId)
    return url
  },
})

export const remove = mutation({
  args: { fileId: v.id('files') },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId)
    if (!file) return null

    // Delete tag mappings
    const mappings = await ctx.db
      .query('fileTags')
      .withIndex('by_file', (q) => q.eq('fileId', args.fileId))
      .collect()
    await Promise.all(mappings.map((m) => ctx.db.delete(m._id)))

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
    await Promise.all(
      existing
        .filter((m) => !nextSet.has(m.tagId))
        .map((m) => ctx.db.delete(m._id)),
    )
    // Add mappings missing from existingSet
    const toInsert: Array<Id<'tags'>> = []
    for (const tagId of nextSet) {
      if (!existingSet.has(tagId)) toInsert.push(tagId)
    }
    await Promise.all(
      toInsert.map((tagId) =>
        ctx.db.insert('fileTags', {
          fileId: args.fileId,
          tagId,
        }),
      ),
    )
    return null
  },
})
