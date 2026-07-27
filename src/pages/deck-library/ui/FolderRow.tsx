import { useTranslation } from 'react-i18next'
import type { Folder } from '@/entities/folder'
import { FOLDER_ROW_FRAME, FolderRowBody } from '@/widgets/deck-tree'
import { cn, useLongPress } from '@/shared/lib'
import type { SwipeConfig } from '@/shared/config/swipe'
import { buildSwipeActions, type SwipeActionHandlers, SwipeRow } from '@/shared/ui'

export interface FolderRowProps {
  folder: Folder
  deckCount: number
  onOpen: () => void
  onRequestSelect: () => void
  swipe: SwipeConfig
  swipeHandlers: SwipeActionHandlers
}

export function FolderRow({
  folder,
  deckCount,
  onOpen,
  onRequestSelect,
  swipe,
  swipeHandlers,
}: FolderRowProps) {
  const { t } = useTranslation()
  const longPress = useLongPress({ onLongPress: onRequestSelect, onTap: onOpen })
  const { leading, trailing } = buildSwipeActions(swipe, swipeHandlers, t)
  const swipeEnabled = leading.length > 0 || trailing.length > 0

  const row = (
    <div
      className={cn(
        FOLDER_ROW_FRAME,
        'relative bg-card shadow-card transition-[box-shadow,background-color]',
      )}
    >
      <button
        type="button"
        {...longPress}
        aria-label={t('folder.rowOpen', { name: folder.name })}
        className="absolute inset-0 rounded-card transition-colors active:bg-primary/[0.06]"
      />
      <FolderRowBody folder={folder} deckCount={deckCount} />
    </div>
  )

  return swipeEnabled ? (
    <SwipeRow leading={leading} trailing={trailing} bleed>
      {row}
    </SwipeRow>
  ) : (
    row
  )
}
