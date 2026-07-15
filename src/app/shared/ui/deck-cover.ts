import { Component, computed, input } from '@angular/core'

const PRESET_PREFIX = 'from-'

/**
 * Identity tile for decks and folders: an emoji icon on the entity's gradient.
 * `color` is either a preset Tailwind gradient pair (`from-* to-*`) or a raw CSS
 * color that gets a derived two-stop gradient. An `image` replaces the gradient
 * and tucks the icon into the corner. Size, rounding, and rings come from the
 * host's classes.
 */
@Component({
  selector: 'ms-deck-cover',
  template: `
    @if (image()) {
      <span
        class="absolute inset-0 bg-cover bg-center"
        [style.background-image]="'url(' + image() + ')'"
      ></span>
      <span
        class="absolute inset-0 bg-linear-to-t from-[color-mix(in_oklch,var(--primary)_45%,transparent)] via-transparent to-[color-mix(in_oklch,var(--primary)_12%,transparent)]"
      ></span>
      @if (!hideIcon()) {
        <span
          class="absolute right-1.5 bottom-1 drop-shadow"
          [class]="iconClass()"
          style="font-size: 0.7em"
          >{{ icon() }}</span
        >
      }
    } @else if (!hideIcon()) {
      <span [class]="iconClass()">{{ icon() }}</span>
    }
  `,
  host: {
    'aria-hidden': 'true',
    '[class]': 'hostClass()',
    '[style.background-image]': 'customGradient()',
  },
})
export class DeckCover {
  readonly icon = input.required<string>()
  readonly color = input('')
  readonly image = input('')
  readonly iconClass = input('text-2xl leading-none')
  readonly hideIcon = input(false)

  private readonly isPreset = computed(() => this.color().startsWith(PRESET_PREFIX))

  protected readonly hostClass = computed(() => {
    const base = 'relative flex shrink-0 items-center justify-center overflow-hidden'
    if (this.image()) return `${base} bg-primary`
    return this.isPreset() ? `${base} bg-linear-to-br ${this.color()}` : base
  })

  protected readonly customGradient = computed(() => {
    const color = this.color()
    if (this.image() || !color || this.isPreset()) return null
    return `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color}, black 22%))`
  })
}
