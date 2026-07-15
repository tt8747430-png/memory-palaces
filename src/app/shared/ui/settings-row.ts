import { Component, input, output } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import { MatSlideToggle } from '@angular/material/slide-toggle'
import { ChevronRight, LucideAngularModule } from 'lucide-angular'
import type { LucideIconData } from 'lucide-angular'

/**
 * One settings list row: icon tile, label/description, and a trailing control by
 * `kind` — a switch (whole row is the target; the Material toggle is its visual),
 * a nav chevron with optional value, a plain action, or a read-only value.
 */
@Component({
  selector: 'ms-settings-row',
  imports: [NgTemplateOutlet, MatSlideToggle, LucideAngularModule],
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
  readonly kind = input.required<'toggle' | 'nav' | 'action' | 'value'>()
  readonly icon = input.required<LucideIconData>()
  readonly label = input.required<string>()
  readonly description = input('')
  readonly tone = input<'default' | 'danger'>('default')
  readonly value = input('')
  readonly disabled = input(false)
  readonly checked = input(false)
  readonly checkedChange = output<boolean>()
  readonly activate = output<void>()

  protected readonly chevronRight = ChevronRight
}
