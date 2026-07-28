import type { ReactNode } from 'react'
import {
  Archive,
  Copy,
  Flag,
  FolderInput,
  FolderMinus,
  FolderPlus,
  GraduationCap,
  Heart,
  type LucideIcon,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
} from 'lucide-react'
import type { ActionId } from '@/shared/config/actions'

const ACTION_ICON: Record<ActionId, LucideIcon> = {
  favorite: Heart,
  move: FolderInput,
  archive: Archive,
  unfile: FolderMinus,
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

/** Renders an action's icon; the surface picks the size via `className`. */
export function actionIcon(id: ActionId, className = 'size-5'): ReactNode {
  const Icon = ACTION_ICON[id]
  return <Icon className={className} aria-hidden />
}
