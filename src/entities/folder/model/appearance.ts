/**
 * Folder appearance presets — the emoji a folder can wear. Colour presets are shared with
 * palaces (chosen at the page edge), but the emoji set is folder-domain knowledge: it
 * leads with grouping metaphors (shelves, books, subjects) so a folder reads as "a place
 * my palaces live" rather than a palace itself. Kept here so every folder surface (the
 * collection rail, the move sheet, the editor) renders identical options and never drifts.
 */
export const FOLDER_ICON_OPTIONS = [
  '🗂️', '📁', '📚', '🎓', '🧠', '💡',
  '🌍', '⭐', '🔖', '🧩', '⚗️', '🎨',
  '🎵', '⚽', '✝️', '💼', '🍎', '✈️',
] as const

export const DEFAULT_FOLDER_ICON = '🗂️'
