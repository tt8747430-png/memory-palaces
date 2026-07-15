import { Component, input, output } from '@angular/core'
import { Check, LucideAngularModule } from 'lucide-angular'
import { EmojiField } from './emoji-field'

export interface ColorOption {
  id: string
  value: string
}

/** Identity picker: an emoji field beside a scrollable radiogroup of gradient swatches. */
@Component({
  selector: 'ms-icon-color-row',
  imports: [EmojiField, LucideAngularModule],
  template: `
    <p class="mb-2 text-[length:var(--ms-text-label)] font-semibold text-heading">{{ label() }}</p>
    <div class="flex items-center gap-3">
      <ms-emoji-field
        [value]="icon()"
        [label]="iconLabel()"
        (valueChange)="iconChange.emit($event)"
      />
      <span aria-hidden="true" class="h-9 w-px shrink-0 bg-border"></span>
      <div
        role="radiogroup"
        [attr.aria-label]="label()"
        class="-my-1.5 flex flex-1 items-center gap-2.5 overflow-x-auto py-1.5 scrollbar-hide"
      >
        @for (option of colorOptions(); track option.id) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="color() === option.value"
            [attr.aria-label]="option.id"
            (click)="colorChange.emit(option.value)"
            class="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br shadow-rest transition-transform active:scale-90"
            [class]="option.value"
            [class.ms-active-swatch]="color() === option.value"
          >
            @if (color() === option.value) {
              <lucide-icon [img]="check" class="size-4 text-white drop-shadow" aria-hidden="true" />
            }
          </button>
        }
      </div>
    </div>
  `,
  host: { class: 'block' },
  styles: `
    .ms-active-swatch {
      box-shadow:
        0 0 0 2px var(--surface),
        0 0 0 4px var(--primary);
    }
  `,
})
export class IconColorRow {
  readonly icon = input.required<string>()
  readonly color = input.required<string>()
  readonly colorOptions = input.required<readonly ColorOption[]>()
  readonly label = input.required<string>()
  readonly iconLabel = input.required<string>()
  readonly iconChange = output<string>()
  readonly colorChange = output<string>()

  protected readonly check = Check
}
