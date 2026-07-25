import { type Deck, DECK_COLOR_OPTIONS, DEFAULT_DECK_COLOR } from '@/entities/deck'

/** Row geometry, shared by the live row and the card in hand, so a dropped card lands on its own
 *  footprint instead of morphing into a differently-shaped one. */
export const DECK_ROW_FRAME = 'flex items-center gap-1.5 rounded-card py-2 pl-1.5 pr-2'

/** Row geometry shared by the live folder row and the card in hand. */
export const FOLDER_ROW_FRAME = 'flex w-full items-center gap-3.5 rounded-card py-2.5 pl-2.5 pr-2'

export const TOGGLE_BASE = 'grid shrink-0 place-items-center rounded-full ring-1 transition-colors'

export const toggleFrame = (isSub: boolean): string => (isSub ? 'size-6' : 'size-7')

export const toggleSurface = (isOpen: boolean): string =>
  isOpen
    ? 'bg-primary/10 text-primary ring-primary/15'
    : 'bg-info-surface text-primary ring-primary/10'

/** A deck with no colour of its own still gets a stable one, derived from its id. */
export function deckColor(deck: Deck): string {
  if (deck.color) return deck.color
  let hash = 0
  for (let i = 0; i < deck.id.length; i++) hash = (hash * 31 + deck.id.charCodeAt(i)) | 0
  return DECK_COLOR_OPTIONS[Math.abs(hash) % DECK_COLOR_OPTIONS.length]?.value ?? DEFAULT_DECK_COLOR
}
