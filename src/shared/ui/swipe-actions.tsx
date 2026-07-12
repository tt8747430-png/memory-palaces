import type { ReactNode } from 'react'
import type { TFunction } from 'i18next'
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
  Settings2,
  Trash2,
} from 'lucide-react'
import { SWIPE_ACTION_META, type SwipeActionId, type SwipeConfig } from '@/shared/config/swipe'
import type { SwipeAction } from './SwipeRow'

const SWIPE_ACTION_ICON: Record<SwipeActionId, ReactNode> = {
  favorite: <Heart className="size-5" aria-hidden />,
  move: <FolderInput className="size-5" aria-hidden />,
  archive: <Archive className="size-5" aria-hidden />,
  settings: <Settings2 className="size-5" aria-hidden />,
  edit: <Pencil className="size-5" aria-hidden />,
  addSubdeck: <Plus className="size-5" aria-hidden />,
  addDeck: <FolderPlus className="size-5" aria-hidden />,
  duplicate: <Copy className="size-5" aria-hidden />,
  reset: <RotateCcw className="size-5" aria-hidden />,
  flag: <Flag className="size-5" aria-hidden />,
  known: <GraduationCap className="size-5" aria-hidden />,
  delete: <Trash2 className="size-5" aria-hidden />,
}

export function swipeActionIcon(id: SwipeActionId): ReactNode {
  return SWIPE_ACTION_ICON[id]
}

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
          label: handler.label ?? t(meta.labelKey as never),
          accent: meta.accent,
          onAction: handler.onAction,
        },
      ]
    })
  return { leading: resolve(config.leading), trailing: resolve(config.trailing) }
}
