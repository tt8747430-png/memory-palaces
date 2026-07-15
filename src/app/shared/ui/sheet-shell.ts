import { Component, input, output } from '@angular/core'
import { LucideAngularModule, X } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'

/** Chrome shared by content bottom sheets: grab handle, title/description, close
 *  button, a scrollable body, and a pinned footer (project with `[footer]`). */
@Component({
  selector: 'ms-sheet-shell',
  imports: [LucideAngularModule, TranslocoPipe],
  template: `
    <div class="shrink-0">
      <div aria-hidden="true" class="mx-auto mt-3 mb-1 h-1.5 w-10 rounded-full bg-border"></div>
      <div class="flex items-start justify-between gap-3 px-5 pt-2 pb-3">
        <div class="min-w-0">
          <h2 class="text-[length:var(--ms-text-sub)] font-semibold text-heading">{{ title() }}</h2>
          @if (description()) {
            <p class="mt-0.5 text-[length:var(--ms-text-label)] text-muted-foreground">
              {{ description() }}
            </p>
          }
        </div>
        <button
          type="button"
          class="grid size-9 shrink-0 place-items-center rounded-control text-heading hover:bg-info-surface"
          [attr.aria-label]="'common.close' | transloco"
          (click)="closed.emit()"
        >
          <lucide-icon [img]="x" class="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
    <!-- min-h-0 lets this flex child shrink below its content so overflow-y-auto scrolls. -->
    <div class="min-h-0 flex-1 overflow-y-auto px-5 pt-1.5 pb-3">
      <ng-content />
    </div>
    <div class="shrink-0 border-t border-border px-5 pt-3 pb-2">
      <ng-content select="[footer]" />
    </div>
  `,
  host: { class: 'flex max-h-full min-h-0 flex-col pb-safe' },
})
export class SheetShell {
  readonly title = input.required<string>()
  readonly description = input('')
  readonly closed = output<void>()

  protected readonly x = X
}
