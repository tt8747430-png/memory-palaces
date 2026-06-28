import type { ReactNode } from 'react'
import type { TFunction } from 'i18next'
import {
  Archive,
  Copy,
  FolderInput,
  GraduationCap,
  Heart,
  Pencil,
  RotateCcw,
  Settings2,
  Trash2,
  Flag,
} from 'lucide-react'
import {
  type SwipeActionId,
  SWIPE_ACTION_META,
  type SwipeConfig,
} from '@/shared/config/swipe'
import type { SwipeAction } from './SwipeRow'

/** Glyph per action id; sized to sit in a swipe-tray button. */
const SWIPE_ACTION_ICON: Record<SwipeActionId, ReactNode> = {
  favorite: <Heart className="size-5" aria-hidden />,
  move: <FolderInput className="size-5" aria-hidden />,
  archive: <Archive className="size-5" aria-hidden />,
  settings: <Settings2 className="size-5" aria-hidden />,
  edit: <Pencil className="size-5" aria-hidden />,
  duplicate: <Copy className="size-5" aria-hidden />,
  reset: <RotateCcw className="size-5" aria-hidden />,
  flag: <Flag className="size-5" aria-hidden />,
  known: <GraduationCap className="size-5" aria-hidden />,
  delete: <Trash2 className="size-5" aria-hidden />,
}

/** The glyph for an action id — for the swipe-settings chips and any host that renders an
 * action outside a tray. */
export function swipeActionIcon(id: SwipeActionId): ReactNode {
  return SWIPE_ACTION_ICON[id]
}

/** A handler per action the host supports; an id with no handler is dropped from the tray
 * (so a stale config can't bind a button to nothing). The optional label/icon overrides let
 * a host reflect item state (e.g. "favorite" ↔ "unfavorite"). */
export type SwipeActionHandlers = Partial<
  Record<
    SwipeActionId,
    {
      onAction: () => void
      label?: string
      icon?: ReactNode
    }
  >
>

/** Resolve a stored {@link SwipeConfig} into the row's two action trays, binding each id to
 * its glyph, label, tone (from the shared catalog) and the host's handler. */
export function buildSwipeActions(
  config: SwipeConfig,
  handlers: SwipeActionHandlers,
  t: TFunction,
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
          // The catalog key is a plain string; the typed `t` accepts only literals, so this
          // documented bridge is the single place the dynamic key crosses over.
          label: handler.label ?? t(meta.labelKey as never),
          tone: meta.tone,
          onAction: handler.onAction,
        },
      ]
    })
  return { leading: resolve(config.leading), trailing: resolve(config.trailing) }
}
