/** Sample values the kitchen-sink sections share. */
import { DECK_COLOR_OPTIONS } from '@/entities/deck'

export const FIRST_COLOR = DECK_COLOR_OPTIONS[0]?.value ?? ''
export const MID_COLOR = DECK_COLOR_OPTIONS[Math.floor(DECK_COLOR_OPTIONS.length / 2)]?.value ?? ''
export const LAST_COLOR = DECK_COLOR_OPTIONS[DECK_COLOR_OPTIONS.length - 1]?.value ?? ''
export const LONG_TEXT =
  'Neuroanatomy — cranial nerves, brainstem nuclei & their clinical syndromes'
