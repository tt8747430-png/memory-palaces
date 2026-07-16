import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core'
import { LucideAngularModule } from 'lucide-angular'
import type { LucideIconData } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { SWIPE_ACCENT } from '@app/shared/config/swipe'
import type { SwipeAccent } from '@app/shared/config/swipe'
import { impact } from '@app/shared/domain'

export interface SwipeAction {
  id: string
  icon: LucideIconData
  /** Transloco key — translated where the action renders (tray aria-label). */
  labelKey: string
  accent?: SwipeAccent
  onAction: () => void
}

const AXIS_LOCK = 8
/** Horizontal space each circular action reveals. */
const ACTION_WIDTH = 60
/** Extra swipe past the tray width before a release commits the edge action. */
const COMMIT_GAP = 64
/** Matches the app column's `px-5`, so the tray's outer circle lands where the
 *  row content sat before the swipe (only meaningful when `bleed`). */
const EDGE_INSET = 20

/** Settle spring — stiffness 540, damping 40, mass 1 (row glide to rest). */
const SETTLE_STIFFNESS = 540
const SETTLE_DAMPING = 40

type Side = 'leading' | 'trailing'

interface DragState {
  startX: number
  startY: number
  startOffset: number
  axis: 'h' | 'v' | null
  id: number
}

/**
 * iOS-style swipe actions on a list row. Drag horizontally to reveal a tray of
 * circular actions; keep pulling past the commit gap to arm and fire the edge
 * action on release. A half-revealed tray snaps open, anything less snaps shut.
 * Vertical movement wins the axis lock, so the list stays scrollable.
 */
@Component({
  selector: 'ms-swipe-row',
  imports: [LucideAngularModule, TranslocoPipe],
  template: `
    @if (leading().length > 0) {
      <div
        aria-hidden="true"
        class="absolute inset-y-0 left-0 -z-10 flex w-full items-center justify-start"
        [class]="bleed() ? 'pl-5' : ''"
        [style.opacity]="side() === 'leading' ? 1 : 0"
      >
        @for (action of leading(); track action.id; let first = $first) {
          <button
            type="button"
            tabindex="-1"
            [attr.aria-label]="action.labelKey | transloco"
            (click)="fireFromTray(action)"
            class="grid h-full w-15 shrink-0 place-items-center"
          >
            <!-- A small floating circle — the accent + glyph carry the meaning; the
                 label lives on aria-label so the tray stays compact and calm. -->
            <span
              class="ms-swipe-circle grid size-11 place-items-center rounded-full shadow-interactive active:brightness-95"
              [class]="ink(action)"
              [style.background-color]="fill(action)"
              [style.scale]="armed() === 'leading' && first ? 1.14 : 1"
            >
              <lucide-icon [img]="action.icon" class="size-5" aria-hidden="true" />
            </span>
          </button>
        }
      </div>
    }

    @if (trailing().length > 0) {
      <div
        aria-hidden="true"
        class="absolute inset-y-0 right-0 -z-10 flex w-full items-center justify-end"
        [class]="bleed() ? 'pr-5' : ''"
        [style.opacity]="side() === 'trailing' ? 1 : 0"
      >
        @for (action of trailing(); track action.id; let last = $last) {
          <button
            type="button"
            tabindex="-1"
            [attr.aria-label]="action.labelKey | transloco"
            (click)="fireFromTray(action)"
            class="grid h-full w-15 shrink-0 place-items-center"
          >
            <span
              class="ms-swipe-circle grid size-11 place-items-center rounded-full shadow-interactive active:brightness-95"
              [class]="ink(action)"
              [style.background-color]="fill(action)"
              [style.scale]="armed() === 'trailing' && last ? 1.14 : 1"
            >
              <lucide-icon [img]="action.icon" class="size-5" aria-hidden="true" />
            </span>
          </button>
        }
      </div>
    }

    <div
      #pan
      class="touch-pan-y"
      [class]="bleed() ? 'px-5' : ''"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="finish()"
      (pointercancel)="finish()"
    >
      <ng-content />
    </div>
  `,
  host: {
    class: 'relative isolate block overflow-x-clip [overflow-clip-margin:24px]',
    '[class]': "bleed() ? '-mx-5' : ''",
  },
  styles: `
    .ms-swipe-circle {
      /* The arm pop — a quick scale to 1.14 on the app's canonical ease-out. */
      transition:
        filter 150ms ease,
        scale 250ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    @media (prefers-reduced-motion: reduce) {
      .ms-swipe-circle {
        transition: filter 150ms ease;
      }
    }
  `,
})
export class SwipeRow {
  readonly leading = input<SwipeAction[]>([])
  readonly trailing = input<SwipeAction[]>([])
  readonly disabled = input(false)
  /** Break out of the app's `px-5` column so the tray can sit against the row's
   *  resting edge. The reveal bleeds; the circular actions are padded back in by
   *  `EDGE_INSET` so they line up with where the row content was. */
  readonly bleed = input(false)

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly pan = viewChild.required<ElementRef<HTMLDivElement>>('pan')

  /** Which tray the row currently exposes — drives tray opacity. */
  protected readonly side = signal<Side | null>(null)
  /** Which edge action is armed (pulled past the commit gap). */
  protected readonly armed = signal<Side | null>(null)
  private readonly openSide = signal<Side | null>(null)

  private x = 0
  private velocity = 0
  private raf = 0
  private drag: DragState | null = null
  private lastMoveTime = 0
  private suppressClick = false

  private readonly inset = computed(() => (this.bleed() ? EDGE_INSET : 0))
  private readonly leadingWidth = computed(() =>
    this.leading().length > 0 ? this.leading().length * ACTION_WIDTH + this.inset() : 0,
  )
  private readonly trailingWidth = computed(() =>
    this.trailing().length > 0 ? this.trailing().length * ACTION_WIDTH + this.inset() : 0,
  )
  private readonly leadingCommit = computed(() => this.leadingWidth() + COMMIT_GAP)
  private readonly trailingCommit = computed(() => this.trailingWidth() + COMMIT_GAP)

  constructor() {
    const destroyRef = inject(DestroyRef)

    afterNextRender(() => {
      // Capture phase, so a tap that ends a swipe (or lands on an open row) is
      // swallowed before the row's own click handlers run.
      this.pan().nativeElement.addEventListener('click', this.onClickCapture, true)
      document.addEventListener('pointerdown', this.onOutsidePointerDown, true)
    })

    destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.raf)
      document.removeEventListener('pointerdown', this.onOutsidePointerDown, true)
    })

    effect(() => {
      if (!this.disabled()) return
      untracked(() => {
        if (this.openSide() || this.x !== 0) this.reset()
      })
    })
  }

  protected fill(action: SwipeAction): string {
    return SWIPE_ACCENT[action.accent ?? 'slate'].fill
  }

  protected ink(action: SwipeAction): string {
    return SWIPE_ACCENT[action.accent ?? 'slate'].ink === 'dark'
      ? 'text-[color:var(--ms-navy-900)]'
      : 'text-white'
  }

  protected fireFromTray(action: SwipeAction): void {
    impact()
    this.close()
    action.onAction()
  }

  // ---- Gesture ----

  protected onPointerDown(event: PointerEvent): void {
    if (this.disabled()) return
    this.drag = {
      startX: event.clientX,
      startY: event.clientY,
      startOffset: this.x,
      axis: null,
      id: event.pointerId,
    }
    this.lastMoveTime = event.timeStamp
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.disabled()) return
    const state = this.drag
    if (!state) return
    const dx = event.clientX - state.startX
    const dy = event.clientY - state.startY
    if (state.axis === null) {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return
      if (Math.abs(dx) > Math.abs(dy)) {
        state.axis = 'h'
        this.cancelSpring()
        ;(event.currentTarget as HTMLElement).setPointerCapture?.(state.id)
      } else if (Math.abs(dy) > Math.abs(dx)) {
        this.drag = null
        return
      } else {
        return
      }
    }
    const next = this.clampOffset(state.startOffset + dx)
    const dt = (event.timeStamp - this.lastMoveTime) / 1000
    if (dt > 0) this.velocity = (next - this.x) / dt
    this.lastMoveTime = event.timeStamp
    this.apply(next)

    const nextArmed: Side | null =
      next <= -this.trailingCommit() && this.hasTrailing()
        ? 'trailing'
        : next >= this.leadingCommit() && this.hasLeading()
          ? 'leading'
          : null
    if (nextArmed !== this.armed()) {
      this.armed.set(nextArmed)
      if (nextArmed) impact()
    }
  }

  protected finish(): void {
    if (this.disabled()) return
    const state = this.drag
    this.drag = null
    if (!state || state.axis !== 'h') return
    this.suppressClick = true
    this.armed.set(null)

    const offset = this.x

    if (offset <= -this.trailingCommit() && this.hasTrailing()) {
      impact()
      this.trailing()[this.trailing().length - 1]!.onAction()
      this.close()
      return
    }
    if (offset >= this.leadingCommit() && this.hasLeading()) {
      impact()
      this.leading()[0]!.onAction()
      this.close()
      return
    }
    if (offset <= -this.trailingWidth() * 0.5 && this.hasTrailing()) {
      this.openSide.set('trailing')
      this.settle(-this.trailingWidth())
    } else if (offset >= this.leadingWidth() * 0.5 && this.hasLeading()) {
      this.openSide.set('leading')
      this.settle(this.leadingWidth())
    } else {
      this.close()
    }
  }

  private hasLeading(): boolean {
    return this.leading().length > 0
  }

  private hasTrailing(): boolean {
    return this.trailing().length > 0
  }

  private clampOffset(raw: number): number {
    if (raw > 0) {
      if (!this.hasLeading()) return raw * 0.12
      if (raw <= this.leadingCommit()) return raw
      return this.leadingCommit() + (raw - this.leadingCommit()) * 0.35
    }
    if (raw < 0) {
      if (!this.hasTrailing()) return raw * 0.12
      if (raw >= -this.trailingCommit()) return raw
      return -(this.trailingCommit() + (-raw - this.trailingCommit()) * 0.35)
    }
    return 0
  }

  // ---- Click interception ----

  private readonly onClickCapture = (event: MouseEvent): void => {
    if (this.suppressClick) {
      this.suppressClick = false
      event.preventDefault()
      event.stopPropagation()
      return
    }
    if (this.openSide()) {
      event.preventDefault()
      event.stopPropagation()
      this.close()
    }
  }

  private readonly onOutsidePointerDown = (event: PointerEvent): void => {
    if (!this.openSide()) return
    if (!this.host.nativeElement.contains(event.target as Node)) this.close()
  }

  // ---- Motion ----

  private close(): void {
    this.openSide.set(null)
    this.armed.set(null)
    this.settle(0)
  }

  /** Instant zero — for the disabled flip, mirroring a mid-gesture cancel. */
  private reset(): void {
    this.openSide.set(null)
    this.armed.set(null)
    this.cancelSpring()
    this.velocity = 0
    this.apply(0)
  }

  private apply(value: number): void {
    this.x = value
    this.pan().nativeElement.style.transform = `translateX(${value}px)`
    this.side.set(value > 0 ? 'leading' : value < 0 ? 'trailing' : null)
  }

  private cancelSpring(): void {
    if (this.raf === 0) return
    cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  private settle(to: number): void {
    this.cancelSpring()
    if (reducedMotion()) {
      this.velocity = 0
      this.apply(to)
      return
    }
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      const acceleration = -SETTLE_STIFFNESS * (this.x - to) - SETTLE_DAMPING * this.velocity
      this.velocity += acceleration * dt
      const next = this.x + this.velocity * dt
      if (Math.abs(this.velocity) < 1 && Math.abs(next - to) < 0.5) {
        this.velocity = 0
        this.raf = 0
        this.apply(to)
        return
      }
      this.apply(next)
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }
}

function reducedMotion(): boolean {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset['reduceMotion'] === 'true'
  )
}
