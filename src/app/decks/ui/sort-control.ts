import { Component, computed, input, output } from '@angular/core'
import { Menu } from 'primeng/menu'
import type { MenuItem } from 'primeng/api'
import { Check, ChevronDown, LucideAngularModule } from 'lucide-angular'
import type { LucideIconData } from 'lucide-angular'

export interface SortOption<T extends string> {
  value: T
  label: string
  icon: LucideIconData
}

/** Compact sort picker: the active option in a chip, the rest in a PrimeNG popup
 *  menu (menus are PrimeNG's, ADR-0002). */
@Component({
  selector: 'ms-sort-control',
  imports: [Menu, LucideAngularModule],
  template: `
    <button
      type="button"
      [attr.aria-label]="label()"
      aria-haspopup="menu"
      (click)="menu.toggle($event)"
      class="group flex h-9 min-w-0 items-center gap-1.5 rounded-control bg-card pr-2 pl-2.5 shadow-rest transition-transform active:scale-[0.97]"
    >
      @if (active(); as current) {
        <lucide-icon [img]="current.icon" class="size-4 shrink-0 text-accent" aria-hidden="true" />
        <span class="truncate text-[length:var(--ms-text-label)] font-semibold text-heading">
          {{ current.label }}
        </span>
      }
      <lucide-icon
        [img]="chevronDown"
        class="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </button>

    <p-menu #menu [model]="items()" [popup]="true" appendTo="body">
      <ng-template #item let-item>
        <a class="p-menu-item-link flex items-center gap-2">
          <span class="min-w-0 flex-1">{{ item.label }}</span>
          @if (item.state?.['active']) {
            <lucide-icon [img]="check" class="size-4 shrink-0 text-accent" aria-hidden="true" />
          }
        </a>
      </ng-template>
    </p-menu>
  `,
  host: { class: 'inline-flex' },
})
export class SortControl<T extends string = string> {
  readonly label = input.required<string>()
  readonly value = input.required<T>()
  readonly options = input.required<SortOption<T>[]>()
  readonly valueChange = output<T>()

  protected readonly chevronDown = ChevronDown
  protected readonly check = Check

  protected readonly active = computed(
    () => this.options().find((option) => option.value === this.value()) ?? this.options()[0],
  )

  protected readonly items = computed<MenuItem[]>(() =>
    this.options().map((option) => ({
      label: option.label,
      state: { active: option.value === this.value() },
      command: () => this.valueChange.emit(option.value),
    })),
  )
}
