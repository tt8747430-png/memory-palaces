import { Component, computed, input } from '@angular/core'
import { LucideAngularModule } from 'lucide-angular'
import type { LucideIconData } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { SELECT_ACTION_META } from '@app/shared/config/select-toolbar'
import type { SelectActionMeta, SelectToolbarConfig } from '@app/shared/config/select-toolbar'
import { selectActionIcon } from './select-actions'
import type { SelectActionHandler, SelectActionHandlers } from './select-actions'

interface ToolbarItem {
  id: string
  meta: SelectActionMeta
  icon: LucideIconData
  handler: SelectActionHandler
}

/**
 * The bar that a multi-selection acts through. Which actions it carries is the
 * learner's choice (Settings → Select toolbar); everything here stays neutral so
 * a four-action bar reads as one calm surface, with only a destructive action
 * allowed to raise its voice.
 */
@Component({
  selector: 'ms-select-toolbar',
  imports: [LucideAngularModule, TranslocoPipe],
  template: `
    @if (shown().length > 0) {
      <div
        class="flex items-stretch gap-1.5 rounded-card-featured bg-card/95 p-2 shadow-elevated backdrop-blur-xl"
      >
        @for (item of shown(); track item.id) {
          <button
            type="button"
            (click)="item.handler.onAction()"
            [disabled]="item.handler.disabled"
            class="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-control px-1 py-2 transition-transform active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-[3px] focus-visible:ring-primary/40 focus-visible:outline-none"
            [class]="
              item.meta.destructive
                ? 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]'
                : 'bg-info-surface text-heading'
            "
          >
            <lucide-icon [img]="item.icon" class="size-4.5" aria-hidden="true" />
            <span
              class="w-full truncate text-center text-[length:var(--ms-text-tiny)] font-semibold"
            >
              {{ item.meta.labelKey | transloco }}
            </span>
          </button>
        }
      </div>
    }
  `,
  host: { class: 'block' },
})
export class SelectToolbar {
  /** The learner's configured bar for this surface, in order. */
  readonly actions = input.required<SelectToolbarConfig>()
  readonly handlers = input.required<SelectActionHandlers>()

  protected readonly shown = computed<ToolbarItem[]>(() =>
    this.actions().flatMap((id) => {
      const handler = this.handlers()[id]
      if (!handler) return []
      return [{ id, meta: SELECT_ACTION_META[id], icon: selectActionIcon(id), handler }]
    }),
  )
}
