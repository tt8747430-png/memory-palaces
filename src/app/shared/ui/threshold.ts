import { Component, input } from '@angular/core'

/**
 * The Mindscape palace-threshold logo, drawn with a staggered stroke animation.
 * Reduced motion (system or preference) freezes it at the final frame via the
 * global animation kill-switch.
 */
@Component({
  selector: 'ms-threshold',
  templateUrl: './threshold.html',
  styleUrl: './threshold.css',
  host: {
    '[class.ms-threshold-light]': "tone() === 'light'",
    '[class.ms-threshold-static]': '!animated()',
  },
})
export class Threshold {
  readonly tone = input<'dark' | 'light'>('dark')
  readonly animated = input(true)
}
