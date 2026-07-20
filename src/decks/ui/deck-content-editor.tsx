import { type ChangeEvent, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowDownAZ,
  Clock,
  Flag,
  GripVertical,
  MapPin,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Upload,
} from 'lucide-react'
import type { Card } from '@/decks'
import type { ContentSort } from '@/settings'
import { cn } from '@/shared/lib'
import { Button, SelectToolbar, SortControl, type SortControlOption, SpeedDial } from '@/shared/ui'
import { CardMaturityOverview } from './card-maturity-overview'
import { CardBrowser } from './card-browser'
import { CardRow, type RowDragHandle } from './content-rows'
import { ReorderableList } from './reorderable-list'
import { SelectModeBar } from './select-mode-bar'
import { useDeckContent } from './use-deck-content'

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
  const fileRef = useRef<HTMLInputElement>(null)
  const vm = useDeckContent({
    deckId,
    selectMode,
    onSelectModeChange,
    sort,
    onSortChange,
    searchQuery,
    onPasteNotes,
    onReviewImport,
  })

  const sortOptions: SortControlOption<ContentSort>[] = [
    { value: 'manual', label: t('cards.sort.manual'), icon: <GripVertical className="size-4" /> },
    { value: 'recent', label: t('cards.sort.recent'), icon: <Clock className="size-4" /> },
    { value: 'name', label: t('cards.sort.name'), icon: <ArrowDownAZ className="size-4" /> },
    { value: 'due', label: t('cards.sort.due'), icon: <Sparkles className="size-4" /> },
    { value: 'flagged', label: t('cards.sort.flagged'), icon: <Flag className="size-4" /> },
  ]

  /** The chooser resolves an `accept` string only when the learner picked the file route. */
  const startImport = async () => {
    const accept = await vm.chooseImport()
    const input = fileRef.current
    if (!accept || !input) return
    input.value = ''
    input.accept = accept
    input.click()
  }

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void vm.importAnkiFile(file)
  }

  const renderCard = (card: Card, dragHandle?: RowDragHandle, dragging = false) => (
    <CardRow
      key={card.id}
      card={card}
      index={vm.sortedCards.indexOf(card)}
      selectMode={selectMode}
      selected={vm.selectedIds.has(card.id)}
      reorderable={vm.reorderable}
      dragHandle={dragHandle}
      dragging={dragging}
      swipe={vm.swipe}
      onToggleSelect={() => vm.toggleSelect(card.id)}
      onRequestSelect={() => vm.requestSelect(card.id)}
      onOpen={() => vm.openBrowser(card.id)}
      onEdit={() => onEditCard(card.id)}
      onDuplicate={() => void vm.duplicateOne(card.id)}
      onDelete={() => void vm.deleteOne(card.id)}
      onToggleFlag={() => vm.toggleFlagOne(card.id)}
      onMarkKnown={() => void vm.markKnownOne(card.id)}
      onResetSrs={() => void vm.resetSrsOne(card.id)}
    />
  )

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

      {!searching && !selectMode && vm.total > 0 ? (
        <div className="mb-3">
          <CardMaturityOverview total={vm.total} counts={vm.maturity} />
        </div>
      ) : null}

      {!selectMode && !searching && vm.total > 0 ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          {vm.total > 1 ? (
            <SortControl
              label={t('cards.sortLabel')}
              value={sort}
              options={sortOptions}
              onChange={onSortChange}
            />
          ) : (
            <span aria-hidden />
          )}
          <FilterButton
            label={t('cards.filterLabel')}
            count={vm.filterCount}
            onClick={() => void vm.openFilter()}
          />
        </div>
      ) : null}

      {selectMode ? (
        <div className="pb-2">
          <SelectModeBar
            allSelected={vm.allVisibleSelected}
            count={vm.selectedCount}
            onToggleAll={vm.toggleSelectAll}
            onDone={vm.exitSelect}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {vm.total === 0 ? (
          <EmptyCards onAdd={onAddCard} onImport={() => void startImport()} />
        ) : vm.visibleCards.length === 0 ? (
          searchQuery?.trim() ? (
            <NoResults onClear={() => onClearSearch?.()} />
          ) : (
            <FilterEmpty onClear={vm.clearFilter} />
          )
        ) : (
          <ReorderableList
            items={vm.visibleCards}
            reorderable={vm.reorderable}
            onReorder={vm.onReorder}
            renderItem={renderCard}
          />
        )}
      </div>

      {selectMode ? (
        <SelectToolbar
          actions={vm.selectToolbarActions}
          handlers={vm.selectHandlers}
          className="sticky bottom-[max(0.5rem,env(safe-area-inset-bottom))] mt-3"
          style={{ zIndex: 'var(--ms-z-sticky)' }}
        />
      ) : null}

      {!selectMode && vm.total > 0 ? (
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
              onSelect: () => void startImport(),
            },
          ]}
        />
      ) : null}

      <CardBrowser
        open={vm.browserCardId !== null}
        cards={vm.visibleCards}
        startId={vm.browserCardId}
        onClose={vm.closeBrowser}
        onEdit={(id) => {
          vm.closeBrowser()
          onEditCard(id)
        }}
        onToggleFlag={vm.toggleFlagOne}
        onDuplicate={(id) => void vm.duplicateOne(id)}
        onMarkKnown={(id) => void vm.markKnownOne(id)}
        onResetSrs={(id) => void vm.resetSrsOne(id)}
        onDelete={(id) => {
          vm.closeBrowser()
          void vm.deleteOne(id)
        }}
      />
    </div>
  )
}

function EmptyCards({ onAdd, onImport }: { onAdd: () => void; onImport: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-card-featured bg-info-surface text-accent">
        <MapPin className="size-6" aria-hidden />
      </div>
      <h3 className="mb-1.5 text-balance text-[length:var(--ms-text-sub)] font-semibold text-heading">
        {t('cards.emptyTitle')}
      </h3>
      <p className="max-w-[34ch] text-pretty text-[length:var(--ms-text-body)] text-muted-foreground">
        {t('cards.emptyHint')}
      </p>
      <div className="mt-5 flex w-full max-w-60 flex-col gap-2">
        <Button onClick={onAdd}>
          <Plus className="size-[1.125rem]" aria-hidden />
          {t('cards.addCard')}
        </Button>
        <Button variant="secondary" onClick={onImport}>
          <Upload className="size-[1.125rem]" aria-hidden />
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
      <p className="text-[length:var(--ms-text-body)] text-muted-foreground">
        {t('cards.noResults')}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-[length:var(--ms-text-label)] font-semibold text-accent"
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
      <span className="text-[length:var(--ms-text-label)] font-semibold text-heading">{label}</span>
      {count > 0 ? (
        <span className="grid size-5 place-items-center rounded-full bg-accent text-[length:var(--ms-text-tiny)] font-bold tabular-nums text-accent-foreground">
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
      <p className="text-[length:var(--ms-text-body)] text-muted-foreground">
        {t('cards.filterEmpty')}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-[length:var(--ms-text-label)] font-semibold text-accent"
      >
        {t('cards.filterClear')}
      </button>
    </div>
  )
}
