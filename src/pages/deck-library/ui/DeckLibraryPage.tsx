import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { MoreVertical, Plus, Settings, Trash2 } from 'lucide-react'
import type { Deck } from '@/entities/deck'
import { DECK_COLOR_OPTIONS, useDeckStoreApi } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import { useFolderStoreApi } from '@/entities/folder'
import { selectEffectivePreferences, usePreferencesStore } from '@/entities/preferences'
import { createDeck, createSubdeck } from '@/features/deck'
import { createFolder, editFolder } from '@/features/folder'
import { readAnkiFile } from '@/features/content'
import { DeckTree, LibrarySelectList } from '@/widgets/deck-tree'
import { HomeHeader } from '@/widgets/home-header'
import { useImportDraft } from '@/widgets/content-editor'
import { importErrorMessage, nextDefaultName, useHideAppNav } from '@/shared/lib'
import {
  ActionSheet,
  AppScreen,
  IconButton,
  ImportSheet,
  PromptSheet,
  ScreenHeader,
  SelectHeader,
  SelectToolbar,
  SelectToolbarDock,
  type SheetAction,
  type SwipeActionHandlers,
} from '@/shared/ui'
import { isMove, movingDeck } from '../model/pending-act'
import { useHomeHeaderData } from '../model/use-home-header-data'
import { useLibrary } from '../model/use-library'
import { FolderRow } from './FolderRow'
import { FolderSheet } from './FolderSheet'
import { LibraryDialogs } from './LibraryDialogs'
import { LibraryEmpty } from './LibraryEmpty'
import { LibrarySkeleton } from './LibrarySkeleton'
import { LibrarySpeedDial } from './LibrarySpeedDial'
import { MoveDeckSheet } from './MoveDeckSheet'

export interface DeckLibraryPageProps {
  folderId: string | null
  onOpenFolder: (folderId: string) => void
  onCloseFolder: () => void
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
  const deckStore = useDeckStoreApi()
  const folderStore = useFolderStoreApi()
  const setImportDraft = useImportDraft((s) => s.setDraft)
  const canImport = Boolean(onImportPaste)
  const inFolder = folderId !== null

  const library = useLibrary(folderId, onFolderGone)
  const { decks, folders, selection, act } = library
  const header = useHomeHeaderData()
  const prefs = usePreferencesStore(selectEffectivePreferences)

  const [createPrompt, setCreatePrompt] = useState<CreatePrompt | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [folderSheetTarget, setFolderSheetTarget] = useState<Folder | null | undefined>(undefined)
  const [folderMenuOpen, setFolderMenuOpen] = useState(false)

  useHideAppNav(selection.active)

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
      library.expand(createPrompt.parentId)
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
      void editFolder(folderStore, folderSheetTarget.id, changes)
    } else {
      void createFolder(folderStore, changes)
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
      toast.error(importErrorMessage(error, t('cards.transfer.importFailed')))
    }
  }

  const deckSwipeHandlers = (deck: Deck): SwipeActionHandlers => ({
    favorite: {
      onAction: () => act.toggleFavorite(deck),
      label: deck.favorite ? t('deck.unfavorite') : t('deck.favorite'),
    },
    move: { onAction: () => library.request({ kind: 'move-deck', deck }) },
    settings: { onAction: () => onOpenDeckSettings?.(deck.id) },
    addSubdeck: {
      onAction: () =>
        setCreatePrompt({ kind: 'subdeck', parentId: deck.id, parentName: deck.name }),
    },
    duplicate: { onAction: () => act.duplicate(deck) },
    archive: { onAction: () => act.archiveDeck(deck) },
    delete: { onAction: () => library.request({ kind: 'delete-deck', deck }) },
  })

  const folderSwipeHandlers = (folder: Folder): SwipeActionHandlers => ({
    edit: { onAction: () => setFolderSheetTarget(folder) },
    addDeck: { onAction: () => setCreatePrompt({ kind: 'deck', folderId: folder.id }) },
    delete: { onAction: () => library.request({ kind: 'delete-folder', folder }) },
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
      onSelect: () => library.request({ kind: 'delete-folder', folder }),
    },
  ]

  const newDeckHere = () => setCreatePrompt({ kind: 'deck', folderId })
  const moving = movingDeck(library.pending)

  return (
    <AppScreen
      className="pb-nav"
      header={
        selection.active ? (
          <SelectHeader selection={selection} />
        ) : inFolder ? (
          <ScreenHeader
            title={library.openFolder?.name ?? ''}
            onBack={onCloseFolder}
            backLabel={t('common.back')}
            action={
              <IconButton
                variant="glass"
                aria-label={t('folder.rowActions', { name: library.openFolder?.name ?? '' })}
                onClick={() => setFolderMenuOpen(true)}
              >
                <MoreVertical className="size-5" aria-hidden />
              </IconButton>
            }
          />
        ) : (
          <HomeHeader
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
      {!library.ready ? (
        <LibrarySkeleton />
      ) : library.isEmpty ? (
        <LibraryEmpty
          inFolder={inFolder}
          canImport={canImport}
          onCreateDeck={newDeckHere}
          onImport={() => setImportOpen(true)}
        />
      ) : selection.active ? (
        <LibrarySelectList
          folders={library.sectionFolders}
          decks={library.sectionDecks}
          allDecks={decks}
          cards={library.cards}
          folderDeckCounts={library.folderDeckCounts}
          selectedIds={selection.ids}
          onToggleSelect={selection.toggle}
          onReorderFolders={act.reorderFolderIds}
          onReorderDecks={act.reorderDeckIds}
          onFileDecks={act.fileDecksIntoFolder}
        />
      ) : (
        <div className="flex flex-col gap-2 pt-2">
          {library.sectionFolders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              deckCount={library.folderDeckCounts.get(folder.id) ?? 0}
              onOpen={() => onOpenFolder(folder.id)}
              onRequestSelect={() => selection.begin(folder.id)}
              swipe={prefs.swipe.folder}
              swipeHandlers={folderSwipeHandlers(folder)}
            />
          ))}

          <DeckTree
            rows={library.rows}
            decks={decks}
            cards={library.cards}
            expanded={library.expanded}
            onToggle={library.toggleExpanded}
            onOpen={onOpenDeck}
            onRequestSelect={selection.begin}
            swipe={prefs.swipe.deck}
            swipeHandlers={deckSwipeHandlers}
          />
        </div>
      )}

      {selection.active ? (
        <SelectToolbarDock>
          <SelectToolbar actions={prefs.selectToolbar.library} handlers={library.selectHandlers} />
        </SelectToolbarDock>
      ) : null}

      {!library.isEmpty && !selection.active ? (
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
        title={library.openFolder?.name ?? ''}
        actions={library.openFolder ? folderActions(library.openFolder) : []}
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

      <ImportSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        title={t('deck.importTitle')}
        description={t('deck.importSheetHint')}
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
        open={isMove(library.pending)}
        onOpenChange={(open) => {
          if (!open) library.dismiss()
        }}
        subtitle={moving ? moving.name : t('selection.count', { count: selection.deckIds.length })}
        decks={decks}
        folders={folders}
        excludeIds={library.moveExcludeIds}
        onPick={library.confirm}
        onNewFolder={() => {
          library.dismiss()
          setFolderSheetTarget(null)
        }}
      />

      <LibraryDialogs
        pending={library.pending}
        count={selection.count}
        onDismiss={library.dismiss}
        onConfirm={library.confirm}
      />
    </AppScreen>
  )
}
