import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowDownAZ,
  Clock,
  Flag,
  GripVertical,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { type Card, selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { selectDecks, useDeckStore } from '@/entities/deck'
import { reorderCards } from '@/features/card'
import {
  type ContentSort,
  selectEffectivePreferences,
  usePreferencesStore,
} from '@/entities/preferences'
import { readAnkiFile } from '@/features/content'
import {
  cardMaturityCounts,
  cardsInSubtree,
  ContentImportError,
  type MultiSelect,
} from '@/shared/lib'
import {
  CardMaturityOverview,
  ConfirmDialog,
  ImportSheet,
  SelectToolbar,
  SelectToolbarDock,
  SortControl,
  type SortControlOption,
  SpeedDial,
} from '@/shared/ui'
import { filterCards, sortCards } from '../model/card-list'
import { useCardCommands } from '../model/use-card-commands'
import { useCardFilter } from '../model/use-card-filter'
import { useImportDraft } from '../model/import-draft'
import { CardBrowser } from './CardBrowser'
import { CardFilterSheet, FilterButton } from './CardFilterSheet'
import { EmptyCards, FilterEmpty, NoResults } from './CardListStates'
import { CardRow } from './CardRow'
import type { RowDragHandle } from './ContentRow'
import { ReorderableList } from './ReorderableList'

export interface DeckContentEditorProps {
  deckId: string
  searchQuery?: string
  searching?: boolean
  onClearSearch?: () => void
  selection: MultiSelect
  sort: ContentSort
  onSortChange: (sort: ContentSort) => void
  onAddCard: () => void
  onEditCard: (cardId: string) => void
  onPasteNotes: () => void
  onReviewImport: () => void
}

export function DeckContentEditor({
  deckId,
  searchQuery,
  searching = false,
  onClearSearch,
  selection,
  sort,
  onSortChange,
  onAddCard,
  onEditCard,
  onPasteNotes,
  onReviewImport,
}: DeckContentEditorProps) {
  const { t } = useTranslation()
  const cardStore = useCardStoreApi()
  const allCards = useCardStore(selectCards)
  const setImportDraft = useImportDraft((s) => s.setDraft)

  const prefs = usePreferencesStore(selectEffectivePreferences)
  const decks = useDeckStore(selectDecks)
  const cards = useMemo(() => cardsInSubtree(decks, allCards, deckId), [decks, allCards, deckId])
  const maturity = useMemo(() => cardMaturityCounts(cards), [cards])

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [browserCardId, setBrowserCardId] = useState<string | null>(null)

  const sortOptions = useSortOptions()
  const filter = useCardFilter()
  const commands = useCardCommands(cards, selection, () => setBulkDeleteOpen(true))

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

  const importAnki = async (file: File) => {
    try {
      const data = await readAnkiFile(file)
      if (data.cards.length === 0) {
        toast.error(t('cards.transfer.noCardsFound'))
        return
      }
      setImportDraft('anki', data.cards)
      onReviewImport()
    } catch (error) {
      toast.error(
        error instanceof ContentImportError ? error.message : t('cards.transfer.importFailed'),
      )
    }
  }

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
      onToggleSelect={() => selection.toggle(card.id)}
      onRequestSelect={() => selection.begin(card.id)}
      onOpen={() => setBrowserCardId(card.id)}
      onEdit={() => onEditCard(card.id)}
      onDuplicate={() => commands.duplicate(card.id)}
      onDelete={() => setPendingDeleteId(card.id)}
      onToggleFlag={() => commands.toggleFlag(card.id)}
      onMarkKnown={() => commands.markKnown(card.id)}
      onResetSrs={() => commands.resetSrs(card.id)}
    />
  )

  return (
    <div>
      {!searching && !selectMode && total > 0 ? (
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
          <SelectToolbar actions={prefs.selectToolbar.card} handlers={commands.selectHandlers} />
        </SelectToolbarDock>
      ) : null}

      <ImportSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        title={t('cards.transfer.importTitle')}
        description={t('cards.transfer.importSubtitle')}
        onPasteNotes={onPasteNotes}
        onPickFile={(file) => void importAnki(file)}
      />

      <CardFilterSheet filter={filter} counts={maturity} />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('cards.delete.cardTitle')}
        description={t('cards.delete.body')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          if (pendingDeleteId) commands.remove(pendingDeleteId)
        }}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('cards.delete.bulkTitle', { count: selection.count })}
        description={t('cards.delete.body')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={commands.removeSelected}
      />

      {!selectMode && total > 0 ? (
        <SpeedDial
          label={t('cards.quickActions')}
          className="bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+0.75rem)]"
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
        onToggleFlag={commands.toggleFlag}
        onDuplicate={commands.duplicate}
        onMarkKnown={commands.markKnown}
        onResetSrs={commands.resetSrs}
        onDelete={(id) => {
          setBrowserCardId(null)
          setPendingDeleteId(id)
        }}
      />
    </div>
  )
}

const SORT_OPTIONS = [
  { value: 'manual', labelKey: 'cards.sort.manual', icon: <GripVertical className="size-4" /> },
  { value: 'recent', labelKey: 'cards.sort.recent', icon: <Clock className="size-4" /> },
  { value: 'name', labelKey: 'cards.sort.name', icon: <ArrowDownAZ className="size-4" /> },
  { value: 'due', labelKey: 'cards.sort.due', icon: <Sparkles className="size-4" /> },
  { value: 'flagged', labelKey: 'cards.sort.flagged', icon: <Flag className="size-4" /> },
] as const satisfies readonly { value: ContentSort; labelKey: string; icon: ReactNode }[]

function useSortOptions(): SortControlOption<ContentSort>[] {
  const { t } = useTranslation()
  return SORT_OPTIONS.map(({ value, labelKey, icon }) => ({
    value,
    label: t(labelKey as never),
    icon,
  }))
}
