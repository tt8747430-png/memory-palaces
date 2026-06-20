/**
 * Palace appearance presets — the icon and colour choices a palace can wear. They live
 * in the entity (palace-domain knowledge) so the create sheet and, later, the palace
 * settings screen render identical options and never drift.
 *
 * The colour values are Tailwind gradient class pairs; {@link PalaceCover} renders them
 * (or a custom hex). They lead with the cool, daylight-adjacent hues per the brand, with
 * a few warmer identities so palaces stay easy to tell apart at a glance.
 */
export const PALACE_ICON_OPTIONS = [
  '🏛️', '🌌', '🌍', '🫀', '⚗️', '💻', '📚', '🎨', '🎭', '🎵',
  '⚽', '🏀', '🎯', '🎲', '🎪', '🎬', '📷', '🎤', '🎧', '🎸',
  '🌸', '🌺', '🌻', '🌹', '🌷', '🍎', '🍊', '🍋', '🍇', '🗺️',
] as const

export interface PalaceColorOption {
  /** Translation key suffix under `palaces.colors`, e.g. `skyBlue`. */
  id: string
  /** Tailwind gradient class pair consumed by `PalaceCover`. */
  value: string
}

export const PALACE_COLOR_OPTIONS: readonly PalaceColorOption[] = [
  { id: 'skyBlue', value: 'from-sky-500 to-blue-600' },
  { id: 'ocean', value: 'from-blue-600 to-indigo-700' },
  { id: 'teal', value: 'from-teal-500 to-emerald-600' },
  { id: 'emerald', value: 'from-emerald-500 to-green-600' },
  { id: 'lime', value: 'from-lime-500 to-emerald-600' },
  { id: 'gold', value: 'from-yellow-500 to-amber-600' },
  { id: 'amber', value: 'from-amber-500 to-orange-600' },
  { id: 'coral', value: 'from-orange-500 to-rose-600' },
  { id: 'rose', value: 'from-rose-500 to-pink-600' },
  { id: 'graphite', value: 'from-slate-500 to-slate-700' },
]

export const DEFAULT_PALACE_ICON = '🏛️'
export const DEFAULT_PALACE_COLOR = 'from-sky-500 to-blue-600'
