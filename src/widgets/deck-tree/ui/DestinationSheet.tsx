import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderPlus } from 'lucide-react'
import type { Deck } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import { findEntity } from '@/shared/lib'
import { Button, Sheet } from '@/shared/ui'
import type { Destination } from '../model/destination'
import { DestinationTree } from './DestinationTree'

export type DestinationTargets = 'any' | 'deck'

function destKey(d: Destination): string {
  if (d.kind === 'folder') return `folder:${d.folderId}`
  if (d.kind === 'deck') return `deck:${d.deckId}`
  return d.kind
}

export interface DestinationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subtitle: string
  decks: Deck[]
  folders: Folder[]
  /** Decks that cannot be picked — what is being moved. Omitted when nothing is being moved. */
  excludeIds?: ReadonlySet<string>
  onPick: (dest: Destination) => void
  targets?: DestinationTargets
  title?: string
  /** What confirming does. Moving, unless the caller picks a place for something else. */
  action?: DestinationAction
  onNewFolder?: () => void
}

/**
 * The footer button's words: `prompt` before anything is picked, `confirm(name)` after. A caller
 * picking a place for anything but a move says what it is for — otherwise the button lies.
 */
export interface DestinationAction {
  prompt: string
  confirm: (name: string) => string
}

/** One frozen empty set, so a sheet that excludes nothing does not rebuild one every render. */
const EXCLUDE_NOTHING: ReadonlySet<string> = new Set()

export function DestinationSheet({
  open,
  onOpenChange,
  subtitle,
  decks,
  folders,
  excludeIds = EXCLUDE_NOTHING,
  onPick,
  targets = 'any',
  title,
  action,
  onNewFolder,
}: DestinationSheetProps) {
  const { t } = useTranslation()
  const decksOnly = targets === 'deck'
  const { prompt, confirm } = action ?? {
    prompt: t('move.pickPrompt'),
    confirm: (name: string) => t('move.moveTo', { name }),
  }

  const [selected, setSelected] = useState<Destination | null>(null)
  useEffect(() => {
    if (open) setSelected(null)
  }, [open])

  const selectedName =
    selected == null
      ? ''
      : selected.kind === 'home'
        ? t('move.home')
        : selected.kind === 'archive'
          ? t('move.archive')
          : selected.kind === 'folder'
            ? (findEntity(folders, selected.folderId)?.name ?? '')
            : (findEntity(decks, selected.deckId)?.name ?? '')

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title ?? t('move.selectLocation')}
      description={subtitle}
      footer={
        <Button
          size="lg"
          className="w-full"
          disabled={selected == null}
          onClick={() => selected && onPick(selected)}
        >
          {selected == null ? prompt : confirm(selectedName)}
        </Button>
      }
    >
      <DestinationTree
        decks={decks}
        folders={folders}
        excludeIds={excludeIds}
        decksOnly={decksOnly}
        selectedKey={selected ? destKey(selected) : null}
        onSelect={setSelected}
      />

      {onNewFolder && !decksOnly ? (
        <button
          type="button"
          onClick={onNewFolder}
          className="mt-1 flex w-full items-center gap-2.5 rounded-card px-2 py-3 text-left text-accent transition-colors active:bg-primary/5"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-control bg-info-surface">
            <FolderPlus className="size-4.5" aria-hidden />
          </span>
          <span className="text-body font-semibold">{t('move.newFolder')}</span>
        </button>
      ) : null}
    </Sheet>
  )
}
