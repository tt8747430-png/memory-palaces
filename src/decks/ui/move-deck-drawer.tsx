import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Archive, Check, FolderPlus, Home, Minus, Plus } from 'lucide-react'
import {
  type Deck,
  DEFAULT_DECK_COLOR,
  DEFAULT_DECK_ICON,
  DEFAULT_FOLDER_ICON,
  type Folder,
} from '@/decks'
import { childDecks, decksInFolder, rootDecks } from '@/shared/domain'
import { cn } from '@/shared/lib'
import {
  Button,
  DeckCover,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  FolderGlyph,
  openOverlay,
  useOverlayController,
  type OverlayResolver,
} from '@/shared/ui'

export type MoveDestination =
  | { kind: 'home' }
  | { kind: 'archive' }
  | { kind: 'folder'; folderId: string }
  | { kind: 'deck'; deckId: string }

function destKey(d: MoveDestination): string {
  if (d.kind === 'folder') return `folder:${d.folderId}`
  if (d.kind === 'deck') return `deck:${d.deckId}`
  return d.kind
}

interface DeckNode {
  deck: Deck
  children: DeckNode[]
}

export interface OpenMoveDeckDrawerOptions {
  decks: Deck[]
  folders: Folder[]
  /** Header subtitle — the moving deck's name, or a bulk-move selection count. */
  subtitle: string
  /** Decks that can't be a destination (the moved deck's subtree, or the union of many for a bulk move). */
  excludeIds: ReadonlySet<string>
  /** The learner tapped "New folder": the drawer resolves `null`, then this fires so the caller
   * can chain `openFolderDrawer`. */
  onNewFolder?: () => void
}

const INDENT = 20

/**
 * Opens a controlled Drawer rendering the destination tree (archive, home, folders, decks) that
 * starts open and resolves the picked `MoveDestination` on confirm, or `null` on cancel/dismiss.
 * The overlay entry unmounts only after Base UI's close transition finishes (see
 * `useOverlayController`), so dismissals animate instead of cutting instantly.
 *
 * Mirrors `openPromptDrawer`'s shape: `main`'s `MoveDeckSheet` was a render-prop component driven
 * by `DeckLibraryPage`'s `moveTarget`/`bulkMoveOpen` state; here the caller just awaits the promise
 * — `const dest = await openMoveDeckDrawer({ decks, folders, subtitle, excludeIds })`. The tree can
 * run tall (a deep folder/deck hierarchy), so it ships the half↔full `snapPoints` detent pair
 * (ADR-0010) instead of staying at content height like the shorter drawers.
 */
export function openMoveDeckDrawer(
  options: OpenMoveDeckDrawerOptions,
): Promise<MoveDestination | null> {
  return openOverlay<MoveDestination | null>((resolve) => (
    <MoveDeckDrawerBody {...options} resolve={resolve} />
  ))
}

function MoveDeckDrawerBody({
  subtitle,
  decks,
  folders,
  excludeIds,
  onNewFolder,
  resolve,
}: OpenMoveDeckDrawerOptions & { resolve: OverlayResolver<MoveDestination | null> }) {
  const { t } = useTranslation()
  const { open, close, onOpenChangeComplete } = useOverlayController(resolve)

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
  const [selected, setSelected] = useState<MoveDestination | null>(null)

  // The tree can update live (RxDB is the source of truth) while the drawer is open — re-expand
  // everything and clear the pending pick, mirroring `main`'s reopen-on-fresh-structure effect
  // (there `open` gated the same reset; here every mount of this overlay is already a fresh open,
  // so the effect fires whenever the live `decks`/`folders` snapshot actually changes shape).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpanded(new Set(allExpandable))
    setSelected(null)
  }, [allExpandable])

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const selectedKey = selected ? destKey(selected) : null
  const selectedName =
    selected == null
      ? ''
      : selected.kind === 'home'
        ? t('move.home')
        : selected.kind === 'archive'
          ? t('move.archive')
          : selected.kind === 'folder'
            ? (folders.find((f) => f.id === selected.folderId)?.name ?? '')
            : (decks.find((d) => d.id === selected.deckId)?.name ?? '')

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
              className="size-8 rounded-xl ring-1 ring-black/5"
              iconClassName="text-[0.85rem] leading-none"
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

  const submit = () => {
    if (selected) close(selected)
  }

  return (
    <Drawer
      open={open}
      snapPoints={[0.5, 1]}
      showSwipeHandle
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close(null)
      }}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('move.selectLocation')}</DrawerTitle>
          <DrawerDescription>{subtitle}</DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1.5 pb-2">
          <div className="-mx-1 flex flex-col">
            <Row
              depth={0}
              glyph={
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-secondary/40 text-muted-foreground">
                  <Archive className="size-[18px]" aria-hidden />
                </span>
              }
              label={t('move.archive')}
              selected={selectedKey === 'archive'}
              onSelect={() => setSelected({ kind: 'archive' })}
            />
            <Row
              depth={0}
              glyph={
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Home className="size-[18px]" aria-hidden />
                </span>
              }
              label={t('move.home')}
              selected={selectedKey === 'home'}
              onSelect={() => setSelected({ kind: 'home' })}
            />

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
                        iconClassName="text-[0.95rem] leading-none"
                      />
                    }
                    label={folder.name}
                    selected={selectedKey === key}
                    onSelect={() => setSelected({ kind: 'folder', folderId: folder.id })}
                  />
                  {hasChildren && isOpen ? children.map((child) => renderDeck(child, 2)) : null}
                </div>
              )
            })}

            {homeDeckNodes.map((node) => renderDeck(node, 1))}
          </div>

          <button
            type="button"
            onClick={() => {
              onNewFolder?.()
              close(null)
            }}
            className="mt-1 flex w-full items-center gap-2.5 rounded-card px-2 py-3 text-left text-accent transition-colors active:bg-primary/[0.05]"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-info-surface">
              <FolderPlus className="size-[18px]" aria-hidden />
            </span>
            <span className="text-[length:var(--ms-text-body)] font-semibold">
              {t('move.newFolder')}
            </span>
          </button>
        </div>

        <DrawerFooter>
          <Button size="lg" className="w-full" disabled={selected == null} onClick={submit}>
            {selected == null ? t('move.pickPrompt') : t('move.moveTo', { name: selectedName })}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
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
  disabled?: boolean
  onSelect: () => void
}) {
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
        onClick={onSelect}
        disabled={disabled}
        aria-pressed={selected}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2.5 rounded-control py-2.5 pl-1.5 pr-2 text-left transition-colors',
          disabled ? 'opacity-40' : 'active:bg-primary/[0.04]',
          selected && 'bg-primary/[0.06]',
        )}
      >
        {glyph}
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-[length:var(--ms-text-body)] font-semibold',
            selected ? 'text-primary' : 'text-heading',
          )}
        >
          {label}
        </span>
        {selected ? (
          <Check className="size-5 shrink-0 text-accent" strokeWidth={2.5} aria-hidden />
        ) : null}
      </button>
    </div>
  )
}
