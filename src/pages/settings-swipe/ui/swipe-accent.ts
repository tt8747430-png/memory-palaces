import { SWIPE_ACCENT, SWIPE_ACTION_META, type SwipeActionId } from '@/shared/config/swipe'

/**
 * Resolved accent for a swipe action — the shared source of truth for its solid fill (preview
 * caps) and its tinted chip (`--sw` custom property).
 */
export const accentOf = (id: SwipeActionId) => SWIPE_ACCENT[SWIPE_ACTION_META[id].accent]
