import { Component, computed, input, output } from '@angular/core'
import { LucideAngularModule } from 'lucide-angular'
import type { LucideIconData } from 'lucide-angular'

export interface SegmentedOption<T extends string = string> {
  value: T
  label: string
  icon?: LucideIconData
  ariaLabel?: string
}

/**
 * Equal-width segment picker with a sliding pill under the active option. The
 * pill is one element translated between slots, so switching reads as the same
 * surface gliding — not two pills cross-fading.
 */
@Component({
  selector: 'ms-segmented-control',
  imports: [LucideAngularModule],
  template: `
    <span
      aria-hidden="true"
      class="ms-segment-pill absolute top-1 bottom-1 left-1 rounded-control bg-card shadow-rest"
      [style.width]="pillWidth()"
      [style.transform]="pillTransform()"
    ></span>
    @for (option of options(); track option.value) {
      <button
        type="button"
        (click)="valueChange.emit(option.value)"
        [attr.aria-pressed]="option.value === value()"
        [attr.aria-label]="option.ariaLabel ?? null"
        class="relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-control text-[length:var(--ms-text-sub)] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
        [class]="segmentClass(option.value)"
      >
        @if (option.icon; as icon) {
          <lucide-icon [img]="icon" class="size-4" aria-hidden="true" />
        }
        {{ option.label }}
      </button>
    }
  `,
  host: {
    role: 'group',
    class: 'relative flex rounded-card bg-primary/[0.06] p-1',
    '[attr.aria-label]': 'label()',
  },
  styles: `
    .ms-segment-pill {
      transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    }

    @media (prefers-reduced-motion: reduce) {
      .ms-segment-pill {
        transition: none;
      }
    }
  `,
})
export class SegmentedControl<T extends string = string> {
  readonly options = input.required<readonly SegmentedOption<T>[]>()
  readonly value = input.required<T>()
  readonly label = input('')
  readonly size = input<'sm' | 'md'>('md')
  readonly valueChange = output<T>()

  private readonly activeIndex = computed(() =>
    Math.max(
      0,
      this.options().findIndex((option) => option.value === this.value()),
    ),
  )

  protected readonly pillWidth = computed(() => `calc((100% - 0.5rem) / ${this.options().length})`)

  protected readonly pillTransform = computed(() => `translateX(${this.activeIndex() * 100}%)`)

  protected segmentClass(value: T): string {
    const padding = this.size() === 'sm' ? 'py-2' : 'py-3'
    const ink = value === this.value() ? 'text-primary' : 'text-primary/50'
    return `${padding} ${ink}`
  }
}
