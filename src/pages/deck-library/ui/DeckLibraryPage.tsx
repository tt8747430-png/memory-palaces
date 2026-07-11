import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Copy,
  FolderInput,
  FolderPlus,
  Heart,
  Layers,
  MoreVertical,
  Plus,
  Settings2,
  Trash2,
} from 'lucide-react'
import {
  DECK_COLOR_OPTIONS,
  selectDecks,
  selectIsReady as selectDecksReady,
  useDeckStore,
  useDeckStoreApi,
} from '@/entities/deck'
import type { Deck } from '@/entities/deck'
import {
  DEFAULT_FOLDER_ICON,
  type Folder,
  selectFolders,
  selectIsReady as selectFoldersReady,
  useFolderStore,
  useFolderStoreApi,
} from '@/entities/folder'
import { selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { selectEffectiveProfile, useProfileStore, useProfileStoreApi } from '@/entities/profile'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import {
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import {
  selectUnreadCount,
  useNotificationStore,
  useNotificationStoreApi,
} from '@/entities/notification'
import { useSessionStore } from '@/entities/session'
import {
  createDeck,
  createSubdeck,
  deleteDeck,
  duplicateDeck,
  moveDeck,
  setDeckArchived,
  toggleDeckFavorite,
} from '@/features/deck'
import { createFolder, deleteFolder, editFolder } from '@/features/folder'
import { DeckTree } from '@/widgets/deck-tree'
import { HomeHeader } from '@/widgets/home-header'
import { cn, dayKey, useLongPress, useStickyHeader } from '@/shared/lib'
import type { SwipeConfig } from '@/shared/config/swipe'
import {
  ActionSheet,
  AppScreen,
  Button,
  buildSwipeActions,
  ConfirmDialog,
  EmptyState,
  FolderGlyph,
  IconButton,
  PromptSheet,
  type SheetAction,
  type SwipeActionHandlers,
  SpeedDial,
  SwipeRow,
} from '@/shared/ui'
import { FolderSheet } from './FolderSheet'
import { MoveDeckSheet } from './MoveDeckSheet'

export interface DeckLibraryPageProps {
  onOpenDeck: (deckId: string) => void
  /** Open a deck's settings (from its swipe/kebab menu). */
  onOpenDeckSettings?: (deckId: string) => void
  onOpenProfile?: () => void
  onOpenNotifications?: () => void
  onOpenStreak?: () => void
  onOpenArchived?: () => void
}

const noop = () => {}

/** Which named-create sheet is open, and its target container. */
type CreatePrompt =
  | { kind: 'deck'; folderId: string | null }
  | { kind: 'subdeck'; parentId: string; parentName: string }

/** The Home library (route `/`): the home header — greeting, level + XP, streak, notifications,
 * archive — over a browse of the root: folder rows and top-level decks together, or a single
 * folder's decks when one is open. Every row carries swipe + long-press actions (no kebab); the
 * create toolbar adapts to the surface and hides on an empty view; creating a deck, subdeck, or
 * folder opens a named sheet; destructive actions confirm. */
export function DeckLibraryPage({
  onOpenDeck,
  onOpenDeckSettings,
  onOpenProfile,
  onOpenNotifications,
  onOpenStreak,
  onOpenArchived,
}: DeckLibraryPageProps) {
  const { t } = useTranslation()
  const stickyHeader = useStickyHeader()
  const folderStore = useFolderStoreApi()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const profileStore = useProfileStoreApi()
  const progressStore = useProgressStoreApi()
  const preferencesStore = usePreferencesStoreApi()
  const notificationStore = useNotificationStoreApi()

  useEffect(() => {
    folderStore.getState().start()
    deckStore.getState().start()
    cardStore.getState().start()
    profileStore.getState().start()
    progressStore.getState().start()
    preferencesStore.getState().start()
    notificationStore.getState().start()
  }, [
    folderStore,
    deckStore,
    cardStore,
    profileStore,
    progressStore,
    preferencesStore,
    notificationStore,
  ])

  const folders = useFolderStore(selectFolders)
  const decks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  const foldersReady = useFolderStore(selectFoldersReady)
  const decksReady = useDeckStore(selectDecksReady)
  const ready = foldersReady && decksReady

  const session = useSessionStore((state) => state.session)
  const profile = useProfileStore(selectEffectiveProfile)
  const progress = useProgressStore(selectProgress)
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const unreadCount = useNotificationStore(selectUnreadCount)

  const name = profile.name.trim() || session?.displayName || t('profile.guest')
  const today = dayKey(Date.now())
  const dayCount = progress?.activeDayKey === today ? progress.activeDayCount : 0

  const [folderId, setFolderId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Sheets + dialogs.
  const [createPrompt, setCreatePrompt] = useState<CreatePrompt | null>(null)
  const [folderSheetTarget, setFolderSheetTarget] = useState<Folder | null | undefined>(undefined)
  const [folderMenuOpen, setFolderMenuOpen] = useState(false)
  const [moveTarget, setMoveTarget] = useState<string | null>(null)
  const [pendingDeleteDeck, setPendingDeleteDeck] = useState<string | null>(null)
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState<string | null>(null)

  const openFolder = useMemo(() => folders.find((f) => f.id === folderId), [folders, folderId])
  const sortedFolders = useMemo(() => [...folders].sort((a, b) => a.order - b.order), [folders])
  const inFolder = openFolder != null

  const nextFolderColor =
    DECK_COLOR_OPTIONS[folders.length % DECK_COLOR_OPTIONS.length]!.value

  const deckById = (id: string) => decks.find((d) => d.id === id)
  const deletingDeck = pendingDeleteDeck ? deckById(pendingDeleteDeck) : undefined
  const deletingFolder = pendingDeleteFolder
    ? folders.find((f) => f.id === pendingDeleteFolder)
    : undefined
  const movingDeck = moveTarget ? deckById(moveTarget) : undefined

  // Content presence, per view — drives the empty state.
  const rootDeckCount = useMemo(
    () => decks.filter((d) => d.parentId === null && d.folderId === null && !d.archived).length,
    [decks],
  )
  const folderDeckCount = useMemo(
    () => decks.filter((d) => d.parentId === null && d.folderId === folderId && !d.archived).length,
    [decks, folderId],
  )
  const rootEmpty = sortedFolders.length === 0 && rootDeckCount === 0
  const isEmpty = inFolder ? folderDeckCount === 0 : rootEmpty

  // Commands.
  const submitCreate = (value: string) => {
    if (!createPrompt) return
    if (createPrompt.kind === 'deck') {
      void createDeck(deckStore, { name: value, folderId: createPrompt.folderId })
    } else {
      void createSubdeck(deckStore, createPrompt.parentId, { name: value })
      setExpanded((prev) => new Set(prev).add(createPrompt.parentId))
    }
  }

  const openCreateFolder = () => setFolderSheetTarget(null)
  const openEditFolder = (folder: Folder) => setFolderSheetTarget(folder)

  const submitFolder = (changes: { name: string; color: string; icon: string }) => {
    if (folderSheetTarget) {
      void editFolder(folderStore, folderSheetTarget, changes)
    } else {
      void createFolder(folderStore, changes)
      if (inFolder) setFolderId(null) // folders live at root; reveal the new one
    }
    setFolderSheetTarget(undefined)
  }

  const archiveDeck = (deck: Deck) => {
    void setDeckArchived(deckStore, deck.id, true)
    toast.success(t('deck.archivedToast', { name: deck.name }), {
      action: {
        label: t('common.undo'),
        onClick: () => void setDeckArchived(deckStore, deck.id, false),
      },
    })
  }

  const duplicate = (deck: Deck) => {
    void duplicateDeck(deckStore, deck.id)
    toast.success(t('deck.duplicatedToast', { name: deck.name }))
  }

  const moveDeckTo = (targetFolderId: string | null) => {
    const deck = movingDeck
    setMoveTarget(null)
    if (!deck) return
    const previous = deck.folderId ?? null
    if (targetFolderId === previous && deck.parentId === null) return
    void moveDeck(deckStore, deck.id, null, targetFolderId)
    const folderName = targetFolderId
      ? folders.find((f) => f.id === targetFolderId)?.name
      : undefined
    toast.success(
      folderName ? t('deck.movedToast', { folder: folderName }) : t('deck.unfiledToast'),
      {
        action: {
          label: t('common.undo'),
          onClick: () => void moveDeck(deckStore, deck.id, null, previous),
        },
      },
    )
  }

  const confirmDeleteDeck = () => {
    if (pendingDeleteDeck) void deleteDeck(deckStore, cardStore, pendingDeleteDeck)
    setPendingDeleteDeck(null)
  }

  const confirmDeleteFolder = () => {
    if (pendingDeleteFolder) {
      void deleteFolder(folderStore, deckStore, pendingDeleteFolder)
      if (folderId === pendingDeleteFolder) setFolderId(null)
    }
    setPendingDeleteFolder(null)
  }

  // The one action set a deck row offers, shared by its kebab, long-press sheet, and swipe.
  const deckActions = (deck: Deck): SheetAction[] => [
    {
      id: 'add-subdeck',
      label: t('deck.addSubdeck'),
      icon: <Plus className="size-5" aria-hidden />,
      onSelect: () => setCreatePrompt({ kind: 'subdeck', parentId: deck.id, parentName: deck.name }),
    },
    {
      id: 'favorite',
      label: deck.favorite ? t('deck.unfavorite') : t('deck.favorite'),
      icon: (
        <Heart
          className={cn('size-5', deck.favorite && 'fill-current text-favorite')}
          aria-hidden
        />
      ),
      onSelect: () => void toggleDeckFavorite(deckStore, deck.id),
    },
    {
      id: 'move',
      label: t('deck.move'),
      icon: <FolderInput className="size-5" aria-hidden />,
      onSelect: () => setMoveTarget(deck.id),
    },
    {
      id: 'settings',
      label: t('deck.settings'),
      icon: <Settings2 className="size-5" aria-hidden />,
      onSelect: () => onOpenDeckSettings?.(deck.id),
    },
    {
      id: 'duplicate',
      label: t('deck.duplicate'),
      icon: <Copy className="size-5" aria-hidden />,
      onSelect: () => duplicate(deck),
    },
    {
      id: 'archive',
      label: t('deck.archive'),
      icon: <Archive className="size-5" aria-hidden />,
      onSelect: () => archiveDeck(deck),
    },
    {
      id: 'delete',
      label: t('common.delete'),
      icon: <Trash2 className="size-5" aria-hidden />,
      destructive: true,
      onSelect: () => setPendingDeleteDeck(deck.id),
    },
  ]

  const deckSwipeHandlers = (deck: Deck): SwipeActionHandlers => ({
    favorite: {
      onAction: () => void toggleDeckFavorite(deckStore, deck.id),
      label: deck.favorite ? t('deck.unfavorite') : t('deck.favorite'),
    },
    move: { onAction: () => setMoveTarget(deck.id) },
    settings: { onAction: () => onOpenDeckSettings?.(deck.id) },
    duplicate: { onAction: () => duplicate(deck) },
    archive: { onAction: () => archiveDeck(deck) },
    delete: { onAction: () => setPendingDeleteDeck(deck.id) },
  })

  const folderActions = (folder: Folder): SheetAction[] => [
    {
      id: 'settings',
      label: t('folder.settings'),
      icon: <Settings2 className="size-5" aria-hidden />,
      onSelect: () => openEditFolder(folder),
    },
    {
      id: 'add-deck',
      label: t('folder.addDeck'),
      icon: <Plus className="size-5" aria-hidden />,
      onSelect: () => setCreatePrompt({ kind: 'deck', folderId: folder.id }),
    },
    {
      id: 'delete',
      label: t('common.delete'),
      icon: <Trash2 className="size-5" aria-hidden />,
      destructive: true,
      onSelect: () => setPendingDeleteFolder(folder.id),
    },
  ]

  const folderSwipeHandlers = (folder: Folder): SwipeActionHandlers => ({
    edit: { onAction: () => openEditFolder(folder) },
    delete: { onAction: () => setPendingDeleteFolder(folder.id) },
  })

  return (
    <AppScreen
      className="pb-nav"
      scrollRef={stickyHeader.ref}
      header={
        inFolder ? (
          <header className="bg-glass pt-safe">
            <div className="flex items-center gap-2 px-2 py-2">
              <IconButton
                variant="glass"
                aria-label={t('common.back')}
                onClick={() => setFolderId(null)}
              >
                <ChevronLeft className="size-5" aria-hidden />
              </IconButton>
              <h1 className="min-w-0 flex-1 truncate text-center text-[length:var(--p-text-title)] font-semibold text-heading">
                {openFolder?.name}
              </h1>
              <IconButton
                variant="glass"
                aria-label={t('folder.rowActions', { name: openFolder?.name ?? '' })}
                onClick={() => setFolderMenuOpen(true)}
              >
                <MoreVertical className="size-5" aria-hidden />
              </IconButton>
            </div>
          </header>
        ) : (
          <HomeHeader
            header={stickyHeader}
            name={name}
            avatar={profile.avatar}
            xp={progress?.xp ?? 0}
            unreadCount={unreadCount}
            onOpenProfile={onOpenProfile ?? noop}
            onOpenNotifications={onOpenNotifications ?? noop}
            onOpenArchived={onOpenArchived}
            streak={
              onOpenStreak
                ? { count: progress?.streakCount ?? 0, dayCount, dailyGoal: prefs.dailyGoal }
                : undefined
            }
            onOpenStreak={onOpenStreak}
          />
        )
      }
    >
      {!ready ? (
        <LibrarySkeleton />
      ) : isEmpty ? (
        <EmptyState
          emoji={inFolder ? '📂' : '🗂️'}
          title={inFolder ? t('library.emptyFolderTitle') : t('library.emptyTitle')}
          description={inFolder ? t('library.emptyFolderHint') : t('library.emptyHint')}
          action={
            <div className="flex w-full max-w-60 flex-col gap-2">
              <Button
                onClick={() =>
                  setCreatePrompt({ kind: 'deck', folderId: inFolder ? folderId : null })
                }
              >
                <Plus className="size-[18px]" aria-hidden />
                {inFolder ? t('folder.addDeck') : t('deck.newDeck')}
              </Button>
              {!inFolder ? (
                <Button variant="secondary" onClick={openCreateFolder}>
                  <FolderPlus className="size-[18px]" aria-hidden />
                  {t('deck.newFolder')}
                </Button>
              ) : null}
            </div>
          }
        />
      ) : (
        <div className="pt-2">
          {!inFolder
            ? sortedFolders.map((folder) => (
                <FolderRow
                  key={folder.id}
                  folder={folder}
                  onOpen={() => setFolderId(folder.id)}
                  actions={folderActions(folder)}
                  swipe={prefs.swipe.folder}
                  swipeHandlers={folderSwipeHandlers(folder)}
                />
              ))
            : null}

          <DeckTree
            decks={decks}
            cards={cards}
            expanded={expanded}
            onToggle={toggle}
            onOpen={onOpenDeck}
            parentId={null}
            folderId={inFolder ? (folderId as string) : null}
            deckActions={deckActions}
            swipe={prefs.swipe.deck}
            swipeHandlers={deckSwipeHandlers}
          />
        </div>
      )}

      {/* The create toolbar adapts to the surface: hidden on an empty view (the empty state owns
          the create action), a single "Add deck" inside a folder (no misleading "New folder"
          there), and the full deck-or-folder dial at the root. */}
      {!isEmpty ? (
        <SpeedDial
          label={t('deck.create')}
          actions={
            inFolder
              ? [
                  {
                    id: 'new-deck',
                    label: t('folder.addDeck'),
                    icon: <Layers className="size-5" aria-hidden />,
                    onSelect: () => setCreatePrompt({ kind: 'deck', folderId }),
                  },
                ]
              : [
                  {
                    id: 'new-deck',
                    label: t('deck.newDeck'),
                    icon: <Layers className="size-5" aria-hidden />,
                    onSelect: () => setCreatePrompt({ kind: 'deck', folderId: null }),
                  },
                  {
                    id: 'new-folder',
                    label: t('deck.newFolder'),
                    icon: <FolderPlus className="size-5" aria-hidden />,
                    onSelect: openCreateFolder,
                  },
                ]
          }
        />
      ) : null}

      {/* The open folder's own menu, from the header ⋮ — settings, add a deck, delete. */}
      <ActionSheet
        open={folderMenuOpen}
        onOpenChange={setFolderMenuOpen}
        title={openFolder?.name ?? ''}
        actions={openFolder ? folderActions(openFolder) : []}
        cancelLabel={t('common.cancel')}
      />

      <PromptSheet
        open={createPrompt !== null}
        onOpenChange={(open) => {
          if (!open) setCreatePrompt(null)
        }}
        title={createPrompt?.kind === 'subdeck' ? t('deck.newSubdeck') : t('deck.newDeck')}
        description={
          createPrompt?.kind === 'subdeck'
            ? t('deck.subdeckOf', { name: createPrompt.parentName })
            : undefined
        }
        fieldLabel={t('deck.nameLabel')}
        placeholder={t('deck.namePlaceholder')}
        confirmLabel={t('deck.create')}
        onSubmit={submitCreate}
      />

      <FolderSheet
        open={folderSheetTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setFolderSheetTarget(undefined)
        }}
        folder={folderSheetTarget}
        defaultColor={nextFolderColor}
        onSubmit={submitFolder}
      />

      <MoveDeckSheet
        open={moveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setMoveTarget(null)
        }}
        deckName={movingDeck?.name ?? ''}
        currentFolderId={movingDeck?.folderId ?? null}
        folders={sortedFolders}
        onPick={moveDeckTo}
        onNewFolder={() => {
          setMoveTarget(null)
          openCreateFolder()
        }}
      />

      <ConfirmDialog
        open={pendingDeleteDeck !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteDeck(null)
        }}
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('deck.deleteTitle', { name: deletingDeck?.name ?? '' })}
        description={t('deck.deleteBody')}
        confirmLabel={t('deck.confirmDelete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmDeleteDeck}
      />

      <ConfirmDialog
        open={pendingDeleteFolder !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteFolder(null)
        }}
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('folder.deleteTitle', { name: deletingFolder?.name ?? '' })}
        description={t('folder.deleteBody')}
        confirmLabel={t('folder.confirmDelete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmDeleteFolder}
      />
    </AppScreen>
  )
}

interface FolderRowProps {
  folder: Folder
  onOpen: () => void
  actions: SheetAction[]
  swipe: SwipeConfig
  swipeHandlers: SwipeActionHandlers
}

/** A folder row on the library root: its coloured glyph + name, a chevron to drill in, and its
 * gesture kit — swipe (edit/delete) and long-press (the full action sheet). */
function FolderRow({ folder, onOpen, actions, swipe, swipeHandlers }: FolderRowProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const longPress = useLongPress({
    onLongPress: () => setMenuOpen(true),
    onTap: onOpen,
  })
  const { leading, trailing } = buildSwipeActions(swipe, swipeHandlers, t)
  const swipeEnabled = leading.length > 0 || trailing.length > 0

  const row = (
    <div className="flex w-full items-center gap-1 border-b border-border bg-card py-3 pr-1">
      <button
        type="button"
        {...longPress}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <FolderGlyph
          color={folder.color}
          icon={folder.icon || DEFAULT_FOLDER_ICON}
          className="size-11"
          iconClassName="text-xl leading-none"
        />
        <span className="min-w-0 flex-1 truncate text-[length:var(--p-text-body)] font-semibold text-heading">
          {folder.name}
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </div>
  )

  return (
    <>
      {swipeEnabled ? (
        <SwipeRow leading={leading} trailing={trailing}>
          {row}
        </SwipeRow>
      ) : (
        row
      )}
      <ActionSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title={folder.name}
        actions={actions}
        cancelLabel={t('common.cancel')}
      />
    </>
  )
}

/** Hydration skeleton: a few pulsing rows so the list has structure before RxDB resolves,
 * instead of a bare spinner. */
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
