import { Component, input, output } from '@angular/core'
import { LucideAngularModule, Smile } from 'lucide-angular'

function lastGrapheme(input: string): string {
  if (!input) return ''
  const parts = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(input)]
  return parts.at(-1)?.segment ?? ''
}

/** Single-emoji input: the OS emoji keyboard types into an invisible field and the
 *  last pictographic grapheme becomes the value. */
@Component({
  selector: 'ms-emoji-field',
  imports: [LucideAngularModule],
  template: `
    @if (value()) {
      <span aria-hidden="true" class="text-3xl leading-none">{{ value() }}</span>
    } @else {
      <lucide-icon [img]="smile" class="size-6 text-muted-foreground" aria-hidden="true" />
    }
    <input
      #field
      [value]="value()"
      (input)="commit(field)"
      [attr.aria-label]="label()"
      inputmode="text"
      autocomplete="off"
      autocapitalize="none"
      spellcheck="false"
      class="absolute inset-0 size-full cursor-pointer rounded-card text-center text-3xl text-transparent caret-transparent outline-none"
    />
  `,
  host: {
    class:
      'relative grid size-14 shrink-0 place-items-center rounded-card bg-info-surface shadow-rest focus-within:ring-2 focus-within:ring-primary',
  },
})
export class EmojiField {
  readonly value = input.required<string>()
  readonly label = input.required<string>()
  readonly valueChange = output<string>()

  protected readonly smile = Smile

  protected commit(field: HTMLInputElement): void {
    const next = lastGrapheme(field.value.trim())
    if (next && /\p{Extended_Pictographic}/u.test(next)) this.valueChange.emit(next)
    // Non-emoji input never sticks: snap the field back to the (possibly new) value.
    field.value = this.value()
  }
}
