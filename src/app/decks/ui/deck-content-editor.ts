import { Component, computed, effect, inject, input, output } from '@angular/core'
import { MatButton } from '@angular/material/button'
import { LucideAngularModule, MapPin, Plus, SlidersHorizontal } from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { SelectToolbar } from '@app/shared/ui/select-toolbar'
import { SpeedDial } from '@app/shared/ui/speed-dial'
import type { SpeedDialAction } from '@app/shared/ui/speed-dial'
import type { Card } from '../model/card'
import { CardMaturityOverview } from './card-maturity-overview'
import { CardRow } from './card-row'
import { SelectModeBar } from './select-mode-bar'
import { SortControl } from './sort-control'
import { DeckContentVm } from './deck-content.vm'

/**
 * The deck's card list with its management surface: maturity strip, sort and
 * filter controls, per-card actions (edit, duplicate, flag, mark known, reset
 * schedule, delete), and the add-card dial. Cards span the deck's whole subtree,
 * matching the study scope.
 *
 * The view. Everything reactive lives on DeckContentVm (ADR-0008); what stays
 * here is the template, the icon set, and the two outputs — routing belongs to
 * the page that hosts this, not to a ui/ component or its view model.
 */
@Component({
  selector: 'ms-deck-content-editor',
  providers: [DeckContentVm],
  imports: [
    CardMaturityOverview,
    CardRow,
    SelectModeBar,
    SelectToolbar,
    SortControl,
    SpeedDial,
    MatButton,
    LucideAngularModule,
    TranslocoPipe,
  ],
  template: `
    @if (vm.cards().length > 0 && !vm.selectMode()) {
      <div class="mb-3">
        <ms-card-maturity-overview [total]="vm.cards().length" [counts]="vm.maturity()" />
      </div>

      <div class="mb-3 flex items-center justify-between gap-2">
        @if (vm.cards().length > 1) {
          <ms-sort-control
            [label]="'cards.sortLabel' | transloco"
            [value]="vm.sort()"
            [options]="vm.sortOptions()"
            (valueChange)="vm.setSort($event)"
          />
        } @else {
          <span aria-hidden="true"></span>
        }
        <button
          type="button"
          [attr.aria-label]="'cards.filterLabel' | transloco"
          (click)="vm.openFilter()"
          class="flex h-9 items-center gap-1.5 rounded-control bg-card pr-3 pl-2.5 shadow-rest transition-transform active:scale-[0.97]"
          [class]="vm.filterCount() > 0 ? 'ring-1 ring-accent/45' : ''"
        >
          <lucide-icon
            [img]="icons.filter"
            class="size-4 shrink-0 text-accent"
            aria-hidden="true"
          />
          <span class="text-[length:var(--ms-text-label)] font-semibold text-heading">
            {{ 'cards.filterLabel' | transloco }}
          </span>
          @if (vm.filterCount() > 0) {
            <span
              class="grid size-5 place-items-center rounded-full bg-accent text-[length:var(--ms-text-tiny)] font-bold text-accent-foreground tabular-nums"
            >
              {{ vm.filterCount() }}
            </span>
          }
        </button>
      </div>
    }

    @if (vm.selectMode()) {
      <div class="pb-2">
        <ms-select-mode-bar
          [allSelected]="vm.allVisibleSelected()"
          [count]="vm.selectedCount()"
          (toggleAll)="vm.toggleSelectAll()"
          (done)="vm.exitSelect()"
        />
      </div>
    }

    <div class="flex flex-col gap-3">
      @if (vm.cards().length === 0) {
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
      } @else if (vm.visibleCards().length === 0) {
        <div class="rounded-card bg-card-glass p-6 text-center shadow-rest">
          <p class="text-[length:var(--ms-text-body)] text-muted-foreground">
            {{ 'cards.filterEmpty' | transloco }}
          </p>
          <button
            type="button"
            (click)="vm.clearFilter()"
            class="mt-2 text-[length:var(--ms-text-label)] font-semibold text-accent"
          >
            {{ 'cards.filterClear' | transloco }}
          </button>
        </div>
      } @else {
        @for (card of vm.visibleCards(); track card.id) {
          <ms-card-row
            [card]="card"
            [index]="vm.sortedCards().indexOf(card)"
            [swipe]="vm.swipe()"
            [selectMode]="vm.selectMode()"
            [selected]="vm.selectedIds().has(card.id)"
            (open)="editCard.emit(card.id)"
            (more)="cardActions(card)"
            (requestSelect)="vm.requestSelect(card.id)"
            (toggleSelect)="vm.toggleSelect(card.id)"
            (swipeAction)="vm.onCardSwipe(card, $event)"
          />
        }
      }
    </div>

    @if (vm.selectMode()) {
      <ms-select-toolbar
        class="sticky bottom-2 z-20 mt-3"
        [actions]="vm.selectToolbarConfig()"
        [handlers]="vm.selectHandlers()"
      />
    }

    @if (vm.cards().length > 0 && !vm.selectMode()) {
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

  protected readonly vm = inject(DeckContentVm)
  private readonly transloco = inject(TranslocoService)

  protected readonly icons = { filter: SlidersHorizontal, mapPin: MapPin, plus: Plus }

  /** One action, and it only emits — so it stays with the output it fires. */
  protected readonly dialActions = computed<SpeedDialAction[]>(() => [
    {
      id: 'card',
      label: this.transloco.translate('cards.addCard'),
      icon: Plus,
      onSelect: () => this.addCard.emit(),
    },
  ])

  constructor() {
    effect(() => this.vm.deckId.set(this.deckId()))
  }

  /** Hands the view model the one effect it can't own: firing this component's output. */
  protected cardActions(card: Card): void {
    this.vm.cardActions(card, (cardId) => this.editCard.emit(cardId))
  }
}
