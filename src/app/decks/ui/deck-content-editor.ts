import { Component, computed, inject, input, output, signal } from '@angular/core'
import { MatBottomSheet } from '@angular/material/bottom-sheet'
import { MatButton } from '@angular/material/button'
import {
  ArrowDownAZ,
  Clock,
  Copy,
  Flag,
  GraduationCap,
  GripVertical,
  LucideAngularModule,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { cardMaturityCounts, cardsInSubtree, srsStatus } from '@app/shared/domain'
import { ActionSheet } from '@app/shared/ui/action-sheet'
import { ConfirmDialog } from '@app/shared/ui/confirm-dialog'
import { SpeedDial } from '@app/shared/ui/speed-dial'
import { ToastService } from '@app/shared/ui/toast'
import { PreferencesStore } from '@app/settings/data/preferences-store'
import { setPreferences } from '@app/settings/commands/set-preferences'
import type { ContentSort } from '@app/settings/model/preferences'
import { CardStore, DeckStore } from '../data/stores'
import {
  deleteCard,
  duplicateCard,
  markCardsKnown,
  resetCardsSrs,
  toggleCardFlag,
} from '../commands/card-index'
import type { Card } from '../model/card'
import { CardMaturityOverview } from './card-maturity-overview'
import { CardRow } from './card-row'
import { CardFilterSheet } from './card-filter-sheet'
import type { CardFilter, CardFilterSheetData } from './card-filter-sheet'
import { SortControl } from './sort-control'
import type { SortOption } from './sort-control'

const dueKey = (card: Card): string => card.srs?.due ?? ''

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
 * The deck's card list with its management surface: maturity strip, sort and
 * filter controls, per-card actions (edit, duplicate, flag, mark known, reset
 * schedule, delete), and the add-card dial. Cards span the deck's whole subtree,
 * matching the study scope. Sort preference persists via the preferences command.
 */
@Component({
  selector: 'ms-deck-content-editor',
  imports: [
    CardMaturityOverview,
    CardRow,
    SortControl,
    SpeedDial,
    MatButton,
    LucideAngularModule,
    TranslocoPipe,
  ],
  template: `
    @if (cards().length > 0) {
      <div class="mb-3">
        <ms-card-maturity-overview [total]="cards().length" [counts]="maturity()" />
      </div>

      <div class="mb-3 flex items-center justify-between gap-2">
        @if (cards().length > 1) {
          <ms-sort-control
            [label]="'cards.sortLabel' | transloco"
            [value]="sort()"
            [options]="sortOptions()"
            (valueChange)="setSort($event)"
          />
        } @else {
          <span aria-hidden="true"></span>
        }
        <button
          type="button"
          [attr.aria-label]="'cards.filterLabel' | transloco"
          (click)="openFilter()"
          class="flex h-9 items-center gap-1.5 rounded-control bg-card pr-3 pl-2.5 shadow-rest transition-transform active:scale-[0.97]"
          [class]="filterCount() > 0 ? 'ring-1 ring-accent/45' : ''"
        >
          <lucide-icon
            [img]="icons.filter"
            class="size-4 shrink-0 text-accent"
            aria-hidden="true"
          />
          <span class="text-[length:var(--ms-text-label)] font-semibold text-heading">
            {{ 'cards.filterLabel' | transloco }}
          </span>
          @if (filterCount() > 0) {
            <span
              class="grid size-5 place-items-center rounded-full bg-accent text-[length:var(--ms-text-tiny)] font-bold text-accent-foreground tabular-nums"
            >
              {{ filterCount() }}
            </span>
          }
        </button>
      </div>
    }

    <div class="flex flex-col gap-3">
      @if (cards().length === 0) {
        <div class="flex flex-col items-center px-6 py-10 text-center">
          <div
            class="mb-4 grid size-14 place-items-center rounded-card-featured bg-info-surface text-accent"
          >
            <lucide-icon [img]="icons.mapPin" class="size-6" aria-hidden="true" />
          </div>
          <h3
            class="mb-1.5 text-[length:var(--ms-text-sub)] font-semibold text-balance text-heading"
          >
            {{ 'cards.emptyTitle' | transloco }}
          </h3>
          <p
            class="max-w-[34ch] text-[length:var(--ms-text-body)] text-pretty text-muted-foreground"
          >
            {{ 'cards.emptyHint' | transloco }}
          </p>
          <div class="mt-5 flex w-full max-w-60 flex-col gap-2">
            <button matButton="filled" type="button" (click)="addCard.emit()">
              <lucide-icon [img]="icons.plus" class="size-[18px]" aria-hidden="true" />
              {{ 'cards.addCard' | transloco }}
            </button>
          </div>
        </div>
      } @else if (visibleCards().length === 0) {
        <div class="rounded-card bg-card-glass p-6 text-center shadow-rest">
          <p class="text-[length:var(--ms-text-body)] text-muted-foreground">
            {{ 'cards.filterEmpty' | transloco }}
          </p>
          <button
            type="button"
            (click)="clearFilter()"
            class="mt-2 text-[length:var(--ms-text-label)] font-semibold text-accent"
          >
            {{ 'cards.filterClear' | transloco }}
          </button>
        </div>
      } @else {
        @for (card of visibleCards(); track card.id) {
          <ms-card-row
            [card]="card"
            [index]="sortedCards().indexOf(card)"
            (open)="editCard.emit(card.id)"
            (more)="cardActions(card)"
          />
        }
      }
    </div>

    @if (cards().length > 0) {
      <ms-speed-dial
        [label]="'cards.quickActions' | transloco"
        [actions]="dialActions()"
        dock="edge"
      />
    }
  `,
  host: { class: 'block' },
})
export class DeckContentEditor {
  readonly deckId = input.required<string>()
  readonly addCard = output<void>()
  readonly editCard = output<string>()

  private readonly transloco = inject(TranslocoService)
  private readonly sheets = inject(MatBottomSheet)
  private readonly actionSheet = inject(ActionSheet)
  private readonly confirmDialog = inject(ConfirmDialog)
  private readonly toast = inject(ToastService)
  private readonly cardStore = inject(CardStore)
  private readonly deckStore = inject(DeckStore)
  private readonly preferencesStore = inject(PreferencesStore)

  protected readonly icons = { filter: SlidersHorizontal, mapPin: MapPin, plus: Plus }

  protected readonly filter = signal<CardFilter>({ maturity: [], flagged: false })
  protected readonly filterCount = computed(
    () => this.filter().maturity.length + (this.filter().flagged ? 1 : 0),
  )

  protected readonly cards = computed(() =>
    cardsInSubtree(this.deckStore.decks(), this.cardStore.cards(), this.deckId()),
  )
  protected readonly maturity = computed(() => cardMaturityCounts(this.cards()))
  protected readonly sort = computed(() => this.preferencesStore.effective().contentSort)
  protected readonly sortedCards = computed(() => sortCards(this.cards(), this.sort()))

  protected readonly visibleCards = computed(() => {
    const { maturity, flagged } = this.filter()
    let list = this.sortedCards()
    if (maturity.length > 0) list = list.filter((card) => maturity.includes(srsStatus(card.srs)))
    if (flagged) list = list.filter((card) => card.flagged)
    return list
  })

  protected readonly sortOptions = computed<SortOption<ContentSort>[]>(() => [
    { value: 'manual', label: this.t('cards.sort.manual'), icon: GripVertical },
    { value: 'recent', label: this.t('cards.sort.recent'), icon: Clock },
    { value: 'name', label: this.t('cards.sort.name'), icon: ArrowDownAZ },
    { value: 'due', label: this.t('cards.sort.due'), icon: Sparkles },
    { value: 'flagged', label: this.t('cards.sort.flagged'), icon: Flag },
  ])

  protected readonly dialActions = computed(() => [
    {
      id: 'card',
      label: this.t('cards.addCard'),
      icon: Plus,
      onSelect: () => this.addCard.emit(),
    },
  ])

  protected setSort(sort: ContentSort): void {
    void setPreferences(this.preferencesStore, { contentSort: sort })
  }

  protected clearFilter(): void {
    this.filter.set({ maturity: [], flagged: false })
  }

  protected openFilter(): void {
    const data: CardFilterSheetData = { filter: this.filter(), counts: this.maturity() }
    const ref = this.sheets.open<CardFilterSheet, CardFilterSheetData, CardFilter>(
      CardFilterSheet,
      { data, panelClass: 'ms-sheet-panel' },
    )
    ref.afterDismissed().subscribe((next) => {
      if (next) this.filter.set(next)
    })
  }

  protected cardActions(card: Card): void {
    this.actionSheet.open({
      title: card.front,
      cancelLabel: this.t('common.cancel'),
      actions: [
        {
          id: 'edit',
          label: this.t('common.edit'),
          icon: Pencil,
          onSelect: () => this.editCard.emit(card.id),
        },
        {
          id: 'duplicate',
          label: this.t('cards.row.duplicate'),
          icon: Copy,
          onSelect: () => {
            void duplicateCard(this.cardStore, card.id)
            this.toast.success(this.t('cards.row.duplicated'))
          },
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
          onSelect: () => {
            void markCardsKnown(this.cardStore, [card.id])
            this.toast.success(this.t('cards.row.markedKnown'))
          },
        },
        {
          id: 'reset',
          label: this.t('cards.row.resetSchedule'),
          icon: RotateCcw,
          onSelect: () => {
            void resetCardsSrs(this.cardStore, [card.id])
            this.toast.success(this.t('cards.row.scheduleReset'))
          },
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
