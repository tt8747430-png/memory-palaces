import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowDownAZ,
  ClipboardPaste,
  Clock,
  Flag,
  GripVertical,
  Layers,
  MapPin,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { type Card, selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { selectDecks, useDeckStore } from '@/entities/deck'
import {
  deleteCard,
  duplicateCard,
  markCardsKnown,
  reorderCards,
  resetCardsSrs,
  toggleCardFlag,
} from '@/features/card'
import {
  type ContentSort,
  selectEffectivePreferences,
  usePreferencesStore,
} from '@/entities/preferences'
import { readAnkiFile } from '@/features/content'
import { cardMaturityCounts, cardsInSubtree, cn, ContentImportError, srsStatus } from '@/shared/lib'
import {
  Button,
  CardMaturityOverview,
  ConfirmDialog,
  ImportRow,
  type SelectActionHandlers,
  SelectToolbar,
  Sheet,
  SortControl,
  type SortControlOption,
  SpeedDial,
  Switch,
} from '@/shared/ui'
import { useImportDraft } from '../model/import-draft'
import { CardBrowser } from './CardBrowser'
import { CardRow, type RowDragHandle } from './ContentRows'
import { ReorderableList } from './ReorderableList'
import { SelectModeBar } from './SelectModeBar'

export interface DeckContentEditorProps {
  deckId: string
  searchQuery?: string
  searching?: boolean
  onClearSearch?: () => void
  selectMode: boolean
  onSelectModeChange: (on: boolean) => void
  sort: ContentSort
  onSortChange: (sort: ContentSort) => void
  onAddCard: () => void
  onEditCard: (cardId: string) => void
  onPasteNotes: () => void
  onReviewImport: () => void
}

type MaturityKey = 'new' | 'learning' | 'known'

export function DeckContentEditor({
  deckId,
  searchQuery,
  searching = false,
  onClearSearch,
  selectMode,
  onSelectModeChange,
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

  useEffect(() => {
    cardStore.getState().start()
  }, [cardStore])

  const prefs = usePreferencesStore(selectEffectivePreferences)
  const cardSwipe = prefs.swipe.card

  const decks = useDeckStore(selectDecks)
  const cards = useMemo(() => cardsInSubtree(decks, allCards, deckId), [decks, allCards, deckId])

  const setSelectMode = onSelectModeChange
  const setSort = onSortChange
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [browserCardId, setBrowserCardId] = useState<string | null>(null)

  const [filterOpen, setFilterOpen] = useState(false)
  const [maturityFilter, setMaturityFilter] = useState<Set<MaturityKey>>(new Set())
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [draftMaturity, setDraftMaturity] = useState<Set<MaturityKey>>(new Set())
  const [draftFlagged, setDraftFlagged] = useState(false)
  const cardFilterCount = maturityFilter.size + (flaggedOnly ? 1 : 0)
  const draftFilterCount = draftMaturity.size + (draftFlagged ? 1 : 0)

  const openFilter = () => {
    setDraftMaturity(new Set(maturityFilter))
    setDraftFlagged(flaggedOnly)
    setFilterOpen(true)
  }
  const resetDraftFilter = () => {
    setDraftMaturity(new Set())
    setDraftFlagged(false)
  }
  const applyFilter = () => {
    setMaturityFilter(new Set(draftMaturity))
    setFlaggedOnly(draftFlagged)
    setFilterOpen(false)
  }
  const clearCardFilter = () => {
    setMaturityFilter(new Set())
    setFlaggedOnly(false)
  }
  const toggleDraftMaturity = (key: MaturityKey) =>
    setDraftMaturity((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const maturity = useMemo(() => cardMaturityCounts(cards), [cards])

  useEffect(() => {
    if (!selectMode) setSelectedIds(new Set())
  }, [selectMode])

  const fileRef = useRef<HTMLInputElement>(null)

  const sortedCards = useMemo(() => sortCards(cards, sort), [cards, sort])

  const needle = (searchQuery ?? '').trim().toLowerCase()
  const visibleCards = useMemo(() => {
    let list = sortedCards
    if (needle)
      list = list.filter((l) =>
        [l.front, l.back, l.hint, l.tip]
          .filter(Boolean)
          .some((field) => (field as string).toLowerCase().includes(needle)),
      )
    if (maturityFilter.size > 0) list = list.filter((l) => maturityFilter.has(srsStatus(l.srs)))
    if (flaggedOnly) list = list.filter((l) => l.flagged)
    return list
  }, [sortedCards, needle, maturityFilter, flaggedOnly])

  const total = cards.length
  const selectedCount = selectedIds.size
  const allVisibleSelected =
    visibleCards.length > 0 && visibleCards.every((item) => selectedIds.has(item.id))

  const reorderable = selectMode && !needle
  const reorderTo = (commit: () => void) => {
    commit()
    if (sort !== 'manual') setSort('manual')
  }
  const sortOptions: SortControlOption<ContentSort>[] = [
    { value: 'manual', label: t('cards.sort.manual'), icon: <GripVertical className="size-4" /> },
    { value: 'recent', label: t('cards.sort.recent'), icon: <Clock className="size-4" /> },
    { value: 'name', label: t('cards.sort.name'), icon: <ArrowDownAZ className="size-4" /> },
    { value: 'due', label: t('cards.sort.due'), icon: <Sparkles className="size-4" /> },
    { value: 'flagged', label: t('cards.sort.flagged'), icon: <Flag className="size-4" /> },
  ]

  const renderCard = (card: Card, dragHandle?: RowDragHandle, dragging = false) => (
    <CardRow
      key={card.id}
      card={card}
      index={sortedCards.indexOf(card)}
      selectMode={selectMode}
      selected={selectedIds.has(card.id)}
      reorderable={reorderable}
      dragHandle={dragHandle}
      dragging={dragging}
      swipe={cardSwipe}
      onToggleSelect={() => toggleSelect(card.id)}
      onRequestSelect={() => requestSelect(card.id)}
      onOpen={() => setBrowserCardId(card.id)}
      onEdit={() => onEditCard(card.id)}
      onDuplicate={() => {
        void duplicateCard(cardStore, card.id)
        toast.success(t('cards.row.duplicated'))
      }}
      onDelete={() => setPendingDeleteId(card.id)}
      onToggleFlag={() => void toggleCardFlag(cardStore, card.id)}
      onMarkKnown={() => {
        void markCardsKnown(cardStore, [card.id])
        toast.success(t('cards.row.markedKnown'))
      }}
      onResetSrs={() => {
        void resetCardsSrs(cardStore, [card.id])
        toast.success(t('cards.row.scheduleReset'))
      }}
    />
  )

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const requestSelect = (id: string) => {
    setSelectMode(true)
    setSelectedIds((prev) => new Set(prev).add(id))
  }

  const toggleSelectAll = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) visibleCards.forEach((item) => next.delete(item.id))
      else visibleCards.forEach((item) => next.add(item.id))
      return next
    })

  const exitSelect = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const pickFile = (accept: string) => {
    setImportOpen(false)
    const input = fileRef.current
    if (!input) return
    input.value = ''
    input.accept = accept
    input.click()
  }

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
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

  const closeImport = (run: () => void) => {
    setImportOpen(false)
    run()
  }

  const confirmSingleDelete = () => {
    if (!pendingDeleteId) return
    void deleteCard(cardStore, pendingDeleteId)
    toast.success(t('cards.transfer.deleted'))
  }

  const confirmBulkDelete = () => {
    const ids = [...selectedIds]
    void Promise.all(ids.map((id) => deleteCard(cardStore, id)))
    toast.success(t('cards.transfer.deletedMany', { count: ids.length }))
    exitSelect()
  }

  // The bar the learner configured (Settings → Select toolbar) for cards.
  const noSelection = selectedCount === 0
  const selectHandlers: SelectActionHandlers = {
    flag: {
      disabled: noSelection,
      onAction: () => {
        const toFlag = cards.filter((card) => selectedIds.has(card.id) && !card.flagged)
        toFlag.forEach((card) => void toggleCardFlag(cardStore, card.id))
        toast.success(t('cards.bulk.flagged', { count: toFlag.length }))
        exitSelect()
      },
    },
    known: {
      disabled: noSelection,
      onAction: () => {
        void markCardsKnown(cardStore, [...selectedIds])
        toast.success(t('cards.row.markedKnown'))
        exitSelect()
      },
    },
    reset: {
      disabled: noSelection,
      onAction: () => {
        void resetCardsSrs(cardStore, [...selectedIds])
        toast.success(t('cards.row.scheduleReset'))
        exitSelect()
      },
    },
    duplicate: {
      disabled: noSelection,
      onAction: () => {
        const ids = [...selectedIds]
        void Promise.all(ids.map((id) => duplicateCard(cardStore, id)))
        toast.success(t('cards.bulk.duplicated', { count: ids.length }))
        exitSelect()
      },
    },
    delete: { disabled: noSelection, onAction: () => setBulkDeleteOpen(true) },
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={onFile}
        aria-hidden
        tabIndex={-1}
      />

      {!searching && !selectMode && cards.length > 0 ? (
        <div className="mb-3">
          <CardMaturityOverview total={cards.length} counts={maturity} />
        </div>
      ) : null}

      {!selectMode && !searching && total > 0 ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          {total > 1 ? (
            <SortControl
              label={t('cards.sortLabel')}
              value={sort}
              options={sortOptions}
              onChange={setSort}
            />
          ) : (
            <span aria-hidden />
          )}
          <FilterButton
            label={t('cards.filterLabel')}
            count={cardFilterCount}
            onClick={openFilter}
          />
        </div>
      ) : null}

      {selectMode ? (
        <div className="pb-2">
          <SelectModeBar
            allSelected={allVisibleSelected}
            count={selectedCount}
            onToggleAll={toggleSelectAll}
            onDone={exitSelect}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {total === 0 ? (
          <EmptyCards onAdd={onAddCard} onImport={() => setImportOpen(true)} />
        ) : visibleCards.length === 0 ? (
          needle ? (
            <NoResults onClear={() => onClearSearch?.()} />
          ) : (
            <FilterEmpty onClear={clearCardFilter} />
          )
        ) : (
          <ReorderableList
            items={visibleCards}
            reorderable={reorderable}
            selectedIds={selectedIds}
            onReorder={(ids) => reorderTo(() => void reorderCards(cardStore, ids))}
            renderItem={renderCard}
          />
        )}
      </div>

      {selectMode ? (
        <SelectToolbar
          actions={prefs.selectToolbar.card}
          handlers={selectHandlers}
          className="sticky bottom-2 z-20 mt-3"
        />
      ) : null}

      <Sheet
        open={importOpen}
        onOpenChange={setImportOpen}
        title={t('cards.transfer.importTitle')}
        description={t('cards.transfer.importSubtitle')}
      >
        <div className="flex flex-col gap-2.5 pb-2">
          <ImportRow
            icon={<Layers className="size-5" aria-hidden />}
            tone="warning"
            badge="CSV · TSV · TXT"
            title={t('cards.transfer.importAnki')}
            subtitle={t('cards.transfer.importAnkiSub')}
            onClick={() => pickFile('.csv,.tsv,.txt')}
          />
          <ImportRow
            icon={<ClipboardPaste className="size-5" aria-hidden />}
            tone="accent"
            title={t('cards.transfer.pasteNotes')}
            subtitle={t('cards.transfer.pasteNotesSub')}
            onClick={() => closeImport(onPasteNotes)}
          />
        </div>
      </Sheet>

      <Sheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        title={t('cards.filter.title')}
        footer={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={resetDraftFilter}
              disabled={draftFilterCount === 0}
            >
              {t('cards.filter.reset')}
            </Button>
            <Button className="flex-1" onClick={applyFilter}>
              {t('cards.filter.apply')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5 pb-2">
          <div>
            <p className="mb-2 px-1 text-(length:--p-text-label) font-bold uppercase tracking-wide text-muted-foreground">
              {t('cards.filter.maturity')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: 'new', label: t('cards.filter.new'), dot: 'bg-[var(--text-faint)]' },
                  { key: 'learning', label: t('cards.filter.learning'), dot: 'bg-accent' },
                  { key: 'known', label: t('cards.filter.known'), dot: 'bg-success' },
                ] as const
              ).map(({ key, label, dot }) => {
                const on = draftMaturity.has(key)
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleDraftMaturity(key)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-pill py-2 pl-3 pr-2 text-(length:--p-text-label) font-semibold transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.96]',
                      on
                        ? 'bg-primary text-primary-foreground shadow-interactive'
                        : 'bg-secondary/40 text-heading ring-1 ring-inset ring-primary/10',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'size-2.5 rounded-full transition-colors',
                        on ? 'bg-primary-foreground' : dot,
                      )}
                    />
                    <span>{label}</span>
                    <span
                      className={cn(
                        'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-(length:--p-text-tiny) font-bold tabular-nums transition-colors',
                        on
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-card text-muted-foreground',
                      )}
                    >
                      {maturity[key]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 px-1 text-(length:--p-text-label) font-bold uppercase tracking-wide text-muted-foreground">
              {t('cards.filter.status')}
            </p>
            <label className="flex items-center justify-between gap-3 rounded-card bg-secondary/40 px-3.5 py-3">
              <span className="inline-flex items-center gap-2.5 text-(length:--p-text-body) font-semibold text-heading">
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-(--warning-surface)"
                >
                  <Flag className="size-4 text-(--warning-foreground)" aria-hidden />
                </span>
                {t('cards.filter.flagged')}
              </span>
              <Switch
                label={t('cards.filter.flagged')}
                checked={draftFlagged}
                onCheckedChange={setDraftFlagged}
              />
            </label>
          </div>
        </div>
      </Sheet>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('cards.delete.cardTitle')}
        description={t('cards.delete.body')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmSingleDelete}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('cards.delete.bulkTitle', { count: selectedCount })}
        description={t('cards.delete.body')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmBulkDelete}
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
        onToggleFlag={(id) => void toggleCardFlag(cardStore, id)}
        onDuplicate={(id) => {
          void duplicateCard(cardStore, id)
          toast.success(t('cards.row.duplicated'))
        }}
        onMarkKnown={(id) => {
          void markCardsKnown(cardStore, [id])
          toast.success(t('cards.row.markedKnown'))
        }}
        onResetSrs={(id) => {
          void resetCardsSrs(cardStore, [id])
          toast.success(t('cards.row.scheduleReset'))
        }}
        onDelete={(id) => {
          setBrowserCardId(null)
          setPendingDeleteId(id)
        }}
      />
    </div>
  )
}

const dueKey = (card: Card) => card.srs?.due ?? ''

function sortCards(cards: Card[], sort: ContentSort): Card[] {
  switch (sort) {
    case 'name':
      return [...cards].sort((a, b) => a.front.localeCompare(b.front))
    case 'recent':
      return [...cards].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'due':
      return [...cards].sort((a, b) => dueKey(a).localeCompare(dueKey(b)))
    case 'flagged':
      return [...cards].sort((a, b) => Number(b.flagged) - Number(a.flagged))
    case 'manual':
      return cards
  }
}

function EmptyCards({ onAdd, onImport }: { onAdd: () => void; onImport: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-card-featured bg-info-surface text-accent">
        <MapPin className="size-6" aria-hidden />
      </div>
      <h3 className="mb-1.5 text-balance text-(length:--p-text-sub) font-semibold text-heading">
        {t('cards.emptyTitle')}
      </h3>
      <p className="max-w-[34ch] text-pretty text-(length:--p-text-body) text-muted-foreground">
        {t('cards.emptyHint')}
      </p>
      <div className="mt-5 flex w-full max-w-60 flex-col gap-2">
        <Button onClick={onAdd}>
          <Plus className="size-[18px]" aria-hidden />
          {t('cards.addCard')}
        </Button>
        <Button variant="secondary" onClick={onImport}>
          <Upload className="size-[18px]" aria-hidden />
          {t('cards.transfer.importShort')}
        </Button>
      </div>
    </div>
  )
}

function NoResults({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-card bg-card-glass p-6 text-center shadow-rest">
      <p className="text-(length:--p-text-body) text-muted-foreground">{t('cards.noResults')}</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-(length:--p-text-label) font-semibold text-accent"
      >
        {t('cards.clearSearch')}
      </button>
    </div>
  )
}

function FilterButton({
  label,
  count,
  onClick,
}: {
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex h-9 items-center gap-1.5 rounded-control bg-card pl-2.5 pr-3 shadow-rest transition-transform active:scale-[0.97]',
        count > 0 && 'ring-1 ring-accent/45',
      )}
    >
      <SlidersHorizontal className="size-4 shrink-0 text-accent" aria-hidden />
      <span className="text-(length:--p-text-label) font-semibold text-heading">{label}</span>
      {count > 0 ? (
        <span className="grid size-5 place-items-center rounded-full bg-accent text-(length:--p-text-tiny) font-bold tabular-nums text-accent-foreground">
          {count}
        </span>
      ) : null}
    </button>
  )
}

function FilterEmpty({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-card bg-card-glass p-6 text-center shadow-rest">
      <p className="text-(length:--p-text-body) text-muted-foreground">{t('cards.filterEmpty')}</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-(length:--p-text-label) font-semibold text-accent"
      >
        {t('cards.filterClear')}
      </button>
    </div>
  )
}
