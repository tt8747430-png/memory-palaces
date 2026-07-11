/**
 * Deck appearance presets — the icon and colour choices a deck can wear. They live in the
 * entity (deck-domain knowledge) so the create sheet and the deck settings screen render
 * identical options and never drift.
 *
 * The colour values are Tailwind gradient class pairs; {@link PalaceCover} renders them (or a
 * custom hex), leading with cool, daylight-adjacent hues per the brand.
 */
export const DECK_ICON_OPTIONS = [
  '🗂️',
  '📚',
  '📖',
  '📝',
  '🧠',
  '💡',
  '🔤',
  '🔢',
  '🌍',
  '🫀',
  '⚗️',
  '💻',
  '🎨',
  '🎭',
  '🎵',
  '⚽',
  '🏀',
  '🎯',
  '🎲',
  '🎬',
  '📷',
  '🎤',
  '🎸',
  '🌸',
  '🌻',
  '🌹',
  '🍎',
  '🍊',
  '🍇',
  '🗺️',
] as const

export interface DeckColorOption {
  /** Translation key suffix under `decks.colors`, e.g. `skyBlue`. */
  id: string
  /** Tailwind gradient class pair consumed by `PalaceCover`. */
  value: string
}

export const DECK_COLOR_OPTIONS: readonly DeckColorOption[] = [
  { id: 'skyBlue', value: 'from-sky-500 to-blue-600' },
  { id: 'ocean', value: 'from-blue-600 to-indigo-700' },
  { id: 'teal', value: 'from-teal-500 to-emerald-600' },
  { id: 'emerald', value: 'from-emerald-500 to-green-600' },
  { id: 'gold', value: 'from-yellow-500 to-amber-600' },
  { id: 'rose', value: 'from-rose-500 to-pink-600' },
]

export const DEFAULT_DECK_ICON = '🗂️'
export const DEFAULT_DECK_COLOR = 'from-sky-500 to-blue-600'
