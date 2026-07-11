import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, FolderPlus, Layers, Plus, Trash2 } from 'lucide-react'
import {
  selectFolders,
  selectIsReady as selectFoldersReady,
  useFolderStore,
  useFolderStoreApi,
} from '@/entities/folder'
import {
  selectDecks,
  selectIsReady as selectDecksReady,
  useDeckStore,
  useDeckStoreApi,
} from '@/entities/deck'
import { selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { createDeck, createSubdeck, deleteDeck } from '@/features/deck'
import { createFolder, deleteFolder } from '@/features/folder'
import { DEFAULT_FOLDER_ICON } from '@/entities/folder'
import { DeckTree } from '@/widgets/deck-tree'
import { AppScreen, IconButton, OverflowMenuButton, SpeedDial } from '@/shared/ui'

export interface DeckLibraryPageProps {
  onOpenDeck: (deckId: string) => void
}

/** The Home library (route `/`): a browse of the root — folder cards and top-level decks
 * together. Tapping a folder drills into it; a deck row expands its subdecks inline or opens
 * the deck. */
export function DeckLibraryPage({ onOpenDeck }: DeckLibraryPageProps) {
  const { t } = useTranslation()
  const folderStore = useFolderStoreApi()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()

  useEffect(() => {
    folderStore.getState().start()
    deckStore.getState().start()
    cardStore.getState().start()
  }, [folderStore, deckStore, cardStore])

  const folders = useFolderStore(selectFolders)
  const decks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  const foldersReady = useFolderStore(selectFoldersReady)
  const decksReady = useDeckStore(selectDecksReady)
  const ready = foldersReady && decksReady

  const [folderId, setFolderId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const openFolder = useMemo(() => folders.find((f) => f.id === folderId), [folders, folderId])
  const sortedFolders = useMemo(() => [...folders].sort((a, b) => a.order - b.order), [folders])

  const removeFolder = (id: string) => void deleteFolder(folderStore, deckStore, id)

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  const inFolder = openFolder != null

  return (
    <AppScreen
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
              <span className="size-10" aria-hidden />
            </div>
          </header>
        ) : (
          <header className="bg-glass pt-safe">
            <div className="px-4 py-3">
              <h1 className="text-[length:var(--p-text-headline)] font-bold text-heading">
                {t('nav.home')}
              </h1>
            </div>
          </header>
        )
      }
    >
      <div className="space-y-1 pb-28">
        {!inFolder
          ? sortedFolders.map((folder) => (
              <div
                key={folder.id}
                className="flex w-full items-center gap-1 border-b border-border py-3"
              >
                <button
                  type="button"
                  onClick={() => setFolderId(folder.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-card bg-info-surface text-2xl">
                    {folder.icon || '📁'}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[length:var(--p-text-body)] font-semibold text-heading">
                    {folder.name}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </button>
                <OverflowMenuButton
                  label={t('common.moreOptions')}
                  actions={[
                    {
                      id: 'add-deck',
                      label: t('deck.addDeck', { defaultValue: 'Add deck' }),
                      icon: <Plus className="size-4" aria-hidden />,
                      onSelect: () =>
                        void createDeck(deckStore, {
                          name: t('deck.newDeck'),
                          folderId: folder.id,
                        }),
                    },
                    {
                      id: 'delete',
                      label: t('common.delete'),
                      icon: <Trash2 className="size-4" aria-hidden />,
                      destructive: true,
                      onSelect: () => removeFolder(folder.id),
                    },
                  ]}
                />
              </div>
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
          deckActions={(d) => [
            {
              id: 'add-subdeck',
              label: t('deck.addSubdeck'),
              icon: <Plus className="size-4" aria-hidden />,
              onSelect: () => void createSubdeck(deckStore, d.id, { name: t('deck.newSubdeck') }),
            },
            {
              id: 'delete',
              label: t('common.delete'),
              icon: <Trash2 className="size-4" aria-hidden />,
              destructive: true,
              onSelect: () => void deleteDeck(deckStore, cardStore, d.id),
            },
          ]}
        />
      </div>

      <SpeedDial
        label={t('deck.create')}
        actions={[
          {
            id: 'new-deck',
            label: t('deck.newDeck'),
            icon: <Layers className="size-5" aria-hidden />,
            onSelect: () =>
              void createDeck(deckStore, { name: t('deck.newDeck'), folderId: folderId ?? null }),
          },
          {
            id: 'new-folder',
            label: t('deck.newFolder'),
            icon: <FolderPlus className="size-5" aria-hidden />,
            onSelect: () =>
              void createFolder(folderStore, {
                name: t('deck.newFolder'),
                color: '',
                icon: DEFAULT_FOLDER_ICON,
              }),
          },
        ]}
      />
    </AppScreen>
  )
}
