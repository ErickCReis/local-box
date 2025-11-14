// Comprehensive color palette for tags, organized by color families
export const TAG_COLORS = {
  // Greens
  green: [
    '#10B981', // emerald-500
    '#059669', // emerald-600
    '#34D399', // emerald-400
    '#6EE7B7', // emerald-300
    '#A7F3D0', // emerald-200
    '#22C55E', // green-500
    '#16A34A', // green-600
    '#4ADE80', // green-400
  ],
  // Blues
  blue: [
    '#3B82F6', // blue-500
    '#2563EB', // blue-600
    '#60A5FA', // blue-400
    '#93C5FD', // blue-300
    '#06B6D4', // cyan-500
    '#0891B2', // cyan-600
    '#22D3EE', // cyan-400
    '#67E8F9', // cyan-300
  ],
  // Purples & Violets
  purple: [
    '#8B5CF6', // violet-500
    '#7C3AED', // violet-600
    '#A78BFA', // violet-400
    '#C4B5FD', // violet-300
    '#A855F7', // purple-500
    '#9333EA', // purple-600
    '#C084FC', // purple-400
    '#D8B4FE', // purple-300
  ],
  // Pinks & Roses
  pink: [
    '#EC4899', // pink-500
    '#DB2777', // pink-600
    '#F472B6', // pink-400
    '#F9A8D4', // pink-300
    '#F43F5E', // rose-500
    '#E11D48', // rose-600
    '#FB7185', // rose-400
    '#FDA4AF', // rose-300
  ],
  // Oranges & Ambers
  orange: [
    '#F59E0B', // amber-500
    '#D97706', // amber-600
    '#FBBF24', // amber-400
    '#FCD34D', // amber-300
    '#F97316', // orange-500
    '#EA580C', // orange-600
    '#FB923C', // orange-400
    '#FDBA74', // orange-300
  ],
  // Reds
  red: [
    '#EF4444', // red-500
    '#DC2626', // red-600
    '#F87171', // red-400
    '#FCA5A5', // red-300
  ],
  // Yellows
  yellow: [
    '#EAB308', // yellow-500
    '#CA8A04', // yellow-600
    '#FACC15', // yellow-400
    '#FDE047', // yellow-300
    '#A3E635', // lime-500
    '#84CC16', // lime-600
    '#BEF264', // lime-400
    '#D9F99D', // lime-300
  ],
  // Grays & Neutrals
  gray: [
    '#6B7280', // gray-500
    '#4B5563', // gray-600
    '#9CA3AF', // gray-400
    '#D1D5DB', // gray-300
    '#374151', // gray-700
    '#1F2937', // gray-800
  ],
} as const

// Flattened array of all colors for easy iteration
export const ALL_TAG_COLORS = Object.values(TAG_COLORS).flat()

// Color names for better UX (optional, for display)
export const COLOR_NAMES: Record<string, string> = {
  // Greens
  '#10B981': 'Emerald',
  '#059669': 'Dark Emerald',
  '#34D399': 'Light Emerald',
  '#6EE7B7': 'Pale Emerald',
  '#A7F3D0': 'Mint',
  '#22C55E': 'Green',
  '#16A34A': 'Dark Green',
  '#4ADE80': 'Light Green',
  // Blues
  '#3B82F6': 'Blue',
  '#2563EB': 'Dark Blue',
  '#60A5FA': 'Light Blue',
  '#93C5FD': 'Sky Blue',
  '#06B6D4': 'Cyan',
  '#0891B2': 'Dark Cyan',
  '#22D3EE': 'Light Cyan',
  '#67E8F9': 'Pale Cyan',
  // Purples
  '#8B5CF6': 'Violet',
  '#7C3AED': 'Dark Violet',
  '#A78BFA': 'Light Violet',
  '#C4B5FD': 'Lavender',
  '#A855F7': 'Purple',
  '#9333EA': 'Dark Purple',
  '#C084FC': 'Light Purple',
  '#D8B4FE': 'Lilac',
  // Pinks
  '#EC4899': 'Pink',
  '#DB2777': 'Dark Pink',
  '#F472B6': 'Light Pink',
  '#F9A8D4': 'Rose',
  '#F43F5E': 'Rose Red',
  '#E11D48': 'Dark Rose',
  '#FB7185': 'Light Rose',
  '#FDA4AF': 'Blush',
  // Oranges
  '#F59E0B': 'Amber',
  '#D97706': 'Dark Amber',
  '#FBBF24': 'Light Amber',
  '#FCD34D': 'Gold',
  '#F97316': 'Orange',
  '#EA580C': 'Dark Orange',
  '#FB923C': 'Light Orange',
  '#FDBA74': 'Peach',
  // Reds
  '#EF4444': 'Red',
  '#DC2626': 'Dark Red',
  '#F87171': 'Light Red',
  '#FCA5A5': 'Coral',
  // Yellows
  '#EAB308': 'Yellow',
  '#CA8A04': 'Dark Yellow',
  '#FACC15': 'Light Yellow',
  '#FDE047': 'Pale Yellow',
  '#A3E635': 'Lime',
  '#84CC16': 'Dark Lime',
  '#BEF264': 'Light Lime',
  '#D9F99D': 'Pale Lime',
  // Grays
  '#6B7280': 'Gray',
  '#4B5563': 'Dark Gray',
  '#9CA3AF': 'Light Gray',
  '#D1D5DB': 'Silver',
  '#374151': 'Charcoal',
  '#1F2937': 'Dark Charcoal',
}

// Helper to get color name
export function getColorName(hex: string): string {
  return COLOR_NAMES[hex] || hex
}

// Helper to validate hex color
export function isValidHexColor(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)
}

/**
 * Generates a deterministic color for a tag name using djb2 hash algorithm.
 * Same tag name will always get the same color.
 * Uses ALL_TAG_COLORS palette.
 */
export function colorForTagName(name: string): string {
  let hash = 5381
  for (const ch of name) {
    hash = (hash * 33) ^ ch.charCodeAt(0)
  }
  return ALL_TAG_COLORS[Math.abs(hash) % ALL_TAG_COLORS.length]
}
