import { type ReactNode } from 'react'
import {
  Archive,
  Copy,
  Flag,
  FolderInput,
  FolderMinus,
  GraduationCap,
  Heart,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import type { SelectActionId } from '@/shared/config/select-toolbar'

const SELECT_ACTION_ICON: Record<SelectActionId, ReactNode> = {
  move: <FolderInput className="size-[18px]" aria-hidden />,
  favorite: <Heart className="size-[18px]" aria-hidden />,
  duplicate: <Copy className="size-[18px]" aria-hidden />,
  archive: <Archive className="size-[18px]" aria-hidden />,
  unfile: <FolderMinus className="size-[18px]" aria-hidden />,
  flag: <Flag className="size-[18px]" aria-hidden />,
  known: <GraduationCap className="size-[18px]" aria-hidden />,
  reset: <RotateCcw className="size-[18px]" aria-hidden />,
  delete: <Trash2 className="size-[18px]" aria-hidden />,
}

/** The one icon each select action wears — in the bar and in its settings editor. */
export function selectActionIcon(id: SelectActionId): ReactNode {
  return SELECT_ACTION_ICON[id]
}

export interface SelectActionHandler {
  onAction: () => void
  /** The action exists here but can't run on what is currently selected. */
  disabled?: boolean
}

export type SelectActionHandlers = Partial<Record<SelectActionId, SelectActionHandler>>
