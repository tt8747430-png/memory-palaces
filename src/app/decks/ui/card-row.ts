import { Component, computed, input, output } from '@angular/core'
import { MatIconButton } from '@angular/material/button'
import { Flag, Lightbulb, LucideAngularModule, MapPin, MoreVertical } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import type { SwipeActionId, SwipeConfig } from '@app/shared/config/swipe'
import { LongPress } from '@app/shared/ui/long-press'
import { SelectDot } from '@app/shared/ui/select-dot'
import { SrsStatusChip } from '@app/shared/ui/srs-status-chip'
import { buildSwipeActions } from '@app/shared/ui/swipe-actions'
import type { SwipeActionHandlers } from '@app/shared/ui/swipe-actions'
import { SwipeRow } from '@app/shared/ui/swipe-row'
import type { Card } from '../model/card'

/**
 * One card in the deck's list: position, front/back, flag, SRS chip, and the hint
 * and tip callouts. Tap opens it; the overflow button asks the parent for the
 * card's actions; a swipe reveals the configured quick actions; press-and-hold
 * starts a multi-selection, where a tap toggles the row instead.
 */
@Component({
  selector: 'ms-card-row',
  imports: [
    MatIconButton,
    LucideAngularModule,
    TranslocoPipe,
    LongPress,
    SelectDot,
    SrsStatusChip,
    SwipeRow,
  ],
  template: `
    <ms-swipe-row
      [leading]="swipeActions().leading"
      [trailing]="swipeActions().trailing"
      [disabled]="selectMode() || swipeDisabled()"
      class="rounded-card"
    >
      <div
        class="rounded-card border bg-card p-4 shadow-rest transition-colors"
        [class]="rowSurface()"
      >
        <div class="flex items-start gap-3">
          @if (selectMode()) {
            <ms-select-dot class="mt-0.5" [selected]="selected()" />
          }
          <div class="relative min-w-0 flex-1">
            @if (selectMode()) {
              <button
                type="button"
                (click)="toggleSelect.emit()"
                [attr.aria-label]="card().front"
                [attr.aria-pressed]="selected()"
                class="absolute inset-0 touch-pan-y rounded-card transition-colors active:bg-primary/[0.04]"
              ></button>
            } @else {
              <button
                type="button"
                msLongPress
                (shortTap)="open.emit()"
                (longPress)="requestSelect.emit()"
                [attr.aria-label]="card().front"
                class="absolute inset-0 rounded-card transition-colors active:bg-primary/[0.04]"
              ></button>
            }

            <div class="pointer-events-none relative">
              <div class="flex items-center gap-2">
                <span
                  class="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-info-surface px-1 text-[length:var(--ms-text-tiny)] font-bold text-info-foreground"
                >
                  {{ index() + 1 }}
                </span>
                <p
                  class="min-w-0 flex-1 text-[length:var(--ms-text-sub)] leading-snug font-semibold text-heading"
                >
                  {{ card().front }}
                </p>
                @if (card().flagged) {
                  <lucide-icon
                    [img]="icons.flag"
                    class="size-3.5 shrink-0 fill-[var(--rating)] text-[var(--rating-edge)]"
                    [attr.aria-label]="'cards.row.flagged' | transloco"
                  />
                }
              </div>
              <p
                class="mt-1 text-[length:var(--ms-text-body)] leading-relaxed text-muted-foreground"
              >
                {{ card().back }}
              </p>
              <div class="mt-2">
                <ms-srs-status-chip [srs]="card().srs" />
              </div>
              @if (card().hint; as hint) {
                <div
                  class="mt-2.5 flex items-start gap-2 rounded-control bg-info-surface px-3 py-2"
                >
                  <lucide-icon
                    [img]="icons.mapPin"
                    class="mt-0.5 size-3.5 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                  <p
                    class="text-[length:var(--ms-text-label)] leading-snug text-info-foreground italic"
                  >
                    {{ hint }}
                  </p>
                </div>
              }
              @if (card().tip; as tip) {
                <div
                  class="mt-2 flex items-start gap-2 rounded-control bg-[var(--warning-surface)] px-3 py-2"
                >
                  <lucide-icon
                    [img]="icons.lightbulb"
                    class="mt-0.5 size-3.5 shrink-0 text-[var(--warning-foreground)]"
                    aria-hidden="true"
                  />
                  <p
                    class="text-[length:var(--ms-text-label)] leading-snug text-[var(--warning-foreground)] italic"
                  >
                    {{ tip }}
                  </p>
                </div>
              }
            </div>
          </div>

          @if (!selectMode()) {
            <button
              matIconButton
              type="button"
              class="ms-row-menu -mt-1 -mr-1 shrink-0 bg-info-surface text-info-foreground"
              [attr.aria-label]="'cards.row.menuLabel' | transloco"
              (click)="more.emit()"
            >
              <lucide-icon [img]="icons.moreVertical" class="size-5" aria-hidden="true" />
            </button>
          }
        </div>
      </div>
    </ms-swipe-row>
  `,
  host: { class: 'block' },
  styles: `
    .ms-row-menu {
      --mat-icon-button-state-layer-size: 36px;
      width: 36px;
      height: 36px;
      padding: 6px;
    }
  `,
})
export class CardRow {
  readonly card = input.required<Card>()
  readonly index = input.required<number>()
  /** The learner's swipe config for cards; null disables swipe on this row. */
  readonly swipe = input<SwipeConfig | null>(null)
  readonly selectMode = input(false)
  readonly selected = input(false)
  readonly open = output<void>()
  /** Tap the overflow button: the parent opens the card's actions. */
  readonly more = output<void>()
  /** Press-and-hold: enter select mode with this card selected. */
  readonly requestSelect = output<void>()
  readonly toggleSelect = output<void>()
  readonly swipeAction = output<SwipeActionId>()

  protected readonly icons = {
    flag: Flag,
    mapPin: MapPin,
    lightbulb: Lightbulb,
    moreVertical: MoreVertical,
  }

  protected readonly rowSurface = computed(() => {
    const border = this.selected() ? 'border-accent ring-2 ring-accent/25' : 'border-border'
    return this.selectMode() ? `${border} cursor-pointer` : border
  })

  protected readonly swipeActions = computed(() => {
    const config = this.swipe()
    if (!config) return { leading: [], trailing: [] }
    const emit = (id: SwipeActionId) => () => this.swipeAction.emit(id)
    const handlers: SwipeActionHandlers = {
      flag: {
        onAction: emit('flag'),
        labelKey: this.card().flagged ? 'cards.row.unflag' : 'cards.row.flag',
      },
      known: { onAction: emit('known') },
      reset: { onAction: emit('reset') },
      duplicate: { onAction: emit('duplicate') },
      delete: { onAction: emit('delete') },
    }
    return buildSwipeActions(config, handlers)
  })

  protected readonly swipeDisabled = computed(() => {
    const { leading, trailing } = this.swipeActions()
    return leading.length === 0 && trailing.length === 0
  })
}
