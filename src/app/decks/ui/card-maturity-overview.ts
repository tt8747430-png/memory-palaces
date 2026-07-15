import { Component, computed, input } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import type { StudyBreakdown } from './study-overview-card'

const ORDER = ['new', 'learning', 'known'] as const
const FILL: Record<(typeof ORDER)[number], string> = {
  new: 'bg-[var(--divider)]',
  learning: 'bg-secondary',
  known: 'bg-success',
}
const DOT: Record<(typeof ORDER)[number], string> = {
  new: 'bg-[var(--text-faint)]',
  learning: 'bg-secondary',
  known: 'bg-success',
}

/** Deck-level maturity strip: total count, a proportional bar, and a legend. */
@Component({
  selector: 'ms-card-maturity-overview',
  imports: [TranslocoPipe],
  template: `
    <p class="mb-2.5 text-[length:var(--ms-text-title)] font-bold tracking-tight text-heading">
      {{ 'study.cardsInDeck' | transloco: { count: total() } }}
    </p>
    @if (total() > 0) {
      <div class="flex h-2 overflow-hidden rounded-full bg-[var(--divider)]" aria-hidden="true">
        @for (segment of segments(); track segment.key) {
          <span class="h-full" [class]="segment.fill" [style.width.%]="segment.percent"></span>
        }
      </div>
    }
    <ul class="m-0 mt-2.5 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0">
      @for (item of legend(); track item.key) {
        <li
          class="inline-flex items-center gap-1.5 text-[length:var(--ms-text-label)] text-muted-foreground"
        >
          <span class="size-2 rounded-full" [class]="item.dot" aria-hidden="true"></span>
          {{ 'srs.' + item.key | transloco }}
          <span class="font-semibold text-heading">{{ item.value }}</span>
        </li>
      }
    </ul>
  `,
  host: { class: 'block' },
})
export class CardMaturityOverview {
  readonly total = input.required<number>()
  readonly counts = input.required<StudyBreakdown>()

  protected readonly segments = computed(() =>
    ORDER.filter((key) => this.counts()[key] > 0).map((key) => ({
      key,
      fill: FILL[key],
      percent: (this.counts()[key] / this.total()) * 100,
    })),
  )

  protected readonly legend = computed(() =>
    ORDER.map((key) => ({ key, dot: DOT[key], value: this.counts()[key] })),
  )
}
