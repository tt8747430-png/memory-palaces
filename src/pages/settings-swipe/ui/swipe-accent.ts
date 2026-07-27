import { SWIPE_ACCENT, SWIPE_ACTION_META, type SwipeActionId } from '@/shared/config/swipe'

export const accentOf = (id: SwipeActionId) => SWIPE_ACCENT[SWIPE_ACTION_META[id].accent]
