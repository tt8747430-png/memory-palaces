import { Component, computed, input } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import { srsStatus } from '@app/shared/domain'
import type { SrsState, SrsStatus } from '@app/shared/domain'

const TONE: Record<SrsStatus, string> = {
  new: 'bg-info-surface text-info-foreground',
  learning: 'bg-secondary text-secondary-foreground',
  known: 'bg-[var(--success-surface)] text-[var(--success-on-surface)]',
}

/** A card's SRS maturity (new / learning / known) as a small tinted chip. */
@Component({
  selector: 'ms-srs-status-chip',
  imports: [TranslocoPipe],
  template: `{{ 'srs.' + status() | transloco }}`,
  host: {
    '[class]': 'hostClass()',
  },
})
export class SrsStatusChip {
  readonly srs = input<SrsState | undefined>(undefined)

  protected readonly status = computed(() => srsStatus(this.srs()))
  protected readonly hostClass = computed(
    () =>
      `inline-flex items-center rounded-control px-2 py-0.5 text-[length:var(--ms-text-tiny)] font-semibold ${TONE[this.status()]}`,
  )
}
