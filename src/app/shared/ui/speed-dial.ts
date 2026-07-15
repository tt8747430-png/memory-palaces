import { Component, computed, effect, input, signal, viewChildren } from '@angular/core'
import type { ElementRef } from '@angular/core'
import { MatFabButton } from '@angular/material/button'
import { LucideAngularModule, Plus } from 'lucide-angular'
import type { LucideIconData } from 'lucide-angular'

export interface SpeedDialAction {
  id: string
  label: string
  icon: LucideIconData
  onSelect: () => void
}

/**
 * Floating create button above the bottom nav. One action fires directly; several
 * fan out as labeled buttons over a scrim. Escape or the scrim closes the fan.
 */
@Component({
  selector: 'ms-speed-dial',
  imports: [MatFabButton, LucideAngularModule],
  template: `
    @if (open()) {
      <div
        aria-hidden="true"
        (click)="open.set(false)"
        class="ms-scrim fixed inset-0 bg-[oklch(29%_0.063_254.3_/_0.3)] backdrop-blur-[2px]"
        style="z-index: calc(var(--ms-z-nav) + 10)"
      ></div>
    }

    <div
      class="fixed right-5 flex flex-col items-end gap-3"
      [class]="
        dock() === 'above-nav'
          ? 'bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]'
          : 'bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+0.75rem)]'
      "
      style="z-index: calc(var(--ms-z-nav) + 20)"
    >
      @if (open()) {
        <ul class="m-0 flex list-none flex-col items-end gap-3 p-0">
          @for (action of actions(); track action.id; let index = $index) {
            <li
              class="ms-dial-item flex items-center"
              [style.animation-delay.ms]="(actions().length - 1 - index) * 45"
            >
              <button
                #actionBtn
                type="button"
                [attr.aria-label]="action.label"
                (click)="fire(action)"
                class="group flex items-center gap-2.5 rounded-full transition-transform active:scale-[0.97] focus-visible:outline-none"
              >
                <span
                  class="rounded-full bg-card px-3 py-1 text-[length:var(--ms-text-label)] font-semibold text-heading shadow-rest transition-colors group-hover:bg-info-surface"
                >
                  {{ action.label }}
                </span>
                <span
                  class="grid size-12 place-items-center rounded-full bg-card text-primary shadow-rest transition-colors group-hover:bg-info-surface group-focus-visible:ring-2 group-focus-visible:ring-primary/50"
                >
                  <lucide-icon [img]="action.icon" class="size-5" aria-hidden="true" />
                </span>
              </button>
            </li>
          }
        </ul>
      }

      <button
        matFab
        type="button"
        class="ms-fab"
        [attr.aria-label]="soleAction()?.label ?? label()"
        [attr.aria-expanded]="soleAction() ? null : open()"
        [attr.aria-haspopup]="soleAction() ? null : 'menu'"
        (click)="trigger()"
        (keydown.escape)="open.set(false)"
      >
        <lucide-icon
          [img]="plus"
          class="ms-fab-icon size-6"
          [class.ms-fab-icon-open]="open() && !soleAction()"
          aria-hidden="true"
        />
      </button>
    </div>
  `,
  host: { '(document:keydown.escape)': 'open.set(false)' },
  styles: `
    .ms-fab {
      --mat-fab-container-color: var(--primary);
      --mat-fab-foreground-color: var(--primary-foreground);
      border-radius: var(--radius-pill);
      box-shadow: var(--shadow-interactive);
    }

    .ms-fab-icon {
      transition: rotate 0.22s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .ms-fab-icon-open {
      rotate: 45deg;
    }

    @keyframes ms-dial-in {
      from {
        opacity: 0;
        translate: 0 14px;
        scale: 0.8;
      }
    }

    @keyframes ms-scrim-in {
      from {
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: no-preference) {
      .ms-dial-item {
        animation: ms-dial-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) backwards;
      }

      .ms-scrim {
        animation: ms-scrim-in 0.2s ease-out;
      }
    }
  `,
})
export class SpeedDial {
  readonly label = input.required<string>()
  readonly actions = input.required<SpeedDialAction[]>()
  /** Where the dial floats: above the bottom nav (default) or at the screen edge. */
  readonly dock = input<'above-nav' | 'edge'>('above-nav')

  protected readonly plus = Plus
  protected readonly open = signal(false)
  protected readonly soleAction = computed(() =>
    this.actions().length === 1 ? this.actions()[0] : null,
  )

  private readonly actionButtons = viewChildren<ElementRef<HTMLButtonElement>>('actionBtn')

  constructor() {
    effect(() => {
      const first = this.actionButtons()[0]
      if (this.open() && first) first.nativeElement.focus()
    })
  }

  protected trigger(): void {
    const sole = this.soleAction()
    if (sole) {
      sole.onSelect()
      return
    }
    this.open.update((value) => !value)
  }

  protected fire(action: SpeedDialAction): void {
    this.open.set(false)
    action.onSelect()
  }
}
