import { Directive, inject, input, output, DestroyRef } from '@angular/core'

/**
 * Press-and-hold vs tap on one element: holding fires `longPress`; movement or an
 * early release cancels the hold and the release fires `shortTap`. The click that
 * trails a fired hold is swallowed so a hold never also activates the row.
 */
@Directive({
  selector: '[msLongPress]',
  host: {
    '(pointerdown)': 'down($event)',
    '(pointermove)': 'move($event)',
    '(pointerup)': 'clear()',
    '(pointerleave)': 'clear()',
    '(pointercancel)': 'clear()',
    '(contextmenu)': 'context($event)',
    '(click)': 'click($event)',
  },
})
export class LongPress {
  readonly delay = input(450)
  readonly moveTolerance = input(10)
  readonly longPress = output<void>()
  readonly shortTap = output<void>()

  private timer: number | undefined
  private fired = false
  private origin: { x: number; y: number } | null = null

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clear())
  }

  protected down(event: PointerEvent): void {
    this.fired = false
    this.origin = { x: event.clientX, y: event.clientY }
    this.timer = window.setTimeout(() => {
      this.fired = true
      this.longPress.emit()
    }, this.delay())
  }

  protected move(event: PointerEvent): void {
    if (!this.origin) return
    if (
      Math.abs(event.clientX - this.origin.x) > this.moveTolerance() ||
      Math.abs(event.clientY - this.origin.y) > this.moveTolerance()
    ) {
      this.clear()
    }
  }

  protected clear(): void {
    if (this.timer !== undefined) {
      window.clearTimeout(this.timer)
      this.timer = undefined
    }
    this.origin = null
  }

  protected context(event: Event): void {
    if (this.fired) event.preventDefault()
  }

  protected click(event: Event): void {
    if (this.fired) {
      this.fired = false
      event.preventDefault()
      event.stopPropagation()
      return
    }
    this.shortTap.emit()
  }
}
