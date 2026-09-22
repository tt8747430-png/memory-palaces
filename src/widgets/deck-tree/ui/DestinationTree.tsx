import { type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Archive, Check, Home, Minus, Plus } from 'lucide-react'
import { type Deck, DEFAULT_DECK_COLOR, DEFAULT_DECK_ICON } from '@/entities/deck'
import { DEFAULT_FOLDER_ICON, type Folder } from '@/entities/folder'
import { cn, type Shelf, toggleInSet, useContributedT } from '@/shared/lib'
import { DeckCover, FolderGlyph, GroupHeading } from '@/shared/ui'
import type { Destination } from '../model/destination'
import { useLibraryArrangement } from '../model/use-library-arrangement'
import { FilteredNotice } from './FilteredNotice'

export interface DestinationTreeProps {
  decks: Deck[]
  folders: Folder[]
  excludeIds: ReadonlySet<string>
  /** Only decks can be picked — folders still open, to reach the decks inside. */
  decksOnly: boolean
  selectedKey: string | null
  onSelect: (dest: Destination) => void
}

const INDENT = 20

/**
 * Where a shelf heading starts, by the depth of the rows it heads: over the rows' glyphs, past the
 * indent and the expand toggle (`Row`), so the name lines up with the names beneath it.
 */
const HEADING_INSET: Record<number, string> = {
  1: 'pl-[3.875rem]',
  2: 'pl-[5.125rem]',
}

/**
 * Every place a deck can go, laid out the way the Library lays it out — the same order at every
 * level, the same filter, the same shelf headings — because it is the Library's own arrangement
 * (`useLibraryArrangement`), not a second one. A list that sorted itself here once had the Bible
 * decks in the order they were dragged while the Library read them in canon order.
 *
 * It lives inside the sheet's popup, which mounts only while the sheet is open: a screen that keeps
 * a closed move sheet around pays nothing for the arrangement, and each opening starts with every
 * level expanded.
 */
export function DestinationTree({
  decks,
  folders,
  excludeIds,
  decksOnly,
  selectedKey,
  onSelect,
}: DestinationTreeProps) {
  const { t } = useTranslation()
  const contributed = useContributedT()
  const arrangement = useLibraryArrangement(decks, folders)

  const top = arrangement.shelf({ folderId: null })
  const folderShelves = useMemo(
    () =>
      arrangement.folders.map((folder) => ({
        folder,
        shelf: arrangement.shelf({ folderId: folder.id }),
      })),
    [arrangement],
  )
  const shown = folderShelves.reduce((sum, { shelf }) => sum + shelf.decks.length, top.decks.length)
  const hidden = folderShelves.reduce((sum, { shelf }) => sum + shelf.hidden, top.hidden)

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const keys = new Set<string>()
    for (const folder of arrangement.folders) keys.add(`folder:${folder.id}`)
    for (const deck of arrangement.decks) {
      if (arrangement.subdecks(deck.id).length > 0) keys.add(`deck:${deck.id}`)
    }
    return keys
  })
  const toggle = (key: string) => setExpanded((prev) => toggleInSet(prev, key))

  const renderDeck = (deck: Deck, depth: number): ReactNode => {
    const key = `deck:${deck.id}`
    const children = arrangement.subdecks(deck.id)
    const isOpen = expanded.has(key)
    return (
      <li key={key}>
        <Row
          depth={depth}
          hasChildren={children.length > 0}
          isOpen={isOpen}
          onToggle={() => toggle(key)}
          glyph={
            <DeckCover
              icon={deck.icon || DEFAULT_DECK_ICON}
              color={deck.color || DEFAULT_DECK_COLOR}
              className="size-8 rounded-control ring-1 ring-border"
              iconClassName="text-glyph-sm leading-none"
            />
          }
          label={deck.name}
          selected={selectedKey === key}
          disabled={excludeIds.has(deck.id)}
          onSelect={() => onSelect({ kind: 'deck', deckId: deck.id })}
        />
        {children.length > 0 && isOpen ? (
          <ul>{children.map((child) => renderDeck(child, depth + 1))}</ul>
        ) : null}
      </li>
    )
  }

  // A shelf's rows with the headings the Library prints over them, at the depth they sit.
  const renderShelf = (shelf: Shelf<Deck>, depth: number): ReactNode[] =>
    shelf.decks.flatMap((deck) => {
      const heading = shelf.headings.get(deck.id)
      return [
        heading ? (
          <GroupHeading key={`heading:${deck.id}`} className={cn('pt-3', HEADING_INSET[depth])}>
            {contributed(heading.labelKey)}
          </GroupHeading>
        ) : null,
        renderDeck(deck, depth),
      ]
    })

  return (
    <div className="flex flex-col gap-1">
      <FilteredNotice shown={shown} hidden={hidden} />

      <ul className="-mx-1 flex flex-col">
        {decksOnly ? null : (
          <>
            <li>
              <Row
                depth={0}
                glyph={
                  <span className="grid size-8 shrink-0 place-items-center rounded-control bg-secondary/40 text-muted-foreground">
                    <Archive className="size-4.5" aria-hidden />
                  </span>
                }
                label={t('move.archive')}
                selected={selectedKey === 'archive'}
                onSelect={() => onSelect({ kind: 'archive' })}
              />
            </li>
            <li>
              <Row
                depth={0}
                glyph={
                  <span className="grid size-8 shrink-0 place-items-center rounded-control bg-primary/10 text-primary">
                    <Home className="size-4.5" aria-hidden />
                  </span>
                }
                label={t('move.home')}
                selected={selectedKey === 'home'}
                onSelect={() => onSelect({ kind: 'home' })}
              />
            </li>
          </>
        )}

        {folderShelves.map(({ folder, shelf }) => {
          const key = `folder:${folder.id}`
          const hasChildren = shelf.decks.length > 0
          const isOpen = expanded.has(key)
          return (
            <li key={key}>
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
                onSelect={() => onSelect({ kind: 'folder', folderId: folder.id })}
              />
              {hasChildren && isOpen ? <ul>{renderShelf(shelf, 2)}</ul> : null}
            </li>
          )
        })}

        {renderShelf(top, 1)}
      </ul>
    </div>
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
  const { t } = useTranslation()
  const inert = !selectable && !hasChildren
  return (
    <div
      // The gap keeps the selected row's tint clear of the expand toggle beside it.
      className="relative flex items-center gap-1.5 border-b border-border/50"
      style={{ paddingLeft: depth * INDENT }}
    >
      {hasChildren ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? t('deck.collapse') : t('deck.expand')}
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
          'flex min-w-0 flex-1 items-center gap-2.5 rounded-control py-2.5 pl-2 pr-2 text-left transition-colors',
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
