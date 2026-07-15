import { Component, computed, effect, input, output, signal, untracked } from '@angular/core'
import type { OnDestroy } from '@angular/core'
import { MatButton, MatIconButton } from '@angular/material/button'
import { Check, LucideAngularModule, Puzzle, RotateCcw, Timer, X, Zap } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { success } from '@app/shared/domain'
import { buildTiles, initMatch, matchReducer, remainingPairs } from '../commands/match-index'
import type { MatchAction, MatchCard, MatchState } from '../commands/match-index'

const WRONG_MS = 640

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * The match game over the pure match machine: a two-column board of term and
 * definition tiles, timer and move chips, mismatch shake, and the win overlay.
 */
@Component({
  selector: 'ms-match-board',
  imports: [MatButton, MatIconButton, LucideAngularModule, TranslocoPipe],
  template: `
    @if (cards().length < 2) {
      <div class="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
        <div class="grid size-16 place-items-center rounded-card-featured bg-info-surface">
          <lucide-icon [img]="icons.puzzle" class="size-8 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h2 class="mb-1 text-[length:var(--ms-text-headline)] font-bold text-heading">
            {{ 'match.notEnough' | transloco }}
          </h2>
          <p class="mx-auto max-w-[34ch] text-[length:var(--ms-text-body)]">
            {{ 'match.notEnoughHint' | transloco }}
          </p>
        </div>
        <button matButton="filled" type="button" (click)="back.emit()">
          {{ 'match.back' | transloco }}
        </button>
      </div>
    } @else {
      <div class="relative flex h-full flex-col overflow-hidden">
        <div class="px-5 pt-safe">
          <div class="flex items-center justify-between gap-2 pt-3">
            <button
              matIconButton
              type="button"
              class="bg-card-glass shadow-rest"
              [attr.aria-label]="'match.goBack' | transloco"
              (click)="back.emit()"
            >
              <lucide-icon [img]="icons.x" class="size-5" aria-hidden="true" />
            </button>
            <div class="min-w-0 flex-1 text-center">
              <h1 class="truncate text-[length:var(--ms-text-title)] font-semibold text-heading">
                {{ 'match.title' | transloco }}
              </h1>
              @if (subtitle()) {
                <p class="truncate text-[length:var(--ms-text-label)]">{{ subtitle() }}</p>
              }
            </div>
            <button
              matIconButton
              type="button"
              class="bg-card-glass shadow-rest"
              [attr.aria-label]="'match.restart' | transloco"
              (click)="restart()"
            >
              <lucide-icon [img]="icons.retry" class="size-5" aria-hidden="true" />
            </button>
          </div>

          <div class="mt-4 flex items-center justify-center gap-2">
            <span class="ms-chip">
              <lucide-icon [img]="icons.timer" class="size-3.5" aria-hidden="true" />
              {{ time() }}
            </span>
            <span class="ms-chip">
              <lucide-icon [img]="icons.zap" class="size-3.5" aria-hidden="true" />
              {{ 'match.moves' | transloco: { count: state().moves } }}
            </span>
            <span class="ms-chip">
              {{ 'match.pairsLeft' | transloco: { count: pairsLeft() } }}
            </span>
          </div>
        </div>

        <p
          class="px-5 pt-3 pb-2 text-center text-[length:var(--ms-text-label)] font-medium text-muted-foreground"
        >
          {{ 'match.instruction' | transloco }}
        </p>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-6 scrollbar-hide">
          <div class="grid auto-rows-fr grid-cols-2 gap-2.5">
            @for (tile of board(); track tile.id) {
              <button
                type="button"
                (click)="dispatch({ type: 'pick', tileId: tile.id })"
                class="flex min-h-[92px] items-center rounded-card border p-3 text-left transition-colors"
                [class]="tileTone(tile.id)"
                [class.ms-shake]="isWrong(tile.id)"
              >
                <span
                  class="text-[length:var(--ms-text-sub)] leading-snug break-words"
                  [class]="
                    tile.kind === 'term'
                      ? 'font-semibold text-heading'
                      : 'font-medium text-muted-foreground'
                  "
                >
                  {{ tile.text }}
                </span>
              </button>
            }
          </div>
        </div>

        @if (state().status === 'won') {
          <div
            class="ms-won absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-card-glass px-8 text-center"
          >
            <div
              class="ms-won-badge mb-3 grid size-20 place-items-center rounded-full bg-gradient-to-br from-primary to-accent shadow-interactive"
            >
              <lucide-icon
                [img]="icons.check"
                class="size-10 text-primary-foreground"
                aria-hidden="true"
              />
            </div>
            <h2 class="text-[length:var(--ms-text-headline)] font-bold text-heading">
              {{ 'match.complete' | transloco }}
            </h2>
            <p class="text-[length:var(--ms-text-body)] text-muted-foreground">
              {{ time() }} · {{ 'match.summary' | transloco: { moves: state().moves } }}
            </p>
            <div class="mt-5 flex w-full max-w-xs flex-col gap-3">
              <button matButton="filled" type="button" class="w-full" (click)="restart()">
                <lucide-icon [img]="icons.retry" class="size-5" aria-hidden="true" />
                {{ 'match.playAgain' | transloco }}
              </button>
              <button matButton="tonal" type="button" class="w-full" (click)="completed.emit()">
                {{ 'match.done' | transloco }}
              </button>
            </div>
          </div>
        }
      </div>
    }
  `,
  host: { class: 'relative mx-auto block h-full w-full max-w-[430px]' },
  styles: `
    .ms-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      border-radius: var(--radius-pill);
      background: var(--info-surface);
      padding: 0.125rem 0.5rem;
      font-size: var(--ms-text-tiny);
      font-weight: 600;
      color: var(--info-foreground);
      font-variant-numeric: tabular-nums;
    }

    @keyframes ms-shake {
      20% {
        translate: -7px 0;
      }
      40% {
        translate: 7px 0;
      }
      60% {
        translate: -5px 0;
      }
      80% {
        translate: 5px 0;
      }
    }

    @keyframes ms-fade-in {
      from {
        opacity: 0;
      }
    }

    @keyframes ms-pop-in {
      from {
        opacity: 0;
        scale: 0.6;
      }
    }

    @media (prefers-reduced-motion: no-preference) {
      .ms-shake {
        animation: ms-shake 0.5s ease-in-out;
      }

      .ms-won {
        animation: ms-fade-in 0.25s ease-out;
      }

      .ms-won-badge {
        animation: ms-pop-in 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      }
    }
  `,
})
export class MatchBoard implements OnDestroy {
  readonly cards = input.required<MatchCard[]>()
  readonly subtitle = input('')
  readonly back = output<void>()
  readonly completed = output<void>()

  protected readonly icons = {
    puzzle: Puzzle,
    check: Check,
    retry: RotateCcw,
    timer: Timer,
    x: X,
    zap: Zap,
  }

  protected readonly state = signal<MatchState>(initMatch([]))
  protected readonly elapsed = signal(0)
  private ticker: number | undefined
  private wrongTimer: number | undefined

  constructor() {
    // A new card set deals a fresh board.
    effect(() => {
      const cards = this.cards()
      untracked(() => {
        this.state.set(initMatch(buildTiles(cards)))
        this.elapsed.set(0)
      })
    })

    // The clock runs while the game does.
    effect(() => {
      const playing = this.state().status === 'playing'
      window.clearInterval(this.ticker)
      if (playing) {
        this.ticker = window.setInterval(() => this.elapsed.update((value) => value + 1), 1000)
      }
    })

    // A mismatch shows briefly, then clears itself.
    effect(() => {
      const hasWrong = this.state().wrong.length > 0
      window.clearTimeout(this.wrongTimer)
      if (hasWrong) {
        this.wrongTimer = window.setTimeout(() => this.dispatch({ type: 'clearWrong' }), WRONG_MS)
      }
    })

    // Winning is felt.
    effect(() => {
      if (this.state().status === 'won') success()
    })
  }

  ngOnDestroy(): void {
    window.clearInterval(this.ticker)
    window.clearTimeout(this.wrongTimer)
  }

  protected dispatch(action: MatchAction): void {
    this.state.update((state) => matchReducer(state, action))
  }

  protected restart(): void {
    this.state.set(initMatch(buildTiles(this.cards())))
    this.elapsed.set(0)
  }

  protected readonly board = computed(() => {
    const state = this.state()
    return state.tiles.filter((tile) => !state.matched.includes(tile.id))
  })

  protected readonly pairsLeft = computed(() => remainingPairs(this.state()))
  protected readonly time = computed(() => formatTime(this.elapsed()))

  protected isWrong(tileId: string): boolean {
    return this.state().wrong.includes(tileId)
  }

  protected tileTone(tileId: string): string {
    if (this.isWrong(tileId)) return 'border-[var(--danger)] bg-[var(--danger-surface)]'
    if (this.state().selected.includes(tileId)) {
      return 'border-primary bg-info-surface ring-2 ring-[color-mix(in_oklch,var(--primary)_20%,transparent)]'
    }
    return 'border-border bg-card shadow-rest'
  }
}
