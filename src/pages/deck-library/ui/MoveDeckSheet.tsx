import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, FolderPlus, Home } from 'lucide-react'
import type { Folder } from '@/entities/folder'
import { cn } from '@/shared/lib'
import { Button, FolderGlyph, Sheet } from '@/shared/ui'

export interface MoveDeckSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deckName: string
  currentFolderId: string | null
  folders: Folder[]
  onPick: (folderId: string | null) => void
  onNewFolder: () => void
}

/** Bottom sheet for filing a deck into a folder (or moving it back to the library root).
 * Each folder shows its own colour-and-emoji glyph, so the choice matches its row in the
 * library. The footer jumps to creating a new folder. */
export function MoveDeckSheet({
  open,
  onOpenChange,
  deckName,
  currentFolderId,
  folders,
  onPick,
  onNewFolder,
}: MoveDeckSheetProps) {
  const { t } = useTranslation()
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('move.title')}
      description={deckName}
      footer={
        <Button variant="secondary" size="lg" className="w-full" onClick={onNewFolder}>
          <FolderPlus className="size-[18px]" aria-hidden />
          {t('move.newFolder')}
        </Button>
      }
    >
      <div className="flex flex-col gap-2 pb-2">
        <FolderOption
          label={t('move.none')}
          glyph={
            <span className="grid size-10 shrink-0 place-items-center rounded-control bg-primary/10 text-primary">
              <Home className="size-[18px]" aria-hidden />
            </span>
          }
          selected={currentFolderId === null}
          onClick={() => onPick(null)}
        />
        {folders.map((folder) => (
          <FolderOption
            key={folder.id}
            label={folder.name}
            glyph={
              <FolderGlyph
                color={folder.color}
                icon={folder.icon}
                className="size-10"
                iconClassName="text-lg leading-none"
              />
            }
            selected={currentFolderId === folder.id}
            onClick={() => onPick(folder.id)}
          />
        ))}
      </div>
    </Sheet>
  )
}

function FolderOption({
  label,
  glyph,
  selected,
  onClick,
}: {
  label: string
  glyph: ReactNode
  selected: boolean
  onClick: () => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center gap-3 rounded-card px-3 py-2.5 text-left transition-[background-color,box-shadow] duration-150 active:scale-[0.99]',
        selected
          ? 'bg-primary text-primary-foreground shadow-interactive'
          : 'bg-card text-heading shadow-rest ring-1 ring-inset ring-border active:bg-secondary/15',
      )}
    >
      {glyph}
      <span className="min-w-0 flex-1 truncate text-[length:var(--p-text-body)] font-semibold">
        {label}
      </span>
      {selected ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-primary-foreground/15 py-0.5 pl-1.5 pr-2 text-[length:var(--p-text-tiny)] font-bold">
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
          {t('move.current')}
        </span>
      ) : null}
    </button>
  )
}
