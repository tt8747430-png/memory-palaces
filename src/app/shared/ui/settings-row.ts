import { Component, computed, input, output } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import { MatSlideToggle } from '@angular/material/slide-toggle'
import { Menu } from 'primeng/menu'
import type { MenuItem } from 'primeng/api'
import { Check, ChevronRight, ChevronsUpDown, LucideAngularModule } from 'lucide-angular'
import type { LucideIconData } from 'lucide-angular'

export interface SettingsSelectOption {
  value: string
  label: string
  icon?: LucideIconData
}

/**
 * One settings list row: icon tile, label/description, and a trailing control by
 * `kind` — a switch (whole row is the target; the Material toggle is its visual),
 * a nav chevron with optional value, a plain action, a read-only value, or a
 * compact select (current value opens a PrimeNG popup menu, ADR-0002).
 */
@Component({
  selector: 'ms-settings-row',
  imports: [NgTemplateOutlet, MatSlideToggle, Menu, LucideAngularModule],
  template: `
    @switch (kind()) {
      @case ('toggle') {
        <button
          type="button"
          role="switch"
          [attr.aria-checked]="checked()"
          [attr.aria-label]="label()"
          (click)="checkedChange.emit(!checked())"
          class="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-primary/[0.04]"
        >
          <ng-container *ngTemplateOutlet="body" />
          <mat-slide-toggle
            class="pointer-events-none"
            tabindex="-1"
            aria-hidden="true"
            [checked]="checked()"
          />
        </button>
      }
      @case ('nav') {
        <button
          type="button"
          [attr.aria-label]="label()"
          (click)="activate.emit()"
          [disabled]="disabled()"
          class="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-primary/[0.04] disabled:pointer-events-none disabled:opacity-45"
        >
          <ng-container *ngTemplateOutlet="body" />
          @if (value()) {
            <span class="shrink-0 text-[length:var(--ms-text-label)] text-muted-foreground">
              {{ value() }}
            </span>
          }
          <lucide-icon
            [img]="chevronRight"
            class="size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-active:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      }
      @case ('action') {
        <button
          type="button"
          [attr.aria-label]="label()"
          (click)="activate.emit()"
          [disabled]="disabled()"
          class="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-primary/[0.04] disabled:pointer-events-none disabled:opacity-45"
        >
          <ng-container *ngTemplateOutlet="body" />
        </button>
      }
      @case ('select') {
        <div class="flex w-full items-center gap-3 py-3 pl-4 pr-2.5">
          <ng-container *ngTemplateOutlet="body" />
          <button
            type="button"
            [attr.aria-label]="label()"
            aria-haspopup="menu"
            (click)="selectMenu.toggle($event)"
            class="flex min-h-11 shrink-0 items-center gap-1 rounded-control pl-2 pr-1.5 text-right transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
          >
            @if (selectedOption()?.icon; as optionIcon) {
              <span class="grid size-5 shrink-0 place-items-center text-accent" aria-hidden="true">
                <lucide-icon [img]="optionIcon" class="size-[18px]" />
              </span>
            }
            <span
              class="min-w-0 truncate text-[length:var(--ms-text-body)] font-semibold text-heading"
            >
              {{ selectedOption()?.label ?? '' }}
            </span>
            <lucide-icon
              [img]="chevronsUpDown"
              class="size-4 shrink-0 text-muted-foreground/70"
              aria-hidden="true"
            />
          </button>
          <p-menu #selectMenu [model]="selectItems()" [popup]="true" appendTo="body">
            <ng-template #item let-item>
              <a class="p-menu-item-link flex items-center gap-2">
                <span class="min-w-0 flex-1">{{ item.label }}</span>
                @if (item.state?.['active']) {
                  <lucide-icon
                    [img]="check"
                    class="size-4 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                }
              </a>
            </ng-template>
          </p-menu>
        </div>
      }
      @default {
        <div class="flex w-full items-center gap-3 px-4 py-3">
          <ng-container *ngTemplateOutlet="body" />
          <span class="shrink-0 text-[length:var(--ms-text-label)] text-muted-foreground">
            {{ value() }}
          </span>
        </div>
      }
    }

    <ng-template #body>
      <span class="flex min-w-0 flex-1 items-center gap-3">
        <span
          aria-hidden="true"
          class="grid size-9 shrink-0 place-items-center rounded-control transition-transform duration-200 ease-out group-active:scale-[0.92]"
          [class]="
            tone() === 'danger'
              ? 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]'
              : 'bg-info-surface text-info-foreground'
          "
        >
          <lucide-icon [img]="icon()" class="size-[18px]" aria-hidden="true" />
        </span>
        <span class="min-w-0">
          <span
            class="block truncate text-[length:var(--ms-text-sub)] font-semibold"
            [class]="tone() === 'danger' ? 'text-[var(--danger-on-surface)]' : 'text-heading'"
          >
            {{ label() }}
          </span>
          @if (description()) {
            <span
              class="mt-0.5 block truncate text-[length:var(--ms-text-label)] leading-snug text-muted-foreground"
            >
              {{ description() }}
            </span>
          }
        </span>
      </span>
    </ng-template>
  `,
  host: { class: 'block' },
})
export class SettingsRow {
  readonly kind = input.required<'toggle' | 'nav' | 'action' | 'value' | 'select'>()
  readonly icon = input.required<LucideIconData>()
  readonly label = input.required<string>()
  readonly description = input('')
  readonly tone = input<'default' | 'danger'>('default')
  readonly value = input('')
  readonly disabled = input(false)
  readonly checked = input(false)
  /** `select` kind only: the choices behind the trailing picker. */
  readonly options = input<SettingsSelectOption[]>([])
  readonly checkedChange = output<boolean>()
  readonly activate = output<void>()
  readonly valueChange = output<string>()

  protected readonly chevronRight = ChevronRight
  protected readonly chevronsUpDown = ChevronsUpDown
  protected readonly check = Check

  protected readonly selectedOption = computed(() =>
    this.options().find((option) => option.value === this.value()),
  )

  protected readonly selectItems = computed<MenuItem[]>(() =>
    this.options().map((option) => ({
      label: option.label,
      state: { active: option.value === this.value() },
      command: () => this.valueChange.emit(option.value),
    })),
  )
}
