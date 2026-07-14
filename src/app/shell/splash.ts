import { Component, output, signal } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import { Threshold } from './threshold'
import { WordReveal } from './word-reveal'

const FULL_MS = 2400
const REDUCED_MS = 500
const FADE_MS = 400

/** Brand splash shown once per launch; auto-dismisses, skippable. */
@Component({
  selector: 'ms-splash',
  imports: [TranslocoPipe, Threshold, WordReveal],
  templateUrl: './splash.html',
  styleUrl: './splash.css',
  host: { '[class.ms-splash-leaving]': 'leaving()' },
})
export class Splash {
  readonly done = output<void>()
  protected readonly leaving = signal(false)

  private readonly timer = setTimeout(() => this.dismiss(), this.duration())

  protected dismiss(): void {
    if (this.leaving()) return
    clearTimeout(this.timer)
    this.leaving.set(true)
    setTimeout(() => this.done.emit(), FADE_MS)
  }

  private duration(): number {
    const reduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset['reduceMotion'] === 'true'
    return reduced ? REDUCED_MS : FULL_MS
  }
}
