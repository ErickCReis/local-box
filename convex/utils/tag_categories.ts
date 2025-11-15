/**
 * Valid size range tag names
 */
export const SIZE_RANGE_TAGS = [
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
  'Very Large',
] as const

/**
 * Get all valid size range tag names
 */
export function getSizeRangeTags(): ReadonlyArray<string> {
  return SIZE_RANGE_TAGS
}

/**
 * Determine the category of a tag based on its name and system status
 */
export function determineTagCategory(
  tagName: string,
  isSystem: boolean,
): 'file_type' | 'size' | 'owner' | 'custom' {
  // Custom tags are always non-system tags
  if (!isSystem) {
    return 'custom'
  }

  // Size tags match the size range names
  if (SIZE_RANGE_TAGS.includes(tagName as any)) {
    return 'size'
  }

  // Owner tags contain "@" or are truncated emails (exactly 10 characters)
  // Truncated emails are first 10 characters from truncateEmail function
  // If it contains @, it's definitely an owner tag
  // If it's exactly 10 characters and doesn't match file_type pattern, it might be a truncated email
  if (tagName.includes('@')) {
    return 'owner'
  }
  // Truncated emails are exactly 10 characters (from truncateEmail function)
  // This is a heuristic - if it's 10 chars, system tag, and not a size tag, likely owner
  if (tagName.length === 10 && !SIZE_RANGE_TAGS.includes(tagName as any)) {
    return 'owner'
  }

  // File type tags are system tags that are short lowercase strings (extensions)
  // Typically 1-5 characters, all lowercase, no spaces
  if (
    tagName.length <= 5 &&
    tagName === tagName.toLowerCase() &&
    !tagName.includes(' ') &&
    /^[a-z0-9]+$/.test(tagName)
  ) {
    return 'file_type'
  }

  // Default to custom for any system tag that doesn't match above patterns
  // This handles edge cases
  return 'custom'
}
