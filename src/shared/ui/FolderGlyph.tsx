import { cn } from '@/shared/lib'
import { DeckCover } from './DeckCover'

export interface FolderGlyphProps {
  color: string
  icon: string
  className?: string
  iconClassName?: string
}

/** A folder's identity rendered as an emoji-on-colour tile — the same cover language palaces
 * use, so a folder reads as "a place my palaces live". One renderer, shared by the library
 * grid, the move sheet, and the folder editor, so the glyph never drifts. */
export function FolderGlyph({ color, icon, className, iconClassName }: FolderGlyphProps) {
  return (
    <DeckCover
      icon={icon}
      color={color}
      variant="identity"
      className={cn('shrink-0 rounded-[7px] ring-1 ring-black/10', className)}
      iconClassName={iconClassName}
    />
  )
}
