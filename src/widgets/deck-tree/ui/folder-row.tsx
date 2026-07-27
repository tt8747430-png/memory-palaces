import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { ChevronRight, Layers } from 'lucide-react'
import { DEFAULT_FOLDER_ICON, type Folder } from '@/entities/folder'
import { cn } from '@/shared/lib'
import { FolderGlyph, SelectDot } from '@/shared/ui'
import { FOLDER_ROW_FRAME } from './row-style'

export interface FolderRowBodyProps {
  folder: Folder
  deckCount: number
  selected?: boolean
  isDropTarget?: boolean
}

export function FolderRowBody({
  folder,
  deckCount,
  selected,
  isDropTarget = false,
}: FolderRowBodyProps) {
  const { t } = useTranslation()
  const selectMode = selected !== undefined

  return (
    <>
      {selectMode ? (
        <span className="pointer-events-none relative z-20 grid shrink-0 place-items-center">
          <SelectDot state={selected ? 'checked' : 'unchecked'} />
        </span>
      ) : null}

      <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-3.5">
        <motion.span
          className="relative size-12 shrink-0"
          animate={{ scale: isDropTarget ? 1.08 : 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 20 }}
        >
          <span
            aria-hidden
            className="absolute inset-0 translate-x-[5px] translate-y-[-5px] rounded-2xl bg-card shadow-rest ring-1 ring-border/40"
          />
          <span
            aria-hidden
            className="absolute inset-0 translate-x-[2.5px] translate-y-[-2.5px] rounded-2xl bg-card shadow-rest ring-1 ring-border/50"
          />
          <FolderGlyph
            color={folder.color}
            icon={folder.icon || DEFAULT_FOLDER_ICON}
            className="relative size-12 rounded-2xl"
            iconClassName="text-xl leading-none"
          />
        </motion.span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[length:var(--p-text-title)] font-semibold text-heading">
            {folder.name}
          </span>
          <span
            className={cn(
              'mt-1 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[length:var(--p-text-tiny)] font-semibold',
              deckCount > 0
                ? 'bg-primary/[0.07] text-primary/80'
                : 'bg-secondary/40 text-muted-foreground',
            )}
          >
            <Layers className="size-3" aria-hidden />
            {deckCount > 0 ? t('folder.deckCount', { count: deckCount }) : t('folder.empty')}
          </span>
        </span>
        {selectMode ? null : (
          <ChevronRight className="size-5 shrink-0 text-muted-foreground/70" aria-hidden />
        )}
      </div>
    </>
  )
}

export function FolderDragPreview({
  folder,
  deckCount,
  selected,
}: {
  folder: Folder
  deckCount: number
  selected: boolean
}) {
  return (
    <div
      className={cn(
        FOLDER_ROW_FRAME,
        'bg-card shadow-elevated ring-1',
        selected ? 'ring-2 ring-accent' : 'ring-border/60',
      )}
    >
      <FolderRowBody folder={folder} deckCount={deckCount} selected={selected} />
    </div>
  )
}
