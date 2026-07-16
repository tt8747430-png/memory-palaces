import { Component, input } from '@angular/core'
import { Check, LucideAngularModule } from 'lucide-angular'

/** Multi-select checkbox affordance — an empty ring that fills to an accent
 *  check when the row is selected. Shared across the content editor and library. */
@Component({
  selector: 'ms-select-dot',
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="check" class="size-3.5" [strokeWidth]="3" aria-hidden="true" />`,
  host: {
    class: 'grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
    '[class]':
      "selected() ? 'border-accent bg-accent text-[color:var(--surface)]' : 'border-border bg-card text-transparent'",
    'aria-hidden': 'true',
  },
})
export class SelectDot {
  readonly selected = input.required<boolean>()

  protected readonly check = Check
}
