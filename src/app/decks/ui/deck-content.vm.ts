import { Injectable, computed, inject, signal } from '@angular/core'
import { SheetService } from '@app/shared/ui/sheet'
import {
  ArrowDownAZ,
  Clock,
  Copy,
  Flag,
  GraduationCap,
  GripVertical,
  Pencil,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-angular'
import { TranslocoService } from '@jsverse/transloco'
import type { SwipeActionId } from '@app/shared/config/swipe'
import { cardMaturityCounts, cardsInSubtree, srsStatus } from '@app/shared/domain'
import { ActionSheet } from '@app/shared/ui/action-sheet'
import { ConfirmDialog } from '@app/shared/ui/confirm-dialog'
import type { SelectActionHandlers } from '@app/shared/ui/select-actions'
import { ToastService } from '@app/shared/ui/toast'
import { PreferencesStore, setPreferences } from '@app/settings'
import type { ContentSort } from '@app/settings'
import { CardStore, DeckStore } from '../data/stores'
import {
  deleteCard,
  deleteCards,
  duplicateCard,
  duplicateCards,
  markCardsKnown,
  resetCardsSrs,
  setCardsFlagged,
  toggleCardFlag,
} from '../commands/card-index'
import type { Card } from '../model/card'
import { openCardFilterSheet } from './card-filter-sheet'
import type { CardFilter } from './card-filter-sheet'
import type { SortOption } from './sort-control'

const dueKey = (card: Card): string => card.srs?.due ?? ''

// Sorting lives here rather than shared/domain: it keys off ContentSort, which
// the settings area owns, and shared/ must never import a feature area (ADR-0004).
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

/**
 * View model for a deck's card list (ADR-0008): filtering, sorting, per-row and
 * bulk actions.
 *
 * The editor is a `ui/` component, so navigation stays its parent's job — the
 * "edit this card" effect arrives as a callback rather than the view model
 * reaching for the router.
 */
@Injectable()
export class DeckContentVm {
  private readonly transloco = inject(TranslocoService)
  private readonly sheets = inject(SheetService)
  private readonly actionSheet = inject(ActionSheet)
  private readonly confirmDialog = inject(ConfirmDialog)
  private readonly toast = inject(ToastService)
  private readonly cardStore = inject(CardStore)
  private readonly deckStore = inject(DeckStore)
  private readonly preferencesStore = inject(PreferencesStore)

  /** Set by the component from its input. */
  readonly deckId = signal('')

  readonly filter = signal<CardFilter>({ maturity: [], flagged: false })
  readonly filterCount = computed(
    () => this.filter().maturity.length + (this.filter().flagged ? 1 : 0),
  )

  readonly cards = computed(() =>
    cardsInSubtree(this.deckStore.decks(), this.cardStore.cards(), this.deckId()),
  )
  readonly maturity = computed(() => cardMaturityCounts(this.cards()))
  readonly sort = computed(() => this.preferencesStore.effective().contentSort)
  readonly swipe = computed(() => this.preferencesStore.effective().swipe.card)
  readonly sortedCards = computed(() => sortCards(this.cards(), this.sort()))

  readonly visibleCards = computed(() => {
    const { maturity, flagged } = this.filter()
    let list = this.sortedCards()
    if (maturity.length > 0) list = list.filter((card) => maturity.includes(srsStatus(card.srs)))
    if (flagged) list = list.filter((card) => card.flagged)
    return list
  })

  readonly sortOptions = computed<SortOption<ContentSort>[]>(() => [
    { value: 'manual', label: this.t('cards.sort.manual'), icon: GripVertical },
    { value: 'recent', label: this.t('cards.sort.recent'), icon: Clock },
    { value: 'name', label: this.t('cards.sort.name'), icon: ArrowDownAZ },
    { value: 'due', label: this.t('cards.sort.due'), icon: Sparkles },
    { value: 'flagged', label: this.t('cards.sort.flagged'), icon: Flag },
  ])

  // ---- Multi-select (long-press) ----
  readonly selectMode = signal(false)
  readonly selectedIds = signal<ReadonlySet<string>>(new Set())
  readonly selectedCount = computed(() => this.selectedIds().size)

  readonly allVisibleSelected = computed(() => {
    const visible = this.visibleCards()
    const selected = this.selectedIds()
    return visible.length > 0 && visible.every((card) => selected.has(card.id))
  })

  requestSelect(id: string): void {
    this.selectMode.set(true)
    this.selectedIds.update((prev) => new Set(prev).add(id))
  }

  toggleSelect(id: string): void {
    this.selectedIds.update((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  toggleSelectAll(): void {
    const all = this.allVisibleSelected()
    this.selectedIds.update((prev) => {
      const next = new Set(prev)
      for (const card of this.visibleCards()) {
        if (all) next.delete(card.id)
        else next.add(card.id)
      }
      return next
    })
  }

  exitSelect(): void {
    this.selectMode.set(false)
    this.selectedIds.set(new Set())
  }

  readonly selectToolbarConfig = computed(
    () => this.preferencesStore.effective().selectToolbar.card,
  )

  // The bar the learner configured (Settings → Select toolbar) for cards.
  readonly selectHandlers = computed<SelectActionHandlers>(() => {
    const none = this.selectedIds().size === 0
    return {
      flag: { disabled: none, onAction: () => void this.bulkFlag() },
      known: { disabled: none, onAction: () => this.bulkKnown() },
      reset: { disabled: none, onAction: () => this.bulkReset() },
      duplicate: { disabled: none, onAction: () => void this.bulkDuplicate() },
      delete: { disabled: none, onAction: () => void this.confirmBulkDelete() },
    }
  })

  // Bulk flag only ever flags — it is a set, not a toggle, so the action reads
  // the same whatever the selection held. The count is what actually changed.
  private async bulkFlag(): Promise<void> {
    const flagged = await setCardsFlagged(this.cardStore, [...this.selectedIds()], true)
    this.toast.success(this.t('cards.bulk.flagged', { count: flagged }))
    this.exitSelect()
  }

  private bulkKnown(): void {
    void markCardsKnown(this.cardStore, [...this.selectedIds()])
    this.toast.success(this.t('cards.row.markedKnown'))
    this.exitSelect()
  }

  private bulkReset(): void {
    void resetCardsSrs(this.cardStore, [...this.selectedIds()])
    this.toast.success(this.t('cards.row.scheduleReset'))
    this.exitSelect()
  }

  private async bulkDuplicate(): Promise<void> {
    const ids = [...this.selectedIds()]
    await duplicateCards(this.cardStore, ids)
    this.toast.success(this.t('cards.bulk.duplicated', { count: ids.length }))
    this.exitSelect()
  }

  private async confirmBulkDelete(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      icon: Trash2,
      title: this.t('cards.delete.bulkTitle', { count: this.selectedIds().size }),
      description: this.t('cards.delete.body'),
      confirmLabel: this.t('common.delete'),
      cancelLabel: this.t('common.cancel'),
      destructive: true,
    })
    if (!confirmed) return
    const ids = [...this.selectedIds()]
    await deleteCards(this.cardStore, ids)
    this.toast.success(this.t('cards.transfer.deletedMany', { count: ids.length }))
    this.exitSelect()
  }

  // ---- Sort + filter ----
  setSort(sort: ContentSort): void {
    void setPreferences(this.preferencesStore, { contentSort: sort })
  }

  clearFilter(): void {
    this.filter.set({ maturity: [], flagged: false })
  }

  async openFilter(): Promise<void> {
    const next = await openCardFilterSheet(this.sheets, {
      filter: this.filter(),
      counts: this.maturity(),
    })
    if (next) this.filter.set(next)
  }

  // ---- Row actions ----
  /** `onEdit` is the view's: a ui/ component routes through its parent, not the router. */
  cardActions(card: Card, onEdit: (cardId: string) => void): void {
    this.actionSheet.open({
      title: card.front,
      cancelLabel: this.t('common.cancel'),
      actions: [
        { id: 'edit', label: this.t('common.edit'), icon: Pencil, onSelect: () => onEdit(card.id) },
        {
          id: 'duplicate',
          label: this.t('cards.row.duplicate'),
          icon: Copy,
          onSelect: () => this.duplicate(card),
        },
        {
          id: 'flag',
          label: this.t(card.flagged ? 'cards.row.unflag' : 'cards.row.flag'),
          icon: Flag,
          onSelect: () => void toggleCardFlag(this.cardStore, card.id),
        },
        {
          id: 'known',
          label: this.t('cards.row.markKnown'),
          icon: GraduationCap,
          onSelect: () => this.markKnown(card),
        },
        {
          id: 'reset',
          label: this.t('cards.row.resetSchedule'),
          icon: RotateCcw,
          onSelect: () => this.resetSchedule(card),
        },
        {
          id: 'delete',
          label: this.t('common.delete'),
          icon: Trash2,
          destructive: true,
          onSelect: () => void this.confirmDelete(card),
        },
      ],
    })
  }

  onCardSwipe(card: Card, id: SwipeActionId): void {
    switch (id) {
      case 'flag':
        void toggleCardFlag(this.cardStore, card.id)
        break
      case 'known':
        this.markKnown(card)
        break
      case 'reset':
        this.resetSchedule(card)
        break
      case 'duplicate':
        this.duplicate(card)
        break
      case 'delete':
        void this.confirmDelete(card)
        break
    }
  }

  private duplicate(card: Card): void {
    void duplicateCard(this.cardStore, card.id)
    this.toast.success(this.t('cards.row.duplicated'))
  }

  private markKnown(card: Card): void {
    void markCardsKnown(this.cardStore, [card.id])
    this.toast.success(this.t('cards.row.markedKnown'))
  }

  private resetSchedule(card: Card): void {
    void resetCardsSrs(this.cardStore, [card.id])
    this.toast.success(this.t('cards.row.scheduleReset'))
  }

  private async confirmDelete(card: Card): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      icon: Trash2,
      title: this.t('cards.delete.cardTitle'),
      description: this.t('cards.delete.body'),
      confirmLabel: this.t('common.delete'),
      cancelLabel: this.t('common.cancel'),
      destructive: true,
    })
    if (!confirmed) return
    await deleteCard(this.cardStore, card.id)
    this.toast.success(this.t('cards.transfer.deleted'))
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(key, params)
  }
}
