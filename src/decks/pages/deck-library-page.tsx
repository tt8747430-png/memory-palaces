import { useTranslation } from 'react-i18next'
import { DndContext, DragOverlay, type DragStartEvent } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, type SortingStrategy, useSortable } from '@dnd-kit/sortable'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  FolderPlus,
  Layers,
  MoreVertical,
  Plus,
} from 'lucide-react'
import { DEFAULT_FOLDER_ICON, type Folder } from '@/decks'
import { DeckDragPreview, DeckTree, HomeHeader } from '@/decks/ui'
import type { SwipeConfig } from '@/shared/config/swipe'
import type { DropZone } from '@/shared/domain'
import { cn, useLongPress } from '@/shared/lib'
import {
  AppScreen,
  Button,
  buildSwipeActions,
  DropIndicator,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  FolderGlyph,
  IconButton,
  SelectDot,
  SelectToolbar,
  SpeedDial,
  SwipeRow,
  type SwipeActionHandlers,
} from '@/shared/ui'
import { useHideTabNav } from '@/shell/tab-nav-visibility'
import { type DeckLibraryPageProps, DROP_MS, useDeckLibrary } from './use-deck-library'

export type { DeckLibraryPageProps }

const noop = () => {}

/** Folders reorder among themselves only — a still list lets the drop indicator
 *  (not a shifting row) say where a folder would land. */
const NO_SHIFT: SortingStrategy = () => null

export function DeckLibraryPage(props: DeckLibraryPageProps) {
  const { t } = useTranslation()
  const vm = useDeckLibrary(props)
  // An open folder is a drill-down that never changes the route, so the nav has to be told.
  useHideTabNav(vm.inFolder)

  return (
    <AppScreen
      className="pb-nav"
      scrollRef={vm.stickyHeader.ref}
      header={
        vm.selectMode ? (
          <header className="bg-glass pt-safe">
            <div className="flex items-center justify-between gap-2 px-3 py-3">
              <button
                type="button"
                onClick={vm.toggleSelectAll}
                className="-mx-2 inline-flex min-h-11 items-center rounded-control px-2 text-[length:var(--ms-text-body)] font-semibold text-accent"
              >
                {vm.allSelected ? t('library.select.clearAll') : t('library.select.selectAll')}
              </button>
              <span className="text-[length:var(--ms-text-body)] font-semibold tabular-nums text-heading">
                {t('library.select.count', { count: vm.selectedCount })}
              </span>
              <button
                type="button"
                onClick={vm.exitSelect}
                className="-mx-2 inline-flex min-h-11 items-center rounded-control px-2 text-[length:var(--ms-text-body)] font-semibold text-accent"
              >
                {t('common.cancel')}
              </button>
            </div>
          </header>
        ) : vm.openFolder ? (
          <header className="bg-glass pt-safe">
            <div className="flex items-center gap-2 px-2 py-2">
              <IconButton variant="glass" aria-label={t('common.back')} onClick={vm.closeFolder}>
                <ChevronLeft className="size-5" aria-hidden />
              </IconButton>
              <h1 className="min-w-0 flex-1 truncate text-center text-[length:var(--ms-text-title)] font-semibold text-heading">
                {vm.openFolder.name}
              </h1>
              <IconButton
                variant="glass"
                aria-label={t('folder.rowActions', { name: vm.openFolder.name })}
                onClick={() => void vm.openFolderMenu(vm.openFolder!)}
              >
                <MoreVertical className="size-5" aria-hidden />
              </IconButton>
            </div>
          </header>
        ) : (
          <HomeHeader
            header={vm.stickyHeader}
            name={vm.name}
            avatar={vm.avatar}
            xp={vm.xp}
            unreadCount={vm.unreadCount}
            onOpenProfile={props.onOpenProfile ?? noop}
            onOpenNotifications={props.onOpenNotifications ?? noop}
            onOpenArchived={props.onOpenArchived}
            streak={
              props.onOpenStreak
                ? { count: vm.streakCount, dayCount: vm.dayCount, dailyGoal: vm.dailyGoal }
                : undefined
            }
            onOpenStreak={props.onOpenStreak}
          />
        )
      }
    >
      {!vm.ready ? (
        <LibrarySkeleton />
      ) : vm.isEmpty ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Empty>
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="size-16 rounded-card-featured bg-info-surface text-3xl text-accent"
              >
                {vm.inFolder ? '📂' : '🗂️'}
              </EmptyMedia>
              <EmptyTitle>
                {vm.inFolder ? t('library.emptyFolderTitle') : t('library.emptyTitle')}
              </EmptyTitle>
              <EmptyDescription>
                {vm.inFolder ? t('library.emptyFolderHint') : t('library.emptyHint')}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                className="w-full"
                onClick={() => void vm.createDeckPrompt(vm.inFolder ? vm.folderId : null)}
              >
                <Plus className="size-[18px]" aria-hidden />
                {vm.inFolder ? t('folder.addDeck') : t('deck.newDeck')}
              </Button>
              {vm.canImport ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => props.onImportPaste?.()}
                >
                  <ClipboardPaste className="size-[18px]" aria-hidden />
                  {t('deck.importCards')}
                </Button>
              ) : null}
            </EmptyContent>
          </Empty>
        </motion.div>
      ) : (
        <DndContext
          sensors={vm.dndSensors}
          collisionDetection={vm.collisionDetection}
          // A deck can be carried sideways to nest, so it moves freely. A folder
          // has nowhere to nest into — it stays on the rail it reorders along.
          modifiers={vm.activeDragFolder ? [restrictToVerticalAxis] : undefined}
          onDragStart={(event: DragStartEvent) => vm.onDragStart(event)}
          onDragOver={vm.onDragOver}
          onDragMove={vm.onDragMove}
          onDragEnd={vm.onDragEnd}
          onDragCancel={vm.onDragCancel}
        >
          {/* The bar clears the toolbar that select mode floats over the list. */}
          <div className={cn('flex flex-col gap-2 pt-2', vm.selectMode && 'pb-24')}>
            {!vm.inFolder ? (
              <SortableContext items={vm.sortedFolders.map((f) => f.id)} strategy={NO_SHIFT}>
                {vm.sortedFolders.map((folder) => (
                  <FolderRow
                    key={folder.id}
                    folder={folder}
                    deckCount={vm.folderDeckCounts.get(folder.id) ?? 0}
                    selectMode={vm.selectMode}
                    selected={vm.selectedIds.has(folder.id)}
                    drop={vm.drop?.targetId === folder.id ? vm.drop.zone : null}
                    onOpen={() => vm.openFolderRoot(folder.id)}
                    onRequestSelect={() => vm.enterSelect(folder.id)}
                    onToggleSelect={() => vm.toggleSelect(folder.id)}
                    swipe={vm.swipe.folder}
                    swipeHandlers={vm.folderSwipeHandlers(folder)}
                  />
                ))}
              </SortableContext>
            ) : null}

            <DeckTree
              decks={vm.decks}
              cards={vm.cards}
              expanded={vm.expanded}
              onToggle={vm.toggleExpand}
              onOpen={props.onOpenDeck}
              selectMode={vm.selectMode}
              selectedIds={vm.selectedIds}
              onRequestSelect={vm.enterSelect}
              onToggleSelect={vm.toggleSelect}
              drop={vm.drop}
              settling={vm.settling}
              parentId={null}
              folderId={vm.inFolder ? (vm.folderId as string) : null}
              swipe={vm.swipe.deck}
              swipeHandlers={vm.deckSwipeHandlers}
              now={vm.now}
            />
          </div>

          {/* The card in hand is the row, one elevation up — so the drop settles
              onto its slot instead of morphing into a different shape. */}
          <DragOverlay
            dropAnimation={{ duration: DROP_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
          >
            {vm.activeDragDeck ? (
              <DeckDragPreview
                deck={vm.activeDragDeck}
                due={vm.dragDueCounts.get(vm.activeDragDeck.id) ?? 0}
                isSub={vm.activeDragDeck.parentId !== null}
                selected={vm.selectedIds.has(vm.activeDragDeck.id)}
                hasChildren={vm.decks.some(
                  (d) => d.parentId === vm.activeDragDeck!.id && !d.archived,
                )}
                isOpen={vm.expanded.has(vm.activeDragDeck.id)}
                nesting={vm.drop?.zone === 'nest'}
              />
            ) : vm.activeDragFolder ? (
              <FolderDragPreview
                folder={vm.activeDragFolder}
                deckCount={vm.folderDeckCounts.get(vm.activeDragFolder.id) ?? 0}
                selected={vm.selectedIds.has(vm.activeDragFolder.id)}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {vm.selectMode ? (
        // Rides above the tab nav rather than over it: the nav pill is 4rem tall at
        // `bottom-[max(0.75rem,safe)]`, so +5rem clears it — the same offset SpeedDial uses.
        <div
          className="fixed inset-x-0 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)] mx-auto w-full max-w-[26.875rem] px-3"
          style={{ zIndex: 'var(--ms-z-overlay)' }}
        >
          <SelectToolbar actions={vm.selectToolbarConfig} handlers={selectHandlersFor(vm)} />
        </div>
      ) : null}

      {!vm.isEmpty && !vm.selectMode ? (
        <SpeedDial
          label={t('deck.create')}
          actions={[
            {
              id: 'new-deck',
              label: vm.inFolder ? t('folder.addDeck') : t('deck.newDeck'),
              icon: <Layers className="size-5" aria-hidden />,
              onSelect: () => void vm.createDeckPrompt(vm.inFolder ? vm.folderId : null),
            },
            ...(vm.canImport
              ? [
                  {
                    id: 'import',
                    label: t('deck.importCards'),
                    icon: <ClipboardPaste className="size-5" aria-hidden />,
                    onSelect: () => props.onImportPaste?.(),
                  },
                ]
              : []),
            ...(vm.inFolder
              ? []
              : [
                  {
                    id: 'new-folder',
                    label: t('deck.newFolder'),
                    icon: <FolderPlus className="size-5" aria-hidden />,
                    onSelect: () => void vm.createFolderPrompt(),
                  },
                ]),
          ]}
        />
      ) : null}
    </AppScreen>
  )
}

/** The bar's actions map onto the VM's bulk commands, each disabled to match what a
 *  folder-only or deck-only selection can actually do (CLAUDE.md: bulk actions are
 *  their own command, never a loop at the caller — every handler here is one). */
function selectHandlersFor(vm: ReturnType<typeof useDeckLibrary>) {
  const noDecks = [...vm.selectedIds].filter((id) => vm.decks.some((d) => d.id === id)).length === 0
  const filedCount = vm.decks.filter(
    (d) => vm.selectedIds.has(d.id) && (d.parentId !== null || (d.folderId ?? null) !== null),
  ).length
  return {
    move: { onAction: () => void vm.bulk.move(), disabled: noDecks },
    favorite: { onAction: vm.bulk.favorite, disabled: noDecks },
    duplicate: { onAction: vm.bulk.duplicate, disabled: noDecks },
    archive: { onAction: vm.bulk.archive, disabled: noDecks },
    unfile: { onAction: vm.bulk.unfile, disabled: filedCount === 0 },
    delete: { onAction: () => void vm.bulk.delete(), disabled: vm.selectedCount === 0 },
  }
}

/** Row geometry shared by the live folder row and the card in hand. */
const FOLDER_ROW_FRAME = 'flex w-full items-center gap-3.5 rounded-card py-2.5 pl-2.5 pr-2'

interface FolderRowProps {
  folder: Folder
  deckCount: number
  selectMode: boolean
  selected: boolean
  /** Where the dragged card would land on this row, if anywhere. */
  drop: DropZone | null
  onOpen: () => void
  onRequestSelect: () => void
  onToggleSelect: () => void
  swipe: SwipeConfig
  swipeHandlers: SwipeActionHandlers
}

function FolderRow({
  folder,
  deckCount,
  selectMode,
  selected,
  drop,
  onOpen,
  onRequestSelect,
  onToggleSelect,
  swipe,
  swipeHandlers,
}: FolderRowProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const longPress = useLongPress({
    onLongPress: onRequestSelect,
    onTap: () => (selectMode ? onToggleSelect() : onOpen()),
  })
  const { leading, trailing } = buildSwipeActions(swipe, swipeHandlers, t)
  const swipeEnabled = !selectMode && (leading.length > 0 || trailing.length > 0)

  // Folders reorder among themselves; a dragged deck drops in to nest.
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useSortable({
    id: folder.id,
    disabled: !selectMode,
  })
  const isNestTarget = drop === 'nest'

  const row = (
    <div
      ref={setNodeRef}
      className={cn(
        FOLDER_ROW_FRAME,
        'relative bg-card shadow-card transition-[box-shadow,background-color,transform]',
        selected && 'ring-2 ring-inset ring-accent',
        isNestTarget &&
          'scale-[1.015] bg-accent/[0.08] ring-2 ring-accent ring-offset-2 ring-offset-background',
        // The lifted slot only fades — scaling belongs to a nest hover, not a reorder.
        isDragging && 'z-50 opacity-40',
      )}
    >
      {/* Whole-card activator — tap toggles / opens; press-and-hold drags. */}
      <button
        type="button"
        ref={selectMode ? setActivatorNodeRef : undefined}
        {...(selectMode
          ? { onClick: () => onToggleSelect(), ...attributes, ...listeners }
          : longPress)}
        aria-label={
          selectMode
            ? t('library.select.toggle', { name: folder.name })
            : t('folder.rowOpen', { name: folder.name })
        }
        aria-pressed={selectMode ? selected : undefined}
        className={cn(
          'absolute inset-0 rounded-card transition-colors active:bg-primary/[0.06]',
          selectMode && 'touch-pan-y',
        )}
      />

      <FolderRowBody
        folder={folder}
        deckCount={deckCount}
        selectMode={selectMode}
        selected={selected}
        isNestTarget={isNestTarget}
      />
    </div>
  )

  return (
    <motion.div
      // Folders glide to their new slot after a drop instead of teleporting.
      layout={reduce ? false : 'position'}
      transition={{ layout: { type: 'spring', stiffness: 520, damping: 42 } }}
      className="relative"
    >
      {swipeEnabled ? (
        <SwipeRow leading={leading} trailing={trailing} bleed>
          {row}
        </SwipeRow>
      ) : (
        row
      )}

      <AnimatePresence>
        {drop && drop !== 'nest' ? <DropIndicator key={drop} position={drop} /> : null}
      </AnimatePresence>
    </motion.div>
  )
}

interface FolderRowBodyProps {
  folder: Folder
  deckCount: number
  selectMode: boolean
  selected: boolean
  isNestTarget?: boolean
}

function FolderRowBody({
  folder,
  deckCount,
  selectMode,
  selected,
  isNestTarget = false,
}: FolderRowBodyProps) {
  const { t } = useTranslation()

  return (
    <>
      {selectMode ? (
        <span className="pointer-events-none relative z-20 grid shrink-0 place-items-center">
          <SelectDot selected={selected} />
        </span>
      ) : null}

      <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-3.5">
        {/* A folder is a container: the glyph carries pale "sheets" stacked
            behind it, so folders read as holding decks — not as another deck. */}
        <motion.span
          className="relative size-12 shrink-0"
          animate={{ scale: isNestTarget ? 1.08 : 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 20 }}
        >
          <span
            aria-hidden
            className="absolute inset-0 translate-x-[5px] translate-y-[-4px] rounded-2xl bg-secondary/40 ring-1 ring-inset ring-border/60"
          />
          <span
            aria-hidden
            className="absolute inset-0 translate-x-[2.5px] translate-y-[-2px] rounded-2xl bg-secondary/70 ring-1 ring-inset ring-border/70"
          />
          <FolderGlyph
            color={folder.color}
            icon={folder.icon || DEFAULT_FOLDER_ICON}
            className="relative size-12 rounded-2xl"
            iconClassName="text-xl leading-none"
          />
        </motion.span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[length:var(--ms-text-title)] font-semibold text-heading">
            {folder.name}
          </span>
          <span
            className={cn(
              'mt-1 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[length:var(--ms-text-tiny)] font-semibold',
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

/** The folder in hand: the row itself, lifted — same frame, same select dot. */
function FolderDragPreview({
  folder,
  deckCount,
  selected,
}: {
  folder: Folder
  deckCount: number
  selected: boolean
}) {
  return (
    <div className={cn(FOLDER_ROW_FRAME, 'bg-card shadow-elevated ring-1 ring-border/60')}>
      <FolderRowBody folder={folder} deckCount={deckCount} selectMode selected={selected} />
    </div>
  )
}

function LibrarySkeleton() {
  return (
    <div className="space-y-1 pt-2" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border py-3.5">
          <span className="size-11 shrink-0 animate-pulse rounded-card bg-secondary/50" />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="h-3.5 w-1/2 animate-pulse rounded-full bg-secondary/50" />
            <span className="h-3 w-1/3 animate-pulse rounded-full bg-secondary/40" />
          </span>
        </div>
      ))}
    </div>
  )
}
