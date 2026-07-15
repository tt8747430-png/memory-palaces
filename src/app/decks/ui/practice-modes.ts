import { Component, computed, inject, input, output } from '@angular/core'
import { Brain, ChevronRight, LucideAngularModule, Puzzle } from 'lucide-angular'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'

/** Practice entry points for a deck: Match (needs 2+ cards) and Test (questions). */
@Component({
  selector: 'ms-practice-modes',
  imports: [LucideAngularModule, TranslocoPipe],
  template: `
    <button
      type="button"
      (click)="match.emit()"
      [disabled]="cardCount() < 2"
      class="flex w-full items-center gap-3.5 rounded-card border border-border bg-card p-3.5 text-left shadow-rest transition-[opacity,scale] active:scale-[0.98] disabled:opacity-45"
    >
      <span
        class="grid size-11 shrink-0 place-items-center rounded-control bg-primary text-primary-foreground"
        aria-hidden="true"
      >
        <lucide-icon [img]="icons.puzzle" class="size-5" aria-hidden="true" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-[length:var(--ms-text-sub)] font-semibold text-heading">
          {{ 'practice.match' | transloco }}
        </span>
        <span class="block truncate text-[length:var(--ms-text-label)] text-muted-foreground">
          {{ 'practice.matchSub' | transloco }}
        </span>
      </span>
      <lucide-icon
        [img]="icons.chevronRight"
        class="size-5 shrink-0 text-muted-foreground/70"
        aria-hidden="true"
      />
    </button>

    <button
      type="button"
      (click)="test.emit()"
      class="flex w-full items-center gap-3.5 rounded-card border border-border bg-card p-3.5 text-left shadow-rest transition-[opacity,scale] active:scale-[0.98]"
    >
      <span
        class="grid size-11 shrink-0 place-items-center rounded-control bg-primary text-primary-foreground"
        aria-hidden="true"
      >
        <lucide-icon [img]="icons.brain" class="size-5" aria-hidden="true" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-[length:var(--ms-text-sub)] font-semibold text-heading">
          {{ 'practice.test' | transloco }}
        </span>
        <span class="block truncate text-[length:var(--ms-text-label)] text-muted-foreground">
          {{ testSub() }}
        </span>
      </span>
      <lucide-icon
        [img]="icons.chevronRight"
        class="size-5 shrink-0 text-muted-foreground/70"
        aria-hidden="true"
      />
    </button>
  `,
  host: { class: 'flex flex-col gap-2.5' },
})
export class PracticeModes {
  readonly cardCount = input.required<number>()
  readonly questionCount = input.required<number>()
  readonly match = output<void>()
  readonly test = output<void>()

  private readonly transloco = inject(TranslocoService)

  protected readonly icons = { puzzle: Puzzle, brain: Brain, chevronRight: ChevronRight }

  /** Test always stays enabled here — with no questions it opens the manage screen. */
  protected readonly testSub = computed(() => {
    const count = this.questionCount()
    if (count > 0) {
      return this.transloco.translate(
        count === 1 ? 'practice.testSubOne' : 'practice.testSubOther',
        {
          count,
        },
      )
    }
    return this.transloco.translate('practice.testManage')
  })
}
