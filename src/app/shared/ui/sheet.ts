import { NgComponentOutlet } from '@angular/common'
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  createComponent,
  DOCUMENT,
  EnvironmentInjector,
  Injectable,
  InjectionToken,
  Injector,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core'
import type { Type } from '@angular/core'
import { Drawer } from 'primeng/drawer'

/** The value passed to `SheetService.open()`, injected by the sheet component. */
export const SHEET_DATA = new InjectionToken<unknown>('SHEET_DATA')

/**
 * Enter/leave duration for every sheet, pinned rather than read back from CSS.
 *
 * `Drawer` exposes no "leave finished" output: `onHide` fires when a dismiss is
 * *requested*, and the internal `onAfterLeave` deliberately emits nothing. The
 * motion hook can't be borrowed either — the directive resolves
 * `onAfterLeave: options.onAfterLeave ?? handleAfterLeave`, so supplying one
 * *replaces* Drawer's own cleanup (z-index release, listener unbind) instead of
 * running beside it. Pinning the duration turns the motion into a deterministic
 * timer, letting the host settle on the same constant that drives the animation.
 */
const SHEET_MOTION_MS = 300

export interface SheetConfig<D = unknown> {
  /** Injected into the sheet component as `SHEET_DATA`. */
  data?: D
  /** Whether tapping the scrim or pressing Escape dismisses. Defaults to true. */
  dismissible?: boolean
}

/**
 * Handle on an open sheet — the sheet component injects it to dismiss itself,
 * and the opener awaits `closed` for the result.
 */
export class SheetRef<R = unknown> {
  private settle!: (result: R | undefined) => void
  private begin: (result: R | undefined) => void = () => {
    /* replaced by attach() once the host exists */
  }

  /** Resolves with the dismissal result once the sheet has animated out. */
  readonly closed = new Promise<R | undefined>((resolve) => {
    this.settle = resolve
  })

  /** Dismiss the sheet, optionally handing a result to `closed`. */
  dismiss(result?: R): void {
    this.begin(result)
  }

  /** @internal Wired by `SheetService` once the host exists. */
  attach(begin: (result: R | undefined) => void): void {
    this.begin = begin
  }

  /** @internal Called by `SheetService` after the leave animation. */
  finish(result: R | undefined): void {
    this.settle(result)
  }
}

/**
 * Host for one sheet: a bottom `p-drawer` in headless mode (ADR-0002).
 *
 * Headless replaces only the drawer's inner markup — PrimeNG still owns the
 * scrim, focus trap, Escape handling, scroll block, motion and z-index, and the
 * sheet component owns every pixel inside (handle, header, body, footer).
 */
@Component({
  selector: 'ms-sheet-host',
  imports: [Drawer, NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-drawer
      position="bottom"
      styleClass="ms-sheet"
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      [dismissible]="dismissible()"
      [closeOnEscape]="dismissible()"
      [showCloseIcon]="false"
      [blockScroll]="true"
      [motionOptions]="{ duration: motionMs }"
    >
      <ng-template #headless>
        <ng-container *ngComponentOutlet="content(); injector: contentInjector()" />
      </ng-template>
    </p-drawer>
  `,
})
export class SheetHost {
  readonly content = input.required<Type<unknown>>()
  readonly contentInjector = input.required<Injector>()
  readonly dismissible = input(true)

  private readonly drawer = viewChild(Drawer)
  private readonly document = inject(DOCUMENT)
  protected readonly visible = signal(false)
  private closing = false
  private result: unknown

  /** Reduced motion skips the animation outright, so nothing is worth waiting for. */
  protected readonly motionMs = this.document.defaultView?.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
    ? 0
    : SHEET_MOTION_MS

  /** @internal Wired by `SheetService`: runs once the leave animation has finished. */
  settled: (result: unknown) => void = () => {
    /* replaced by SheetService.open() */
  }

  /** @internal */
  open(): void {
    this.visible.set(true)
  }

  /**
   * @internal Programmatic dismissal.
   *
   * Goes through Drawer's own `close()` rather than just clearing `visible`.
   * Only `close()` reaches `disableModality()`, which starts the scrim's leave
   * animation — and that animation's `animationend` is the sole thing that
   * removes the scrim and unblocks body scroll. Clearing `visible` alone skips
   * it, and `Drawer.onDestroy()` won't cover for us: it guards its own cleanup
   * with `if (this.visible && this.modal)`, which is already false by then. The
   * result is a stranded scrim over a page that can no longer scroll.
   */
  close(result: unknown): void {
    if (this.closing) return
    this.result = result
    const drawer = this.drawer()
    if (drawer) drawer.close(new Event('close'))
    else this.finalize()
  }

  /** Drawer announces every dismissal it runs — scrim tap, Escape, and `close()`
   *  above — as `visible → false`. */
  protected onVisibleChange(value: boolean): void {
    if (!value) this.finalize()
  }

  private finalize(): void {
    if (this.closing) return
    this.closing = true
    this.visible.set(false)
    setTimeout(() => {
      // Belt and braces: if the scrim's animationend never landed, its removal
      // never ran, and once the host is gone nothing else will do it.
      const drawer = this.drawer()
      if (drawer?.mask) drawer.destroyModal()
      this.settled(this.result)
    }, this.motionMs)
  }
}

/**
 * Opens bottom sheets (PrimeNG headless drawers own sheets, ADR-0002).
 *
 * Mirrors the shape callers already know: `open()` returns a ref whose `closed`
 * promise carries the result, so a sheet's public API stays a promise-returning
 * `open*()` function co-located with the sheet (ADR-0008).
 */
@Injectable({ providedIn: 'root' })
export class SheetService {
  private readonly appRef = inject(ApplicationRef)
  private readonly environmentInjector = inject(EnvironmentInjector)
  private readonly injector = inject(Injector)
  private readonly document = inject(DOCUMENT)

  open<C, D = unknown, R = unknown>(component: Type<C>, config: SheetConfig<D> = {}): SheetRef<R> {
    const ref = new SheetRef<R>()
    const contentInjector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: SHEET_DATA, useValue: config.data ?? null },
        { provide: SheetRef, useValue: ref },
      ],
    })

    const host = createComponent(SheetHost, { environmentInjector: this.environmentInjector })
    host.setInput('content', component)
    host.setInput('contentInjector', contentInjector)
    host.setInput('dismissible', config.dismissible ?? true)

    this.document.body.appendChild(host.location.nativeElement)
    this.appRef.attachView(host.hostView)

    ref.attach((result) => host.instance.close(result))
    host.instance.settled = (result) => {
      this.appRef.detachView(host.hostView)
      host.destroy()
      host.location.nativeElement.remove()
      ref.finish(result as R | undefined)
    }

    // Mount closed, then open, so the drawer runs its enter animation.
    host.instance.open()
    return ref
  }
}
