import {
  Archive,
  Copy,
  Flag,
  FolderInput,
  FolderPlus,
  GraduationCap,
  Heart,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
} from 'lucide-angular'
import type { LucideIconData } from 'lucide-angular'
import { SWIPE_ACTION_META } from '@app/shared/config/swipe'
import type { SwipeActionId, SwipeConfig } from '@app/shared/config/swipe'
import type { SwipeAction } from './swipe-row'

const SWIPE_ACTION_ICON: Record<SwipeActionId, LucideIconData> = {
  favorite: Heart,
  move: FolderInput,
  archive: Archive,
  settings: Settings,
  edit: Pencil,
  addSubdeck: Plus,
  addDeck: FolderPlus,
  duplicate: Copy,
  reset: RotateCcw,
  flag: Flag,
  known: GraduationCap,
  delete: Trash2,
}

export function swipeActionIcon(id: SwipeActionId): LucideIconData {
  return SWIPE_ACTION_ICON[id]
}

/** Per-action wiring: the handler to run, plus optional label-key / icon overrides
 *  (e.g. favorite ↔ unfavorite on the same slot). Actions in the user's config
 *  without a handler are dropped — the surface simply doesn't offer them. */
export type SwipeActionHandlers = Partial<
  Record<
    SwipeActionId,
    {
      onAction: () => void
      labelKey?: string
      icon?: LucideIconData
    }
  >
>

export function buildSwipeActions(
  config: SwipeConfig,
  handlers: SwipeActionHandlers,
): { leading: SwipeAction[]; trailing: SwipeAction[] } {
  const resolve = (ids: SwipeActionId[]): SwipeAction[] =>
    ids.flatMap((id) => {
      const handler = handlers[id]
      if (!handler) return []
      const meta = SWIPE_ACTION_META[id]
      return [
        {
          id,
          icon: handler.icon ?? SWIPE_ACTION_ICON[id],
          labelKey: handler.labelKey ?? meta.labelKey,
          accent: meta.accent,
          onAction: handler.onAction,
        },
      ]
    })
  return { leading: resolve(config.leading), trailing: resolve(config.trailing) }
}
