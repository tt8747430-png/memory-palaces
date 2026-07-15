import { Component, inject, Injectable } from '@angular/core'
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet'
import { LucideAngularModule } from 'lucide-angular'
import type { LucideIconData } from 'lucide-angular'

export interface SheetAction {
  id: string
  label: string
  icon?: LucideIconData
  destructive?: boolean
  disabled?: boolean
  onSelect: () => void
}

export interface ActionSheetConfig {
  title: string
  description?: string
  actions: SheetAction[]
  cancelLabel: string
}

@Component({
  selector: 'ms-action-sheet',
  imports: [LucideAngularModule],
  template: `
    <div aria-hidden="true" class="mx-auto mt-1 h-1.5 w-10 rounded-full bg-border"></div>
    <div class="px-2 pt-3 pb-1">
      <h2 class="text-[length:var(--ms-text-sub)] font-semibold text-heading">
        {{ config.title }}
      </h2>
      @if (config.description) {
        <p class="mt-0.5 text-[length:var(--ms-text-label)] text-muted-foreground">
          {{ config.description }}
        </p>
      }
    </div>

    <div class="mt-1 flex flex-col gap-0.5 pb-2">
      @for (action of config.actions; track action.id) {
        <button
          type="button"
          [disabled]="action.disabled"
          (click)="select(action)"
          class="flex h-12 items-center gap-3 rounded-control px-3 text-left text-[length:var(--ms-text-body)] font-medium transition-transform duration-150 ease-out active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
          [class]="
            action.destructive
              ? 'text-[var(--danger-on-surface)] hover:bg-[var(--danger-surface)]'
              : 'text-heading hover:bg-info-surface'
          "
        >
          @if (action.icon; as icon) {
            <lucide-icon [img]="icon" class="size-5 shrink-0" aria-hidden="true" />
          }
          {{ action.label }}
        </button>
      }
    </div>

    <button
      type="button"
      (click)="ref.dismiss()"
      class="mb-1 flex h-12 items-center justify-center rounded-control bg-info-surface text-[length:var(--ms-text-body)] font-semibold text-heading transition-transform duration-150 ease-out active:scale-[0.99]"
    >
      {{ config.cancelLabel }}
    </button>
  `,
  host: { class: 'flex flex-col px-4 pb-safe pt-2' },
})
export class ActionSheetComponent {
  protected readonly config = inject<ActionSheetConfig>(MAT_BOTTOM_SHEET_DATA)
  protected readonly ref = inject(MatBottomSheetRef<ActionSheetComponent>)

  protected select(action: SheetAction): void {
    this.ref.dismiss()
    action.onSelect()
  }
}

/** Action sheet (MatBottomSheet owns bottom sheets, ADR-0002): a titled list of
 *  actions with a cancel affordance; selecting dismisses, then runs. */
@Injectable({ providedIn: 'root' })
export class ActionSheet {
  private readonly sheets = inject(MatBottomSheet)

  open(config: ActionSheetConfig): void {
    this.sheets.open(ActionSheetComponent, { data: config, panelClass: 'ms-sheet-panel' })
  }
}
