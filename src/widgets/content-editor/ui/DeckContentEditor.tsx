import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Upload } from 'lucide-react'
import { type Card, selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { type LearningAlgorithm, selectDecks, useDeckStore } from '@/entities/deck'
import { selectFolders, useFolderStore } from '@/entities/folder'
import { reorderCards } from '@/features/card'
import {
  type ContentSort,
  selectEffectivePreferences,
  usePreferencesStore,
} from '@/entities/preferences'
import {
  cardMaturityCounts,
  cardsInSubtree,
  CONTENT_SORTS,
  findEntity,
  type MultiSelect,
  useExtensionPoint,
  usePendingAct,
} from '@/shared/lib'
import {
  CardMaturityOverview,
  ConfirmDialog,
  ImportSheet,
  SelectToolbar,
  SelectToolbarDock,
  SortControl,
  SpeedDial,
  useContentSortOptions,
} from '@/shared/ui'
import { type MoveDestination, MoveSheet } from '@/widgets/deck-tree'
import { filterCards, sortCards } from '../model/card-list'
import { useCardActions } from '../model/use-card-actions'
import { useCardCommands } from '../model/use-card-commands'
import { useImportFile } from '../model/use-import-file'
import { useCardFilter } from '../model/use-card-filter'
import { CardBrowser } from './CardBrowser'
import { CardFilterSheet, FilterButton } from './CardFilterSheet'
import { EmptyCards, FilterEmpty, NoResults } from './CardListStates'
import { CardActionsSheet } from './CardActionsSheet'
import { CardProgressSheet } from './CardProgressSheet'
import { CardRow } from './CardRow'
import { LearningHistorySheet } from './LearningHistorySheet'
import type { RowDragHandle } from './ContentRow'
import { ReorderableList } from './ReorderableList'

export interface DeckContentEditorProps {
  deckId: string
  algorithm: LearningAlgorithm
  searchQuery?: string
  searching?: boolean
  onClearSearch?: () => void
  selection: MultiSelect
  sort: ContentSort
  onSortChange: (sort: ContentSort) => void
  onAddCard: () => void
  onEditCard: (cardId: string) => void
  /** Starts a study session for this deck with the given card at the front. */
  onStudyFrom?: (cardId: string) => void
  onPasteNotes: () => void
  onReviewImport: () => void
  onExtensionImport?: (to: string) => void
}

export function DeckContentEditor({
  deckId,
  algorithm,
  searchQuery,
  searching = false,
  onClearSearch,
  selection,
  sort,
  onSortChange,
  onAddCard,
  onEditCard,
  onStudyFrom,
  onPasteNotes,
  onReviewImport,
  onExtensionImport,
}: DeckContentEditorProps) {
  const { t } = useTranslation()
  const cardStore = useCardStoreApi()
  const allCards = useCardStore(selectCards)
  const importFile = useImportFile()
  const extensionImports = useExtensionPoint('importOptions')

  const prefs = usePreferencesStore(selectEffectivePreferences)
  const decks = useDeckStore(selectDecks)
  const folders = useFolderStore(selectFolders)
  const cards = useMemo(() => cardsInSubtree(decks, allCards, deckId), [decks, allCards, deckId])
  const maturity = useMemo(() => cardMaturityCounts(cards), [cards])

  const [importOpen, setImportOpen] = useState(false)
  const [browserCardId, setBrowserCardId] = useState<string | null>(null)
  const [moveIds, setMoveIds] = useState<readonly string[] | null>(null)
  const [cardSheet, setCardSheet] = useState<
    | { kind: 'actions'; id: string }
    | { kind: 'history'; id: string }
    | { kind: 'progress'; id: string }
    | null
  >(null)

  const pending = usePendingAct<PendingCardAct>()
  const sortOptions = useContentSortOptions(CONTENT_SORTS)
  const filter = useCardFilter()
  const commands = useCardCommands(
    cards,
    selection,
    () => pending.request({ kind: 'delete-selection' }),
    setMoveIds,
  )

  const selectMode = selection.active
  const needle = (searchQuery ?? '').trim().toLowerCase()
  const sortedCards = useMemo(() => sortCards(cards, sort), [cards, sort])
  const visibleCards = useMemo(
    () => filterCards(sortedCards, needle, filter.applied),
    [sortedCards, needle, filter.applied],
  )

  const { setVisibleIds } = selection
  useEffect(() => {
    setVisibleIds(visibleCards.map((card) => card.id))
  }, [visibleCards, setVisibleIds])

  const total = cards.length
  const reorderable = selectMode && !needle
  const reorder = (ids: string[]) => {
    void reorderCards(cardStore, ids)
    if (sort !== 'manual') onSortChange('manual')
  }

  const sheetCard = cardSheet ? cards.find((card) => card.id === cardSheet.id) : undefined
  const movingCards = moveIds ? cards.filter((card) => moveIds.includes(card.id)) : []
  const moveExcludeIds = new Set(movingCards.map((card) => card.deckId))
  const pickMoveTarget = (dest: MoveDestination) => {
    if (dest.kind === 'deck' && moveIds) {
      commands.moveTo(moveIds, dest.deckId, findEntity(decks, dest.deckId)?.name ?? '')
    }
    setMoveIds(null)
  }

  const actionsFor = useCardActions({
    commands,
    selection,
    surfaces: {
      move: setMoveIds,
      progress: (id) => setCardSheet({ kind: 'progress', id }),
      history: (id) => setCardSheet({ kind: 'history', id }),
      confirmDelete: (id) => pending.request({ kind: 'delete-card', id }),
    },
    onEditCard,
    onStudyFrom,
  })

  const renderCard = (card: Card, dragHandle?: RowDragHandle, dragging = false) => (
    <CardRow
      key={card.id}
      card={card}
      index={sortedCards.indexOf(card)}
      selectMode={selectMode}
      selected={selection.has(card.id)}
      reorderable={reorderable}
      dragHandle={dragHandle}
      dragging={dragging}
      swipe={prefs.swipe.card}
      handlers={actionsFor(card)}
      onToggleSelect={() => selection.toggle(card.id)}
      onRequestSelect={() => selection.begin(card.id)}
      onOpen={() => setBrowserCardId(card.id)}
      onOpenActions={() => setCardSheet({ kind: 'actions', id: card.id })}
      algorithm={algorithm}
    />
  )

  return (
    <div>
      {algorithm === 'spaced' && !searching && !selectMode && total > 0 ? (
        <div className="mb-3">
          <CardMaturityOverview total={total} counts={maturity} />
        </div>
      ) : null}

      {!selectMode && !searching && total > 0 ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          {total > 1 ? (
            <SortControl
              label={t('cards.sortLabel')}
              value={sort}
              options={sortOptions}
              onChange={onSortChange}
            />
          ) : (
            <span aria-hidden />
          )}
          <FilterButton count={filter.appliedCount} onClick={filter.open} />
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {total === 0 ? (
          <EmptyCards onAdd={onAddCard} onImport={() => setImportOpen(true)} />
        ) : visibleCards.length === 0 ? (
          needle ? (
            <NoResults onClear={() => onClearSearch?.()} />
          ) : (
            <FilterEmpty onClear={filter.clear} />
          )
        ) : (
          <ReorderableList
            items={visibleCards}
            reorderable={reorderable}
            selectedIds={selection.ids}
            onReorder={reorder}
            renderItem={renderCard}
          />
        )}
      </div>

      {selectMode ? (
        <SelectToolbarDock>
          <SelectToolbar
            actions={prefs.selectToolbar.card}
            handlers={commands.selectHandlers}
            selection={selection}
          />
        </SelectToolbarDock>
      ) : null}

      <ImportSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        title={t('cards.transfer.importTitle')}
        description={t('cards.transfer.importSubtitle')}
        onPasteNotes={onPasteNotes}
        onPickFile={(file) => void importFile(file, onReviewImport)}
        extraOptions={extensionImports}
        onSelectExtra={(to) => onExtensionImport?.(to)}
      />

      <CardFilterSheet filter={filter} counts={maturity} />

      {sheetCard && cardSheet?.kind === 'actions' ? (
        <CardActionsSheet
          open
          onOpenChange={(open) => {
            if (!open) setCardSheet(null)
          }}
          handlers={actionsFor(sheetCard)}
        />
      ) : null}

      {sheetCard && cardSheet?.kind === 'progress' ? (
        <CardProgressSheet
          card={sheetCard}
          algorithm={algorithm}
          onOpenChange={(open) => {
            if (!open) setCardSheet(null)
          }}
          onApply={(change) => commands.setProgress(sheetCard.id, change)}
        />
      ) : null}

      <LearningHistorySheet
        open={cardSheet?.kind === 'history'}
        cardId={cardSheet?.kind === 'history' ? cardSheet.id : null}
        onOpenChange={(open) => {
          if (!open) setCardSheet(null)
        }}
      />

      <MoveSheet
        open={moveIds !== null}
        onOpenChange={(open) => {
          if (!open) setMoveIds(null)
        }}
        targets="deck"
        title={t('cards.move.title')}
        subtitle={
          movingCards.length === 1
            ? (movingCards[0]?.front ?? '')
            : t('selection.count', { count: movingCards.length })
        }
        decks={decks}
        folders={folders}
        excludeIds={moveExcludeIds}
        onPick={pickMoveTarget}
      />

      <ConfirmDialog
        open={pending.act !== null}
        onOpenChange={(open) => !open && pending.dismiss()}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={
          pending.act?.kind === 'delete-selection'
            ? t('cards.delete.bulkTitle', { count: selection.count })
            : t('cards.delete.cardTitle')
        }
        description={t('cards.delete.body')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() =>
          pending.resolve((act) => {
            if (act.kind === 'delete-card') commands.remove(act.id)
            else commands.removeSelected()
          })
        }
      />

      {!selectMode && total > 0 ? (
        <SpeedDial
          label={t('cards.quickActions')}
          placement="above-safe-area"
          actions={[
            {
              id: 'card',
              label: t('cards.addCard'),
              icon: <Plus className="size-5" aria-hidden />,
              onSelect: onAddCard,
            },
            {
              id: 'import',
              label: t('cards.transfer.importShort'),
              icon: <Upload className="size-5" aria-hidden />,
              onSelect: () => setImportOpen(true),
            },
          ]}
        />
      ) : null}

      <CardBrowser
        open={browserCardId !== null}
        cards={visibleCards}
        startId={browserCardId}
        onClose={() => setBrowserCardId(null)}
        onEdit={(id) => {
          setBrowserCardId(null)
          onEditCard(id)
        }}
        actionsFor={(card) => actionsFor(card, () => setBrowserCardId(null))}
      />
    </div>
  )
}

type PendingCardAct = { kind: 'delete-card'; id: string } | { kind: 'delete-selection' }
