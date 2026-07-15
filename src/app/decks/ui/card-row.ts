import { Component, input, output } from '@angular/core'
import { MatIconButton } from '@angular/material/button'
import { Flag, Lightbulb, LucideAngularModule, MapPin, MoreVertical } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { LongPress } from '@app/shared/ui/long-press'
import { SrsStatusChip } from '@app/shared/ui/srs-status-chip'
import type { Card } from '../model/card'

/**
 * One card in the deck's list: position, front/back, flag, SRS chip, and the hint
 * and tip callouts. Tap opens the editor; press-and-hold or the overflow button
 * asks the parent for the card's actions.
 */
@Component({
  selector: 'ms-card-row',
  imports: [MatIconButton, LucideAngularModule, TranslocoPipe, LongPress, SrsStatusChip],
  template: `
    <div class="flex items-start gap-3">
      <div class="relative min-w-0 flex-1">
        <button
          type="button"
          msLongPress
          (shortTap)="open.emit()"
          (longPress)="more.emit()"
          [attr.aria-label]="card().front"
          class="absolute inset-0 rounded-card transition-colors active:bg-primary/[0.04]"
        ></button>

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
          <p class="mt-1 text-[length:var(--ms-text-body)] leading-relaxed text-muted-foreground">
            {{ card().back }}
          </p>
          <div class="mt-2">
            <ms-srs-status-chip [srs]="card().srs" />
          </div>
          @if (card().hint; as hint) {
            <div class="mt-2.5 flex items-start gap-2 rounded-control bg-info-surface px-3 py-2">
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

      <button
        matIconButton
        type="button"
        class="ms-row-menu -mt-1 -mr-1 shrink-0 bg-info-surface text-info-foreground"
        [attr.aria-label]="'cards.row.menuLabel' | transloco"
        (click)="more.emit()"
      >
        <lucide-icon [img]="icons.moreVertical" class="size-5" aria-hidden="true" />
      </button>
    </div>
  `,
  host: { class: 'block rounded-card border border-border bg-card p-4 shadow-rest' },
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
  readonly open = output<void>()
  /** Tap the overflow button or hold the row: the parent opens the card's actions. */
  readonly more = output<void>()

  protected readonly icons = {
    flag: Flag,
    mapPin: MapPin,
    lightbulb: Lightbulb,
    moreVertical: MoreVertical,
  }
}
