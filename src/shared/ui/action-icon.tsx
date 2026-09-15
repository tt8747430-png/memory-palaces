import type { ReactNode } from 'react'
import {
  Archive,
  ArrowLeftRight,
  CheckSquare,
  Copy,
  Flag,
  FolderInput,
  FolderMinus,
  FolderPlus,
  Gauge,
  GraduationCap,
  Heart,
  History,
  type LucideIcon,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Snowflake,
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
  select: CheckSquare,
  grade: Gauge,
  studyFrom: Play,
  freeze: Snowflake,
  reverse: ArrowLeftRight,
  history: History,
  delete: Trash2,
}

export function actionIcon(id: ActionId, className = 'size-5'): ReactNode {
  const Icon = ACTION_ICON[id]
  return <Icon className={className} aria-hidden />
}
