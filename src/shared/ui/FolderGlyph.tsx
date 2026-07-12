import { cn } from '@/shared/lib'
import { DeckCover } from './DeckCover'

export interface FolderGlyphProps {
  color: string
  icon: string
  className?: string
  iconClassName?: string
}

const FALLBACK_FOLDER_COLOR = 'from-sky-500 to-blue-600'

export function FolderGlyph({ color, icon, className, iconClassName }: FolderGlyphProps) {
  return (
    <DeckCover
      icon={icon}
      color={color || FALLBACK_FOLDER_COLOR}
      variant="identity"
      className={cn('shrink-0 rounded-card ring-1 ring-black/10', className)}
      iconClassName={iconClassName}
    />
  )
}
