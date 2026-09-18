import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Archive, Check, FolderPlus, Home, Minus, Plus } from 'lucide-react'
import { type Deck, DEFAULT_DECK_COLOR, DEFAULT_DECK_ICON } from '@/entities/deck'
import { DEFAULT_FOLDER_ICON, type Folder } from '@/entities/folder'
import { childDecks, cn, decksInFolder, findEntity, rootDecks, toggleInSet } from '@/shared/lib'
import { Button, DeckCover, FolderGlyph, Sheet } from '@/shared/ui'
import type { Destination } from '../model/destination'

export type DestinationTargets = 'any' | 'deck'

function destKey(d: Destination): string {
  if (d.kind === 'folder') return `folder:${d.folderId}`
  if (d.kind === 'deck') return `deck:${d.deckId}`
  return d.kind
}

interface DeckNode {
  deck: Deck
  children: DeckNode[]
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

const INDENT = 20

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

  const buildDeckNode = (deck: Deck): DeckNode => ({
    deck,
    children: childDecks(decks, deck.id)
      .filter((d) => !d.archived)
      .map(buildDeckNode),
  })
  const folderNodes = folders.map((folder) => ({
    folder,
    children: decksInFolder(decks, folder.id)
      .filter((d) => !d.archived)
      .map(buildDeckNode),
  }))
  const homeDeckNodes = rootDecks(decks)
    .filter((d) => !d.archived)
    .map(buildDeckNode)

  const allExpandable = useMemo(() => {
    const ids = new Set<string>()
    for (const f of folders) ids.add(`folder:${f.id}`)
    for (const d of decks) {
      if (decks.some((c) => c.parentId === d.id && !c.archived)) ids.add(`deck:${d.id}`)
    }
    return ids
  }, [folders, decks])

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(allExpandable))
  const [selected, setSelected] = useState<Destination | null>(null)

  useEffect(() => {
    if (open) {
      setExpanded(new Set(allExpandable))
      setSelected(null)
    }
  }, [open, allExpandable])

  const toggle = (key: string) => setExpanded((prev) => toggleInSet(prev, key))

  const selectedKey = selected ? destKey(selected) : null
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

  const renderDeck = (node: DeckNode, depth: number): ReactNode => {
    const key = `deck:${node.deck.id}`
    const disabled = excludeIds.has(node.deck.id)
    const hasChildren = node.children.length > 0
    const isOpen = expanded.has(key)
    return (
      <div key={key}>
        <Row
          depth={depth}
          hasChildren={hasChildren}
          isOpen={isOpen}
          onToggle={() => toggle(key)}
          glyph={
            <DeckCover
              icon={node.deck.icon || DEFAULT_DECK_ICON}
              color={node.deck.color || DEFAULT_DECK_COLOR}
              className="size-8 rounded-control ring-1 ring-border"
              iconClassName="text-glyph-sm leading-none"
            />
          }
          label={node.deck.name}
          selected={selectedKey === key}
          disabled={disabled}
          onSelect={() => setSelected({ kind: 'deck', deckId: node.deck.id })}
        />
        {hasChildren && isOpen ? node.children.map((child) => renderDeck(child, depth + 1)) : null}
      </div>
    )
  }

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
      <div className="-mx-1 flex flex-col">
        {decksOnly ? null : (
          <>
            <Row
              depth={0}
              glyph={
                <span className="grid size-8 shrink-0 place-items-center rounded-control bg-secondary/40 text-muted-foreground">
                  <Archive className="size-4.5" aria-hidden />
                </span>
              }
              label={t('move.archive')}
              selected={selectedKey === 'archive'}
              onSelect={() => setSelected({ kind: 'archive' })}
            />
            <Row
              depth={0}
              glyph={
                <span className="grid size-8 shrink-0 place-items-center rounded-control bg-primary/10 text-primary">
                  <Home className="size-4.5" aria-hidden />
                </span>
              }
              label={t('move.home')}
              selected={selectedKey === 'home'}
              onSelect={() => setSelected({ kind: 'home' })}
            />
          </>
        )}

        {folderNodes.map(({ folder, children }) => {
          const key = `folder:${folder.id}`
          const hasChildren = children.length > 0
          const isOpen = expanded.has(key)
          return (
            <div key={key}>
              <Row
                depth={1}
                hasChildren={hasChildren}
                isOpen={isOpen}
                onToggle={() => toggle(key)}
                glyph={
                  <FolderGlyph
                    color={folder.color}
                    icon={folder.icon || DEFAULT_FOLDER_ICON}
                    className="size-8"
                    iconClassName="text-glyph-sm leading-none"
                  />
                }
                label={folder.name}
                selected={selectedKey === key}
                selectable={!decksOnly}
                onSelect={() => setSelected({ kind: 'folder', folderId: folder.id })}
              />
              {hasChildren && isOpen ? children.map((child) => renderDeck(child, 2)) : null}
            </div>
          )
        })}

        {homeDeckNodes.map((node) => renderDeck(node, 1))}
      </div>

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

function Row({
  depth,
  hasChildren = false,
  isOpen = false,
  onToggle,
  glyph,
  label,
  selected,
  selectable = true,
  disabled = false,
  onSelect,
}: {
  depth: number
  hasChildren?: boolean
  isOpen?: boolean
  onToggle?: () => void
  glyph: ReactNode
  label: string
  selected: boolean
  selectable?: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  const inert = !selectable && !hasChildren
  return (
    <div
      className="relative flex items-center border-b border-border/50"
      style={{ paddingLeft: depth * INDENT }}
    >
      {hasChildren ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? 'Collapse' : 'Expand'}
          aria-expanded={isOpen}
          className="relative z-10 ml-1 grid size-6 shrink-0 place-items-center rounded-full bg-secondary/30 text-primary transition-colors active:bg-secondary/50"
        >
          {isOpen ? (
            <Minus className="size-3.5" aria-hidden />
          ) : (
            <Plus className="size-3.5" aria-hidden />
          )}
        </button>
      ) : (
        <span className="ml-1 size-6 shrink-0" aria-hidden />
      )}

      <button
        type="button"
        onClick={selectable ? onSelect : onToggle}
        disabled={disabled || inert}
        aria-pressed={selectable ? selected : undefined}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2.5 rounded-control py-2.5 pl-1.5 pr-2 text-left transition-colors',
          disabled ? 'opacity-40' : 'active:bg-primary/4',
          selectable && selected && 'bg-primary/6',
        )}
      >
        {glyph}
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-body font-semibold',
            selectable && selected ? 'text-primary' : 'text-heading',
            !selectable && 'text-muted-foreground',
          )}
        >
          {label}
        </span>
        {selectable && selected ? (
          <Check className="size-5 shrink-0 text-accent" strokeWidth={2.5} aria-hidden />
        ) : null}
      </button>
    </div>
  )
}
