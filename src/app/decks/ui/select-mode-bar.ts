import { Component, input, output } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'

/** The inline select-mode header for a content list: select/clear all, the live
 *  count, and Done. */
@Component({
  selector: 'ms-select-mode-bar',
  imports: [TranslocoPipe],
  template: `
    <button
      type="button"
      (click)="toggleAll.emit()"
      class="-mx-2 -my-1 inline-flex min-h-11 items-center rounded-control px-2 text-[length:var(--ms-text-label)] font-semibold text-heading"
    >
      {{ (allSelected() ? 'cards.select.clearAll' : 'cards.select.selectAll') | transloco }}
    </button>
    <span class="text-[length:var(--ms-text-label)] font-semibold text-muted-foreground">
      {{ 'cards.select.count' | transloco: { count: count() } }}
    </span>
    <button
      type="button"
      (click)="done.emit()"
      class="-mx-2 -my-1 inline-flex min-h-11 items-center rounded-control px-2 text-[length:var(--ms-text-label)] font-semibold text-accent"
    >
      {{ 'cards.select.done' | transloco }}
    </button>
  `,
  host: { class: 'flex items-center justify-between gap-3' },
})
export class SelectModeBar {
  readonly allSelected = input.required<boolean>()
  readonly count = input.required<number>()
  readonly toggleAll = output<void>()
  readonly done = output<void>()
}
