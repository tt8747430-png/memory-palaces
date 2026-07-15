import { Component, computed, input, output } from '@angular/core'
import { MatButton } from '@angular/material/button'
import { Check, GraduationCap, LucideAngularModule } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'

export interface StudyBreakdown {
  new: number
  learning: number
  known: number
}

/** Today's study standing for a deck: the due count with its maturity breakdown and
 *  the study call-to-action — or a caught-up state offering to study ahead. */
@Component({
  selector: 'ms-study-overview-card',
  imports: [MatButton, LucideAngularModule, TranslocoPipe],
  template: `
    @if (count() === 0) {
      <div
        class="flex flex-col items-center gap-3 rounded-card-featured bg-card-glass py-7 text-center shadow-featured"
      >
        <span
          class="grid size-12 place-items-center rounded-card-featured bg-card text-[var(--success-foreground)] shadow-rest"
        >
          <lucide-icon [img]="icons.check" class="size-6" aria-hidden="true" />
        </span>
        <p class="text-[length:var(--ms-text-sub)] font-semibold text-heading">
          {{ 'study.caughtUp' | transloco }}
        </p>
        <button matButton="tonal" type="button" (click)="studyAhead.emit()">
          {{ 'study.studyAhead' | transloco }}
        </button>
      </div>
    } @else {
      <div class="space-y-4 rounded-card-featured bg-card-glass p-5 text-center shadow-featured">
        <div>
          <p class="ms-count text-[56px] leading-none font-bold text-heading tabular-nums">
            {{ count() }}
          </p>
          <p class="mt-1 text-[length:var(--ms-text-body)] font-medium text-secondary">
            {{
              (count() === 1 ? 'study.cardsForTodayOne' : 'study.cardsForTodayOther')
                | transloco: { count: count() }
            }}
          </p>
        </div>

        <dl class="grid grid-cols-3 gap-2">
          @for (item of items(); track item.key) {
            <div class="rounded-control bg-info-surface px-2 py-2">
              <dd
                class="text-[length:var(--ms-text-sub)] leading-none font-bold text-heading tabular-nums"
              >
                {{ item.value }}
              </dd>
              <dt class="mt-1 text-[length:var(--ms-text-tiny)] font-medium text-secondary">
                {{ 'srs.' + item.key | transloco }}
              </dt>
            </div>
          }
        </dl>

        <button matButton="filled" type="button" class="w-full" (click)="study.emit()">
          <lucide-icon [img]="icons.graduationCap" class="size-[18px]" aria-hidden="true" />
          {{ 'study.studyCards' | transloco }}
        </button>
      </div>
    }
  `,
  host: { class: 'block' },
  styles: `
    @keyframes ms-count-in {
      from {
        opacity: 0;
        scale: 0.9;
      }
    }

    @media (prefers-reduced-motion: no-preference) {
      .ms-count {
        animation: ms-count-in 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      }
    }
  `,
})
export class StudyOverviewCard {
  readonly count = input.required<number>()
  readonly breakdown = input.required<StudyBreakdown>()
  readonly study = output<void>()
  readonly studyAhead = output<void>()

  protected readonly icons = { check: Check, graduationCap: GraduationCap }

  protected readonly items = computed(() => {
    const breakdown = this.breakdown()
    return [
      { key: 'new' as const, value: breakdown.new },
      { key: 'learning' as const, value: breakdown.learning },
      { key: 'known' as const, value: breakdown.known },
    ]
  })
}
