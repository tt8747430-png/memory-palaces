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
} from 'lucide-angular'
import type { LucideIconData } from 'lucide-angular'
import type { SelectActionId } from '@app/shared/config/select-toolbar'

const SELECT_ACTION_ICON: Record<SelectActionId, LucideIconData> = {
  move: FolderInput,
  favorite: Heart,
  duplicate: Copy,
  archive: Archive,
  unfile: FolderMinus,
  flag: Flag,
  known: GraduationCap,
  reset: RotateCcw,
  delete: Trash2,
}

/** The one icon each select action wears — in the bar and in its settings editor. */
export function selectActionIcon(id: SelectActionId): LucideIconData {
  return SELECT_ACTION_ICON[id]
}

export interface SelectActionHandler {
  onAction: () => void
  /** The action exists here but can't run on what is currently selected. */
  disabled?: boolean
}

export type SelectActionHandlers = Partial<Record<SelectActionId, SelectActionHandler>>
