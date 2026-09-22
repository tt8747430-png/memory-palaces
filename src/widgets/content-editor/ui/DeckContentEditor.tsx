import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Upload } from 'lucide-react'
import { type Card, useCardStoreApi } from '@/entities/card'
import { selectDecks, useDeckStore } from '@/entities/deck'
import { selectFolders, useFolderStore } from '@/entities/folder'
import { reorderCards } from '@/features/card'
import {
  type ContentSort,
  selectEffectivePreferences,
  usePreferencesStore,
} from '@/entities/preferences'
import {
  CONTENT_SORTS,
  findEntity,
  type MultiSelect,
  useExtensionPoint,
  usePendingAct,
  useStableHandlers,
} from '@/shared/lib'
import {
  CardMaturityOverview,
  ConfirmDialog,
  ImportSheet,
  offeredOptions,
  SelectToolbar,
  BottomSlot,
  type SortableHandle,
  SortControl,
  SpeedDial,
  useContentSortOptions,
} from '@/shared/ui'
import { type Destination, DestinationSheet } from '@/widgets/deck-tree'
import { useCardActions } from '../model/use-card-actions'
import type { CardList } from '../model/use-card-list'
import { useCardCommands } from '../model/use-card-commands'
import { useImportFile } from '../model/use-import-file'
import { CardBrowser } from './CardBrowser'
import { CardFilterSheet, FilterButton } from './CardFilterSheet'
import { EmptyCards, FilterEmpty, NoResults } from './CardListStates'
import { CardActionsSheet } from './CardActionsSheet'
import { CardProgressSheet } from './CardProgressSheet'
import { CardRow } from './CardRow'
import { LearningHistorySheet } from './LearningHistorySheet'
import { ReorderableList } from './ReorderableList'

/** A card row before it is measured: front, back and the chip line. */
const CARD_ROW_ESTIMATE = 132

export interface DeckContentEditorProps {
  /** The deck's cards, as the page derived them (`useCardList`) — its sort and algorithm too. */
  list: CardList
  searching?: boolean
  onClearSearch?: () => void
  selection: MultiSelect
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
  list,
  searching = false,
  onClearSearch,
  selection,
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
  const importFile = useImportFile()
  const extensionImports = useExtensionPoint('importOptions')

  const prefs = usePreferencesStore(selectEffectivePreferences)
  const decks = useDeckStore(selectDecks)
  const folders = useFolderStore(selectFolders)
  const {
    algorithm,
    sort,
    cards,
    visible: visibleCards,
    positionOf,
    needle,
    filter,
    maturity,
  } = list

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
  const listOptions = list.options
  const sortOptions = offeredOptions(useContentSortOptions(CONTENT_SORTS), listOptions.sorts, sort)
  const commands = useCardCommands(
    cards,
    selection,
    () => pending.request({ kind: 'delete-selection' }),
    setMoveIds,
  )

  const selectMode = selection.active

  const total = cards.length
  const reorderable = selectMode && !needle
  // Each control has to be able to change the list to earn its place: one order is no choice, and
  // a deck whose cards are all alike has nothing to filter by. An applied filter keeps its button.
  const showSort = total > 1 && sortOptions.length > 1
  const showFilter = listOptions.any || filter.appliedCount > 0
  const reorder = (ids: string[]) => {
    void reorderCards(cardStore, ids)
    if (sort !== 'manual') onSortChange('manual')
  }

  const sheetCard = cardSheet ? cards.find((card) => card.id === cardSheet.id) : undefined
  const movingCards = moveIds ? cards.filter((card) => moveIds.includes(card.id)) : []
  const moveExcludeIds = new Set(movingCards.map((card) => card.deckId))
  const pickMoveTarget = (dest: Destination) => {
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
    // A live deck other than this card's own to receive it. `selectDecks` hands back archived
    // decks too, and `DestinationSheet` filters them out — so counting them offers Move and then
    // opens an empty sheet.
    canMove: decks.filter((deck) => !deck.archived).length > 1,
  })

  // Everything a row reports, by card id, in one object that never changes identity — the rows are
  // memoized, and a fresh closure each per render would draw every one of them again.
  const rowEvents = useStableHandlers({
    toggleSelect: selection.toggle,
    requestSelect: selection.begin,
    open: setBrowserCardId,
    openActions: (id: string) => setCardSheet({ kind: 'actions', id }),
  })

  const renderCard = (card: Card, dragHandle?: SortableHandle, dragging = false) => (
    <CardRow
      key={card.id}
      card={card}
      index={positionOf.get(card.id) ?? 0}
      selectMode={selectMode}
      selected={selection.has(card.id)}
      reorderable={reorderable}
      dragHandle={dragHandle}
      dragging={dragging}
      swipe={prefs.swipe.card}
      events={rowEvents}
      actionsFor={actionsFor}
      onOpenActions={rowEvents.openActions}
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

      {!selectMode && !searching && total > 0 && (showSort || showFilter) ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          {showSort ? (
            <SortControl
              label={t('cards.sortLabel')}
              value={sort}
              options={sortOptions}
              onChange={onSortChange}
            />
          ) : (
            <span aria-hidden />
          )}
          {showFilter ? <FilterButton count={filter.appliedCount} onClick={filter.open} /> : null}
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
            estimateSize={CARD_ROW_ESTIMATE}
          />
        )}
      </div>

      <BottomSlot open={selectMode}>
        <SelectToolbar
          actions={prefs.selectToolbar.card}
          handlers={commands.selectHandlers}
          selection={selection}
        />
      </BottomSlot>

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

      <CardFilterSheet filter={filter} counts={maturity} options={listOptions} />

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

      <DestinationSheet
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
