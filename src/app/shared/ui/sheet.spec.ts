import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Component, inject } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { providePrimeNG } from 'primeng/config'
import { SHEET_DATA, SheetRef, SheetService } from './sheet'

@Component({
  selector: 'ms-test-sheet',
  template: `<button type="button" (click)="ref.dismiss('picked')">{{ data }}</button>`,
})
class TestSheet {
  protected readonly ref = inject(SheetRef<string>)
  protected readonly data = inject<string>(SHEET_DATA)
}

/** Drives the drawer's motion + scrim timers, both pinned to SHEET_MOTION_MS. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 400))

const masks = (): number => document.body.querySelectorAll('.p-drawer-mask').length

describe('SheetService', () => {
  let sheets: SheetService

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [providePrimeNG({})] })
    sheets = TestBed.inject(SheetService)
  })

  afterEach(() => {
    document.body.querySelectorAll('.p-drawer-mask').forEach((mask) => mask.remove())
  })

  it('renders the sheet component with its data', async () => {
    sheets.open<TestSheet, string, string>(TestSheet, { data: 'hello' })
    await TestBed.inject(SheetService) // settle injector
    TestBed.tick()

    expect(document.body.textContent).toContain('hello')
  })

  it('resolves closed with the result the sheet dismissed with', async () => {
    const ref = sheets.open<TestSheet, string, string>(TestSheet, { data: 'hello' })
    TestBed.tick()

    document.body.querySelector<HTMLButtonElement>('ms-test-sheet button')?.click()
    TestBed.tick()

    await expect(ref.closed).resolves.toBe('picked')
  })

  it('resolves undefined when dismissed without a result', async () => {
    const ref = sheets.open<TestSheet, string, string>(TestSheet, { data: 'hello' })
    TestBed.tick()

    ref.dismiss()
    TestBed.tick()

    await expect(ref.closed).resolves.toBeUndefined()
  })

  /**
   * Regression: a programmatic dismissal used to clear `visible` directly, which
   * never reaches `disableModality()` — the only path that removes the scrim and
   * unblocks body scroll. `Drawer.onDestroy()` doesn't cover for it either, since
   * it guards cleanup with `if (this.visible && this.modal)`, already false by
   * then. Every sheet returning a result stranded a scrim over a frozen page.
   */
  it('leaves no scrim behind after a dismissal that carries a result', async () => {
    const ref = sheets.open<TestSheet, string, string>(TestSheet, { data: 'hello' })
    TestBed.tick()
    expect(masks()).toBe(1)

    ref.dismiss('picked')
    TestBed.tick()
    await ref.closed
    await settle()
    TestBed.tick()

    expect(masks()).toBe(0)
    expect(document.body.querySelector('ms-sheet-host')).toBeNull()
  })

  it('leaves no scrim behind after a scrim-tap dismissal', async () => {
    const ref = sheets.open<TestSheet, string, string>(TestSheet, { data: 'hello' })
    TestBed.tick()

    document.body.querySelector<HTMLElement>('.p-drawer-mask')?.click()
    TestBed.tick()
    await ref.closed
    await settle()
    TestBed.tick()

    expect(masks()).toBe(0)
  })
})
