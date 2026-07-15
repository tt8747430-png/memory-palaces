import { Component, input, output } from '@angular/core'
import { MatIconButton } from '@angular/material/button'
import { ChevronLeft, LucideAngularModule } from 'lucide-angular'

/** Sub-page header: glass bar with a back button, title/subtitle, and a projected
 *  trailing action. */
@Component({
  selector: 'ms-screen-header',
  imports: [MatIconButton, LucideAngularModule],
  template: `
    <header class="shrink-0 bg-glass px-5 pt-safe">
      <div class="flex min-h-14 items-center gap-3 pt-3 pb-2">
        <button
          matIconButton
          type="button"
          class="bg-card-glass shadow-rest"
          [attr.aria-label]="backLabel()"
          (click)="back.emit()"
        >
          <lucide-icon [img]="chevronLeft" class="size-5" aria-hidden="true" />
        </button>
        <div class="min-w-0 flex-1">
          <h1 class="truncate text-balance">{{ title() }}</h1>
          @if (subtitle()) {
            <p class="truncate text-[length:var(--ms-text-label)]">{{ subtitle() }}</p>
          }
        </div>
        <ng-content />
      </div>
    </header>
  `,
  host: { class: 'block shrink-0' },
})
export class ScreenHeader {
  readonly title = input.required<string>()
  readonly subtitle = input('')
  readonly backLabel = input.required<string>()
  readonly back = output<void>()

  protected readonly chevronLeft = ChevronLeft
}
