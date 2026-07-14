import { Component, computed, input } from '@angular/core'

/**
 * Reveals text word by word — rise, unblur, fade in — with a configurable
 * start delay and per-word stagger. The global reduced-motion kill-switch
 * collapses it to an instant reveal.
 */
@Component({
  selector: 'ms-word-reveal',
  template: `
    <span [attr.aria-label]="text()">
      @for (word of words(); track $index; let last = $last) {
        <span aria-hidden="true"
          ><span
            class="t-word"
            [style.animation-delay]="delay() + $index * stagger() + 's'"
            >{{ word }}</span
          >{{ last ? '' : ' ' }}</span
        >
      }
    </span>
  `,
  styleUrl: './word-reveal.css',
})
export class WordReveal {
  readonly text = input.required<string>()
  readonly delay = input(0)
  readonly stagger = input(0.08)

  protected readonly words = computed(() => this.text().split(/\s+/).filter(Boolean))
}
