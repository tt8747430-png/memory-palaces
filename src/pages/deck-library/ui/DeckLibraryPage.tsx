import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus, Settings, Trash2 } from 'lucide-react'
import type { Deck } from '@/entities/deck'
import { DECK_COLOR_OPTIONS, useDeckStoreApi } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import { useFolderStoreApi } from '@/entities/folder'
import { createDeck, createSubdeck } from '@/features/deck'
import { createFolder, editFolder } from '@/features/folder'
import { readAnkiFile } from '@/features/content'
import { DeckTree, LibrarySelectList } from '@/widgets/deck-tree'
import { HomeHeader } from '@/widgets/home-header'
import { useImportDraft } from '@/widgets/content-editor'
import { ContentImportError, nextDefaultName, useHideAppNav, useStickyHeader } from '@/shared/lib'
import {
  ActionSheet,
  AppScreen,
  PromptSheet,
  SelectHeader,
  SelectToolbar,
  SelectToolbarDock,
  type SheetAction,
  type SwipeActionHandlers,
} from '@/shared/ui'
import { moveExclusions, useLibraryActions } from '../model/use-library-actions'
import { useHomeHeaderData } from '../model/use-home-header-data'
import { useLibraryData } from '../model/use-library-data'
import { useLibrarySelection } from '../model/use-library-selection'
import { FolderScopeHeader } from './FolderScopeHeader'
import { FolderRow } from './FolderRow'
import { FolderSheet } from './FolderSheet'
import { LibraryDialogs } from './LibraryDialogs'
import { LibraryEmpty } from './LibraryEmpty'
import { LibraryImportSheet } from './LibraryImportSheet'
import { LibrarySkeleton } from './LibrarySkeleton'
import { LibrarySpeedDial } from './LibrarySpeedDial'
import type { MoveDestination } from './MoveDeckSheet'
import { MoveDeckSheet } from './MoveDeckSheet'

export interface DeckLibraryPageProps {
  /** The folder this view is scoped to, or `null` for the unfiled root (home). */
  folderId: string | null
  onOpenFolder: (folderId: string) => void
  onCloseFolder: () => void
  /** The scoped folder no longer exists — deleted from inside it, or a stale link. */
  onFolderGone: () => void
  onOpenDeck: (deckId: string) => void
  onOpenDeckSettings?: (deckId: string) => void
  onImportPaste?: () => void
  onReviewDeck?: (deckId: string) => void
  onOpenProfile?: () => void
  onOpenNotifications?: () => void
  onOpenStreak?: () => void
  onOpenArchived?: () => void
}

const noop = () => {}

function deckNameFromFile(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim() || 'Imported'
  )
}

type CreatePrompt =
  | { kind: 'deck'; folderId: string | null }
  | { kind: 'subdeck'; parentId: string; parentName: string }

export function DeckLibraryPage({
  folderId,
  onOpenFolder,
  onCloseFolder,
  onFolderGone,
  onOpenDeck,
  onOpenDeckSettings,
  onImportPaste,
  onReviewDeck,
  onOpenProfile,
  onOpenNotifications,
  onOpenStreak,
  onOpenArchived,
}: DeckLibraryPageProps) {
  const { t } = useTranslation()
  const stickyHeader = useStickyHeader()
  const deckStore = useDeckStoreApi()
  const folderStore = useFolderStoreApi()
  const setImportDraft = useImportDraft((s) => s.setDraft)
  const canImport = Boolean(onImportPaste)
  const inFolder = folderId !== null

  const data = useLibraryData(folderId)
  const header = useHomeHeaderData()
  const { decks, folders } = data
  const prefs = header.prefs

  const [createPrompt, setCreatePrompt] = useState<CreatePrompt | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [folderSheetTarget, setFolderSheetTarget] = useState<Folder | null | undefined>(undefined)
  const [folderMenuOpen, setFolderMenuOpen] = useState(false)
  const [moveTarget, setMoveTarget] = useState<string | null>(null)
  const [pendingDeleteDeck, setPendingDeleteDeck] = useState<string | null>(null)
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState<string | null>(null)
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const selection = useLibrarySelection({
    decks,
    folderIds: data.folderIds,
    sectionFolders: data.sectionFolders,
    sectionDecks: data.sectionDecks,
    scope: folderId,
  })

  const actions = useLibraryActions({
    decks,
    folders,
    folderId,
    selection,
    patchDecks: data.patchDecks,
    patchFolders: data.patchFolders,
    onFolderGone,
    onRequestBulkMove: () => setBulkMoveOpen(true),
    onRequestBulkDelete: () => setBulkDeleteOpen(true),
  })

  // The select toolbar docks exactly where the tab bar lives, so the bar steps aside for it.
  useHideAppNav(selection.active)

  // Once the folders are in and this one isn't among them, the route is pointing at nothing.
  useEffect(() => {
    if (inFolder && data.foldersReady && !data.openFolder) onFolderGone()
  }, [inFolder, data.foldersReady, data.openFolder, onFolderGone])

  const deckById = (id: string) => decks.find((d) => d.id === id)
  const movingDeck = moveTarget ? deckById(moveTarget) : undefined
  const moveExcludeIds = useMemo(
    () => moveExclusions(decks, bulkMoveOpen ? selection.deckIds : moveTarget ? [moveTarget] : []),
    [decks, bulkMoveOpen, selection.deckIds, moveTarget],
  )

  // ---- Create ----
  const defaultCreateName = useMemo(() => {
    if (!createPrompt) return ''
    if (createPrompt.kind === 'subdeck') {
      const siblings = decks.filter((d) => d.parentId === createPrompt.parentId).map((d) => d.name)
      return nextDefaultName(t('deck.baseSubdeckName'), siblings)
    }
    const siblings = decks
      .filter(
        (d) => d.parentId === null && (d.folderId ?? null) === (createPrompt.folderId ?? null),
      )
      .map((d) => d.name)
    return nextDefaultName(t('deck.baseDeckName'), siblings)
  }, [createPrompt, decks, t])

  const submitCreate = (value: string) => {
    if (!createPrompt) return
    if (createPrompt.kind === 'subdeck') {
      void createSubdeck(deckStore, createPrompt.parentId, { name: value })
      data.expand(createPrompt.parentId)
      return
    }
    void createDeck(deckStore, { name: value, folderId: createPrompt.folderId })
  }

  const nextFolderColor = DECK_COLOR_OPTIONS[folders.length % DECK_COLOR_OPTIONS.length]!.value
  const defaultFolderName = useMemo(
    () =>
      nextDefaultName(
        t('folder.baseName'),
        folders.map((f) => f.name),
      ),
    [folders, t],
  )

  const submitFolder = (changes: { name: string; color: string; icon: string }) => {
    if (folderSheetTarget) {
      void editFolder(folderStore, folderSheetTarget, changes)
    } else {
      void createFolder(folderStore, changes)
      // A new folder is a sibling of the one you are standing in, so step back out to see it.
      if (inFolder) onCloseFolder()
    }
    setFolderSheetTarget(undefined)
  }

  const importAnki = async (file: File) => {
    try {
      const parsed = await readAnkiFile(file)
      if (parsed.cards.length === 0) {
        toast.error(t('cards.transfer.noCardsFound'))
        return
      }
      const deck = await createDeck(deckStore, { name: deckNameFromFile(file.name) })
      setImportDraft('anki', parsed.cards)
      onReviewDeck?.(deck.id)
    } catch (error) {
      toast.error(
        error instanceof ContentImportError ? error.message : t('cards.transfer.importFailed'),
      )
    }
  }

  // ---- Row actions ----
  const deckSwipeHandlers = (deck: Deck): SwipeActionHandlers => ({
    favorite: {
      onAction: () => void actions.toggleFavorite(deck),
      label: deck.favorite ? t('deck.unfavorite') : t('deck.favorite'),
    },
    move: { onAction: () => setMoveTarget(deck.id) },
    settings: { onAction: () => onOpenDeckSettings?.(deck.id) },
    addSubdeck: {
      onAction: () =>
        setCreatePrompt({ kind: 'subdeck', parentId: deck.id, parentName: deck.name }),
    },
    duplicate: { onAction: () => actions.duplicate(deck) },
    archive: { onAction: () => actions.archiveDeck(deck) },
    delete: { onAction: () => setPendingDeleteDeck(deck.id) },
  })

  const folderSwipeHandlers = (folder: Folder): SwipeActionHandlers => ({
    edit: { onAction: () => setFolderSheetTarget(folder) },
    addDeck: { onAction: () => setCreatePrompt({ kind: 'deck', folderId: folder.id }) },
    delete: { onAction: () => setPendingDeleteFolder(folder.id) },
  })

  const folderActions = (folder: Folder): SheetAction[] => [
    {
      id: 'settings',
      label: t('folder.settings'),
      icon: <Settings className="size-5" aria-hidden />,
      onSelect: () => setFolderSheetTarget(folder),
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

  const newDeckHere = () => setCreatePrompt({ kind: 'deck', folderId })

  return (
    <AppScreen
      className="pb-nav"
      scrollRef={stickyHeader.ref}
      header={
        selection.active ? (
          <SelectHeader
            count={selection.count}
            allSelected={selection.allSelected}
            onToggleAll={selection.toggleAll}
            onCancel={selection.exit}
          />
        ) : inFolder ? (
          <FolderScopeHeader
            name={data.openFolder?.name ?? ''}
            onBack={onCloseFolder}
            onOpenMenu={() => setFolderMenuOpen(true)}
          />
        ) : (
          <HomeHeader
            header={stickyHeader}
            name={header.name}
            avatar={header.avatar}
            xp={header.xp}
            unreadCount={header.unreadCount}
            onOpenProfile={onOpenProfile ?? noop}
            onOpenNotifications={onOpenNotifications ?? noop}
            onOpenArchived={onOpenArchived}
            streak={onOpenStreak ? header.streak : undefined}
            onOpenStreak={onOpenStreak}
          />
        )
      }
    >
      {!data.ready ? (
        <LibrarySkeleton />
      ) : data.isEmpty ? (
        <LibraryEmpty
          inFolder={inFolder}
          canImport={canImport}
          onCreateDeck={newDeckHere}
          onImport={() => setImportOpen(true)}
        />
      ) : selection.active ? (
        /* Selecting flattens the library: folders, then decks, no nesting on screen. Every row
           is a peer of every other in its section, so the reorder the drag animates is the
           reorder the drop performs — and a deck released over a folder files itself there. */
        <LibrarySelectList
          folders={data.sectionFolders}
          decks={data.sectionDecks}
          allDecks={decks}
          cards={data.cards}
          folderDeckCounts={data.folderDeckCounts}
          selectedIds={selection.ids}
          onToggleSelect={selection.toggle}
          onReorderFolders={actions.reorderFolderIds}
          onReorderDecks={actions.reorderDeckIds}
          onFileDecks={actions.fileDecksIntoFolder}
        />
      ) : (
        <div className="flex flex-col gap-2 pt-2">
          {data.sectionFolders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              deckCount={data.folderDeckCounts.get(folder.id) ?? 0}
              onOpen={() => onOpenFolder(folder.id)}
              onRequestSelect={() => selection.beginFolder(folder.id)}
              swipe={prefs.swipe.folder}
              swipeHandlers={folderSwipeHandlers(folder)}
            />
          ))}

          <DeckTree
            rows={data.rows}
            decks={decks}
            cards={data.cards}
            expanded={data.expanded}
            onToggle={data.toggleExpanded}
            onOpen={onOpenDeck}
            onRequestSelect={selection.beginDeck}
            swipe={prefs.swipe.deck}
            swipeHandlers={deckSwipeHandlers}
          />
        </div>
      )}

      {selection.active ? (
        <SelectToolbarDock>
          <SelectToolbar actions={prefs.selectToolbar.library} handlers={actions.selectHandlers} />
        </SelectToolbarDock>
      ) : null}

      {!data.isEmpty && !selection.active ? (
        <LibrarySpeedDial
          inFolder={inFolder}
          canImport={canImport}
          onNewDeck={newDeckHere}
          onImport={() => setImportOpen(true)}
          onNewFolder={() => setFolderSheetTarget(null)}
        />
      ) : null}

      <ActionSheet
        open={folderMenuOpen}
        onOpenChange={setFolderMenuOpen}
        title={data.openFolder?.name ?? ''}
        actions={data.openFolder ? folderActions(data.openFolder) : []}
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
        initialValue={defaultCreateName}
        confirmLabel={t('deck.create')}
        onSubmit={submitCreate}
      />

      <LibraryImportSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        onPasteNotes={() => onImportPaste?.()}
        onPickFile={(file) => void importAnki(file)}
      />

      <FolderSheet
        open={folderSheetTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setFolderSheetTarget(undefined)
        }}
        folder={folderSheetTarget}
        defaultColor={nextFolderColor}
        defaultName={defaultFolderName}
        onSubmit={submitFolder}
      />

      <MoveDeckSheet
        open={moveTarget !== null || bulkMoveOpen}
        onOpenChange={(open) => {
          if (!open) {
            setMoveTarget(null)
            setBulkMoveOpen(false)
          }
        }}
        subtitle={
          bulkMoveOpen
            ? t('selection.count', { count: selection.deckIds.length })
            : (movingDeck?.name ?? '')
        }
        decks={decks}
        folders={data.sortedFolders}
        excludeIds={moveExcludeIds}
        onPick={(dest: MoveDestination) => {
          if (bulkMoveOpen) {
            setBulkMoveOpen(false)
            actions.bulkMoveTo(dest)
            return
          }
          const deck = movingDeck
          setMoveTarget(null)
          if (deck) actions.moveDeckTo(deck, dest)
        }}
        onNewFolder={() => {
          setMoveTarget(null)
          setBulkMoveOpen(false)
          setFolderSheetTarget(null)
        }}
      />

      <LibraryDialogs
        deckName={pendingDeleteDeck ? (deckById(pendingDeleteDeck)?.name ?? '') : null}
        onCloseDeck={() => setPendingDeleteDeck(null)}
        onConfirmDeck={() => {
          if (pendingDeleteDeck) actions.removeDeck(pendingDeleteDeck)
          setPendingDeleteDeck(null)
        }}
        folderName={
          pendingDeleteFolder
            ? (folders.find((f) => f.id === pendingDeleteFolder)?.name ?? '')
            : null
        }
        onCloseFolder={() => setPendingDeleteFolder(null)}
        onConfirmFolder={() => {
          if (pendingDeleteFolder) actions.removeFolder(pendingDeleteFolder)
          setPendingDeleteFolder(null)
        }}
        bulkCount={bulkDeleteOpen ? selection.count : null}
        onCloseBulk={() => setBulkDeleteOpen(false)}
        onConfirmBulk={() => {
          setBulkDeleteOpen(false)
          actions.confirmBulkDelete()
        }}
      />
    </AppScreen>
  )
}
