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
import { Dialog } from 'primeng/dialog'

/** The value passed to `DialogService.open()`, injected by the dialog component. */
export const DIALOG_DATA = new InjectionToken<unknown>('DIALOG_DATA')

/**
 * Enter/leave duration for every dialog. PrimeNG's own `p-dialog` motion is
 * 300ms, so this matches it rather than overriding — see the sibling note in
 * `sheet.ts` for why the host settles on a constant instead of an output.
 */
const DIALOG_MOTION_MS = 300

export interface DialogConfig<D = unknown> {
  /** Injected into the dialog component as `DIALOG_DATA`. */
  data?: D
  /** Whether tapping the scrim or pressing Escape dismisses. Defaults to true. */
  dismissible?: boolean
}

/**
 * Handle on an open dialog — the dialog component injects it to close itself,
 * and the opener awaits `closed` for the result.
 */
export class DialogRef<R = unknown> {
  private settle!: (result: R | undefined) => void
  private begin: (result: R | undefined) => void = () => {
    /* replaced by attach() once the host exists */
  }

  /** Resolves with the result once the dialog has animated out. */
  readonly closed = new Promise<R | undefined>((resolve) => {
    this.settle = resolve
  })

  /** Close the dialog, optionally handing a result to `closed`. */
  dismiss(result?: R): void {
    this.begin(result)
  }

  /** @internal Wired by `DialogService` once the host exists. */
  attach(begin: (result: R | undefined) => void): void {
    this.begin = begin
  }

  /** @internal Called by `DialogService` after the leave animation. */
  finish(result: R | undefined): void {
    this.settle(result)
  }
}

/**
 * Host for one dialog: a centered `p-dialog` in headless mode (ADR-0002).
 *
 * As with sheets, headless replaces only the inner markup — PrimeNG keeps the
 * scrim, focus trap, Escape handling, motion and z-index.
 */
@Component({
  selector: 'ms-dialog-host',
  imports: [Dialog, NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      styleClass="ms-dialog"
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      [dismissableMask]="dismissible()"
      [closeOnEscape]="dismissible()"
      [showHeader]="false"
      [blockScroll]="true"
      [draggable]="false"
      [resizable]="false"
      [motionOptions]="{ duration: motionMs }"
    >
      <ng-template #headless>
        <ng-container *ngComponentOutlet="content(); injector: contentInjector()" />
      </ng-template>
    </p-dialog>
  `,
})
export class DialogHost {
  readonly content = input.required<Type<unknown>>()
  readonly contentInjector = input.required<Injector>()
  readonly dismissible = input(true)

  private readonly dialog = viewChild(Dialog)
  private readonly document = inject(DOCUMENT)
  protected readonly visible = signal(false)
  private closing = false
  private result: unknown

  /** Reduced motion skips the animation outright, so nothing is worth waiting for. */
  protected readonly motionMs = this.document.defaultView?.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
    ? 0
    : DIALOG_MOTION_MS

  /** @internal Wired by `DialogService`: runs once the leave animation has finished. */
  settled: (result: unknown) => void = () => {
    /* replaced by DialogService.open() */
  }

  /** @internal */
  open(): void {
    this.visible.set(true)
  }

  /**
   * @internal Programmatic dismissal — routed through Dialog's own `close()` so
   * it takes the same path as a scrim tap, keeping its modality teardown (and
   * the refcounted body-scroll block) in step. See the sibling note in
   * `sheet.ts`, where skipping this path strands the scrim outright.
   */
  close(result: unknown): void {
    if (this.closing) return
    this.result = result
    const dialog = this.dialog()
    if (dialog) dialog.close(new Event('close'))
    else this.finalize()
  }

  /** Dialog announces every dismissal it runs — scrim tap, Escape, and `close()`
   *  above — as `visible → false`. */
  protected onVisibleChange(value: boolean): void {
    if (!value) this.finalize()
  }

  private finalize(): void {
    if (this.closing) return
    this.closing = true
    this.visible.set(false)
    setTimeout(() => this.settled(this.result), this.motionMs)
  }
}

/**
 * Opens modal dialogs (PrimeNG headless dialogs own dialogs, ADR-0002).
 *
 * The sibling of `SheetService`: same promise-returning shape, centered instead
 * of bottom-anchored.
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly appRef = inject(ApplicationRef)
  private readonly environmentInjector = inject(EnvironmentInjector)
  private readonly injector = inject(Injector)
  private readonly document = inject(DOCUMENT)

  open<C, D = unknown, R = unknown>(
    component: Type<C>,
    config: DialogConfig<D> = {},
  ): DialogRef<R> {
    const ref = new DialogRef<R>()
    const contentInjector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: DIALOG_DATA, useValue: config.data ?? null },
        { provide: DialogRef, useValue: ref },
      ],
    })

    const host = createComponent(DialogHost, { environmentInjector: this.environmentInjector })
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

    // Mount closed, then open, so the dialog runs its enter animation.
    host.instance.open()
    return ref
  }
}
